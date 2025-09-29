import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface SearchParams {
  purpose?: string;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  location?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  limit?: number;
  telegram_user_id?: number;
  query?: string;
}

interface PropertyResult {
  id: string;
  external_id: string;
  title: string;
  price: number;
  property_type: string;
  purpose: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  location_area: string;
  images: string[];
  agent_name: string;
  agent_phone: string;
}

async function searchProperties(params: SearchParams): Promise<{
  success: boolean;
  data?: PropertyResult[];
  count?: number;
  error?: string;
}> {
  try {
    console.log('Searching properties with params:', params);

    // Use the new unified database function 
    const { data, error } = await supabase.rpc('search_properties_unified', {
      search_purpose: params.purpose || null,
      min_price_param: params.min_price || null,
      max_price_param: params.max_price || null,
      property_type_param: params.property_type || null,
      location_param: params.location || null,
      min_bedrooms_param: params.min_bedrooms || null,
      max_bedrooms_param: params.max_bedrooms || null,
      housing_status_param: null,
      limit_param: params.limit || 50
    });

    if (error) {
      console.error('Database search error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Found ${data?.length || 0} properties`);
    return {
      success: true,
      data: data || [],
      count: data?.length || 0
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function saveSearchHistory(telegramUserId: number, query: string, filters: any, resultsCount: number) {
  try {
    await supabase
      .from('search_history')
      .insert({
        telegram_user_id: telegramUserId,
        search_query: query,
        search_filters: filters,
        results_count: resultsCount
      });
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

async function getUserPreferences(telegramUserId: number) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
}

function formatPropertyForTelegram(property: PropertyResult): string {
  const images = property.images && property.images.length > 0 
    ? `📸 ${property.images.length} фото доступно` 
    : '';

  const bedrooms = property.bedrooms ? `🛏️ ${property.bedrooms} спальни` : '';
  const bathrooms = property.bathrooms ? `🚿 ${property.bathrooms} ванные` : '';
  const area = property.area_sqft ? `📐 ${property.area_sqft} кв.ft` : '';
  const location = property.location_area ? `📍 ${property.location_area}` : '';
  const agent = property.agent_name ? `👨‍💼 Агент: ${property.agent_name}` : '';
  const phone = property.agent_phone ? `📞 ${property.agent_phone}` : '';

  return `
🏠 <b>${property.title}</b>

💰 Цена: <b>${property.price.toLocaleString()} AED</b>
🏢 Тип: ${property.property_type}
🎯 Назначение: ${property.purpose === 'for-sale' ? 'Продажа' : 'Аренда'}

${[bedrooms, bathrooms, area, location].filter(Boolean).join('\n')}

${images}
${agent}
${phone}

ID: ${property.external_id}
`.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SearchParams = await req.json();
    
    console.log('Property search request:', params);

    // Get user preferences if telegram_user_id is provided
    let userPrefs = null;
    if (params.telegram_user_id) {
      userPrefs = await getUserPreferences(params.telegram_user_id);
      console.log('User preferences:', userPrefs);
    }

    // Apply user preferences as defaults if not specified
    const searchParams: SearchParams = {
      ...params,
      purpose: params.purpose || userPrefs?.purpose || undefined,
      min_price: params.min_price ?? userPrefs?.min_price,
      max_price: params.max_price ?? userPrefs?.max_price,
      min_bedrooms: params.min_bedrooms ?? userPrefs?.min_bedrooms,
      max_bedrooms: params.max_bedrooms ?? userPrefs?.max_bedrooms,
      limit: params.limit || 5
    };

    const searchResult = await searchProperties(searchParams);

    if (!searchResult.success) {
      return new Response(JSON.stringify(searchResult), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save search history
    if (params.telegram_user_id && params.query) {
      await saveSearchHistory(
        params.telegram_user_id,
        params.query,
        searchParams,
        searchResult.count || 0
      );
    }

    // Format results for Telegram if requested
    const formattedResults = searchResult.data?.map(property => ({
      ...property,
      telegram_format: formatPropertyForTelegram(property)
    }));

    const response = {
      success: true,
      count: searchResult.count,
      properties: formattedResults,
      search_params: searchParams,
      user_preferences: userPrefs
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in property search:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});