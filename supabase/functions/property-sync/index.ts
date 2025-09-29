import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const BAYUT_API_KEY = Deno.env.get('BAYUT_API_KEY');
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
  location?: string;
  property_type?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data?: BayutProperty[]; error?: string }> {
  try {
    // Build request body according to Bayut API docs
    const requestBody: any = {
      page: (params.page || 1) - 1 // Bayut API uses 0-based pagination
    };
    
    if (params.purpose) {
      requestBody.purpose = params.purpose;
    }
    
    if (params.property_type) {
      requestBody.category = params.property_type;
    }
    
    // For location search, we'll need to handle this differently
    // For now, let's search without location filter if not specified
    
    console.log('Fetching from Bayut API with body:', requestBody);
    
    const response = await fetch('https://bayut-api1.p.rapidapi.com/properties_search?page=' + requestBody.page, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bayut API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Bayut API response received, properties count:', data?.results?.length || 0);
    console.log('Sample property structure:', data?.results?.[0] ? JSON.stringify(data.results[0], null, 2) : 'No properties');
    
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
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing property:', selectError);
      return false;
    }

    const propertyData = {
      external_id: property.id.toString(),
      source: 'bayut',
      title: property.title,
      title_ar: property.title_ar || null,
      price: property.price,
      property_type: property.type?.sub || property.type?.main || 'Unknown',
      purpose: property.purpose,
      bedrooms: property.details?.bedrooms || null,
      bathrooms: property.details?.bathrooms || null,
      area_sqft: property.area?.built_up || null,
      location_area: property.location?.community?.name || property.location?.sub_community?.name || null,
      location_city: property.location?.city?.name || 'Dubai',
      amenities: property.amenities || [],
      images: property.media?.photos || [],
      agent_name: property.agent?.name || null,
      agent_phone: property.agent?.contact?.mobile || property.agent?.contact?.phone || null,
      completion_status: property.details?.completion_status || null,
      is_furnished: property.details?.is_furnished || false,
      raw_data: property,
      last_verified: new Date().toISOString()
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
        api_source: source,
        endpoint,
        request_params: params,
        response_status: status,
        execution_time_ms: executionTime
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
    const { purpose, location, property_type, pages = 1 } = await req.json().catch(() => ({}));
    
    console.log('Starting property sync with params:', { purpose, location, property_type, pages });
    
    let totalSynced = 0;
    let totalFetched = 0;
    
    for (let page = 1; page <= pages; page++) {
      const apiResult = await fetchBayutProperties({
        purpose,
        location,
        property_type,
        page,
        limit: 50
      });

      const executionTime = Date.now() - startTime;
      await logAPIUsage('bayut', '/properties_search', { purpose, location, property_type, page }, 
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
      if (page < pages) {
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