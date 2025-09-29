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

interface LocationData {
  id: number;
  name: string;
  name_ar?: string;
  type: 'emirate' | 'city' | 'community';
  parent_id?: number;
}

interface FilterData {
  property_types: string[];
  purposes: string[];
  price_ranges: { min: number; max: number; label: string }[];
  bedroom_options: number[];
  bathroom_options: number[];
  area_ranges: { min: number; max: number; label: string }[];
  completion_status: string[];
}

async function getAutoCompleteLocations(query: string): Promise<LocationData[]> {
  try {
    console.log('Fetching autocomplete for query:', query);
    
    const response = await fetch('https://bayut-api1.p.rapidapi.com/auto-complete', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    return [];
  }
}

async function getLocationsList(type: 'emirates' | 'cities' | 'communities', parentId?: number): Promise<LocationData[]> {
  try {
    console.log('Fetching locations for type:', type, 'parent:', parentId);
    
    const endpoint = type === 'emirates' ? 'emirates' : 
                    type === 'cities' ? 'cities' : 'communities';
    
    const requestBody: any = {};
    if (parentId) {
      requestBody.parent_id = parentId;
    }

    const response = await fetch(`https://bayut-api1.p.rapidapi.com/locations/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

async function getFiltersData(): Promise<FilterData> {
  try {
    console.log('Fetching filters data');
    
    const response = await fetch('https://bayut-api1.p.rapidapi.com/get-filters', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return structured filter data
    return {
      property_types: data.property_types || [
        'Apartment', 'Villa', 'Townhouse', 'Studio', 'Office', 'Shop', 'Warehouse'
      ],
      purposes: ['for-sale', 'for-rent'],
      price_ranges: [
        { min: 0, max: 500000, label: '< 500K AED' },
        { min: 500000, max: 1000000, label: '500K - 1M AED' },
        { min: 1000000, max: 2000000, label: '1M - 2M AED' },
        { min: 2000000, max: 5000000, label: '2M - 5M AED' },
        { min: 5000000, max: 999999999, label: '5M+ AED' }
      ],
      bedroom_options: [0, 1, 2, 3, 4, 5, 6],
      bathroom_options: [1, 2, 3, 4, 5, 6],
      area_ranges: [
        { min: 0, max: 500, label: '< 500 sqft' },
        { min: 500, max: 1000, label: '500 - 1000 sqft' },
        { min: 1000, max: 2000, label: '1000 - 2000 sqft' },
        { min: 2000, max: 3000, label: '2000 - 3000 sqft' },
        { min: 3000, max: 999999, label: '3000+ sqft' }
      ],
      completion_status: data.completion_status || [
        'ready', 'under-construction', 'off-plan'
      ]
    };
  } catch (error) {
    console.error('Error fetching filters:', error);
    
    // Return default filters if API fails
    return {
      property_types: ['Apartment', 'Villa', 'Townhouse', 'Studio'],
      purposes: ['for-sale', 'for-rent'],
      price_ranges: [
        { min: 0, max: 500000, label: '< 500K AED' },
        { min: 500000, max: 1000000, label: '500K - 1M AED' },
        { min: 1000000, max: 2000000, label: '1M - 2M AED' },
        { min: 2000000, max: 999999999, label: '2M+ AED' }
      ],
      bedroom_options: [0, 1, 2, 3, 4, 5],
      bathroom_options: [1, 2, 3, 4, 5],
      area_ranges: [
        { min: 0, max: 1000, label: '< 1000 sqft' },
        { min: 1000, max: 2000, label: '1000 - 2000 sqft' },
        { min: 2000, max: 999999, label: '2000+ sqft' }
      ],
      completion_status: ['ready', 'under-construction']
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const query = url.searchParams.get('query');
    const type = url.searchParams.get('type') as 'emirates' | 'cities' | 'communities';
    const parentId = url.searchParams.get('parent_id');

    console.log('Property filters request:', { action, query, type, parentId });

    let response;

    switch (action) {
      case 'autocomplete':
        if (!query) {
          throw new Error('Query parameter is required for autocomplete');
        }
        const suggestions = await getAutoCompleteLocations(query);
        response = { success: true, data: suggestions };
        break;

      case 'locations':
        if (!type) {
          throw new Error('Type parameter is required for locations');
        }
        const locations = await getLocationsList(type, parentId ? parseInt(parentId) : undefined);
        response = { success: true, data: locations };
        break;

      case 'filters':
      default:
        const filters = await getFiltersData();
        response = { success: true, data: filters };
        break;
    }

    // Log API usage
    const executionTime = Date.now() - startTime;
    await supabase
      .from('api_usage_logs')
      .insert({
        api_source: 'bayut',
        endpoint: `/property-filters?action=${action}`,
        request_params: { action, query, type, parentId },
        response_status: 200,
        execution_time_ms: executionTime
      });

    console.log('Property filters response:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in property filters:', error);
    
    const executionTime = Date.now() - startTime;
    await supabase
      .from('api_usage_logs')
      .insert({
        api_source: 'bayut',
        endpoint: '/property-filters',
        request_params: {},
        response_status: 500,
        execution_time_ms: executionTime
      });
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});