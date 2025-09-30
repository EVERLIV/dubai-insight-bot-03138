import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface BayutProperty {
  id: number;
  title: string;
  title_ar?: string;
  reference_number: string;
  purpose: string;
  type: {
    main: string;
    sub: string;
  };
  price: number;
  area?: {
    built_up?: number;
    unit?: string;
  };
  details?: {
    bedrooms?: number;
    bathrooms?: number;
    is_furnished?: boolean;
    completion_status?: string;
  };
  location?: {
    city?: {
      name?: string;
    };
    community?: {
      name?: string;
    };
    sub_community?: {
      name?: string;
    };
    cluster?: {
      name?: string;
    };
  };
  amenities?: string[];
  media?: {
    photos?: string[];
  };
  agent?: {
    name?: string;
    contact?: {
      mobile?: string;
      phone?: string;
    };
  };
}

async function fetchBayutProperties(params: {
  purpose?: string;
  category?: string;
  locations_ids?: number[];
  rooms?: number[];
  baths?: number[];
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  is_completed?: boolean;
  page?: number;
}): Promise<{ success: boolean; data?: BayutProperty[]; error?: string }> {
  try {
    // Build request body according to Bayut API docs
    const requestBody: any = {};
    
    if (params.purpose) {
      requestBody.purpose = params.purpose; // 'for-sale' or 'for-rent'
    }
    
    if (params.category) {
      requestBody.category = params.category; // 'apartments', 'villas', etc.
    }
    
    if (params.locations_ids && params.locations_ids.length > 0) {
      requestBody.locations_ids = params.locations_ids;
    }
    
    if (params.rooms && params.rooms.length > 0) {
      requestBody.rooms = params.rooms;
    }
    
    if (params.baths && params.baths.length > 0) {
      requestBody.baths = params.baths;
    }
    
    if (params.price_min !== undefined) {
      requestBody.price_min = params.price_min;
    }
    
    if (params.price_max !== undefined) {
      requestBody.price_max = params.price_max;
    }
    
    if (params.area_min !== undefined) {
      requestBody.area_min = params.area_min;
    }
    
    if (params.area_max !== undefined) {
      requestBody.area_max = params.area_max;
    }
    
    if (params.is_completed !== undefined) {
      requestBody.is_completed = params.is_completed;
    }
    
    // Sort by popular listings
    requestBody.index = 'popular';
    
    const page = (params.page || 0);
    const url = `https://bayut-api1.p.rapidapi.com/properties_search?page=${page}`;
    
    console.log('Fetching from Bayut API:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY!,
        'x-rapidapi-host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bayut API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Bayut API response received, properties count:', data?.count || 0);
    
    return {
      success: true,
      data: data.results || []
    };
  } catch (error) {
    console.error('Error fetching from Bayut API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function syncPropertyToDB(property: BayutProperty): Promise<boolean> {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('property_listings')
      .select('id')
      .eq('external_id', property.id.toString())
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing property:', selectError);
      return false;
    }

    // Map completion_status to housing_status
    let housingStatus = null;
    if (property.details?.completion_status === 'completed') {
      housingStatus = 'secondary'; // Ready property
    } else if (property.details?.completion_status === 'under-construction') {
      housingStatus = 'primary'; // Off-plan/New project
    }

    // Build location string from nested location data
    const locationParts = [
      property.location?.cluster?.name,
      property.location?.sub_community?.name,
      property.location?.community?.name,
      property.location?.city?.name
    ].filter(Boolean);
    
    const locationArea = locationParts.length > 0 
      ? locationParts.join(', ') 
      : 'Dubai';

    const propertyData = {
      external_id: property.id.toString(),
      source_name: 'bayut_api',
      source_category: 'api',
      title: property.title,
      price: property.price,
      property_type: property.type?.sub || property.type?.main || 'Unknown',
      purpose: property.purpose,
      bedrooms: property.details?.bedrooms ?? null,
      bathrooms: property.details?.bathrooms ?? null,
      area_sqft: property.area?.built_up ?? null,
      location_area: locationArea,
      images: property.media?.photos || [],
      agent_name: property.agent?.name || null,
      agent_phone: property.agent?.contact?.mobile || property.agent?.contact?.phone || null,
      housing_status: housingStatus
    };

    let result;
    if (existing) {
      // Update existing property
      result = await supabase
        .from('property_listings')
        .update({ ...propertyData, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Insert new property
      result = await supabase
        .from('property_listings')
        .insert(propertyData);
    }

    if (result.error) {
      console.error('Error syncing property to DB:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncPropertyToDB:', error);
    return false;
  }
}

async function logAPIUsage(
  source: string,
  endpoint: string,
  params: any,
  status: number,
  executionTime: number
) {
  try {
    await supabase
      .from('api_usage_logs')
      .insert({
        function_name: source,
        endpoint,
        status_code: status,
        response_time_ms: executionTime
      });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const params = await req.json().catch(() => ({}));
    const { 
      purpose, 
      category, 
      locations_ids,
      rooms,
      baths,
      price_min, 
      price_max,
      area_min,
      area_max,
      is_completed,
      pages = 1 
    } = params;
    
    console.log('Starting property sync with params:', params);
    
    let totalSynced = 0;
    let totalFetched = 0;
    
    for (let page = 0; page < pages; page++) {
      const apiResult = await fetchBayutProperties({
        purpose,
        category,
        locations_ids,
        rooms,
        baths,
        price_min,
        price_max,
        area_min,
        area_max,
        is_completed,
        page
      });

      const executionTime = Date.now() - startTime;
      await logAPIUsage('bayut', '/properties_search', params, 
                      apiResult.success ? 200 : 500, executionTime);

      if (!apiResult.success) {
        console.error('Failed to fetch properties from Bayut:', apiResult.error);
        continue;
      }

      const properties = apiResult.data || [];
      totalFetched += properties.length;
      
      console.log(`Processing ${properties.length} properties from page ${page}`);
      
      for (const property of properties) {
        const synced = await syncPropertyToDB(property);
        if (synced) {
          totalSynced++;
        }
      }

      // Add delay between requests to avoid rate limiting
      if (page < pages - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const response = {
      success: true,
      message: `Successfully synced ${totalSynced} out of ${totalFetched} properties`,
      totalFetched,
      totalSynced,
      executionTime: Date.now() - startTime
    };

    console.log('Sync completed:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in property sync:', error);
    
    const executionTime = Date.now() - startTime;
    await logAPIUsage('bayut', '/properties_search', {}, 500, executionTime);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});