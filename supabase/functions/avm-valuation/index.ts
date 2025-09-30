import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface PropertyDetails {
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  location_area: string;
  purpose: string;
  price?: number;
  completion_status?: string;
  amenities?: string[];
}

interface ComparableProperty {
  id: string;
  price: number;
  area_sqft: number;
  bedrooms: number;
  location_area: string;
  created_at: string;
}

interface ValuationResult {
  estimated_value: number;
  confidence_score: number;
  comparable_properties: string[];
  valuation_factors: {
    location_factor: number;
    size_factor: number;
    type_factor: number;
    market_trend: number;
    comparable_count: number;
  };
  market_trends: {
    average_price_per_sqft: number;
    median_price: number;
    price_trend: string;
    market_activity: string;
  };
}

async function findComparableProperties(property: PropertyDetails): Promise<ComparableProperty[]> {
  try {
    console.log('Finding comparable properties for:', property);

    // Find similar properties within same area and type
    const { data, error } = await supabase
      .from('property_listings')
      .select(`
        id,
        price,
        area_sqft,
        bedrooms,
        location_area,
        created_at
      `)
      .eq('purpose', property.purpose)
      .eq('property_type', property.property_type)
      .eq('location_area', property.location_area)
      .gte('bedrooms', Math.max(1, property.bedrooms - 1))
      .lte('bedrooms', property.bedrooms + 1)
      .gte('area_sqft', property.area_sqft * 0.7)
      .lte('area_sqft', property.area_sqft * 1.3)
      .gt('price', 0)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error finding comparable properties:', error);
      return [];
    }

    console.log(`Found ${data?.length || 0} comparable properties`);
    return data || [];
  } catch (error) {
    console.error('Error in findComparableProperties:', error);
    return [];
  }
}

async function getMarketTrends(location: string, propertyType: string, purpose: string) {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('price, area_sqft, created_at')
      .eq('location_area', location)
      .eq('property_type', propertyType)
      .eq('purpose', purpose)
      .gt('price', 0)
      .gt('area_sqft', 0)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return {
        average_price_per_sqft: 0,
        median_price: 0,
        price_trend: 'stable',
        market_activity: 'moderate'
      };
    }

    const prices = data.map(p => p.price).sort((a, b) => a - b);
    const pricesPerSqft = data
      .filter(p => p.area_sqft > 0)
      .map(p => p.price / p.area_sqft);

    const averagePricePerSqft = pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];

    // Simple trend analysis based on recent vs older prices
    const recentPrices = data.slice(0, Math.min(10, data.length));
    const olderPrices = data.slice(-Math.min(10, data.length));
    
    const recentAvg = recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b.price, 0) / olderPrices.length;
    
    let priceTrend = 'stable';
    if (recentAvg > olderAvg * 1.05) priceTrend = 'increasing';
    else if (recentAvg < olderAvg * 0.95) priceTrend = 'decreasing';

    const marketActivity = data.length > 30 ? 'high' : data.length > 15 ? 'moderate' : 'low';

    return {
      average_price_per_sqft: Math.round(averagePricePerSqft),
      median_price: Math.round(medianPrice),
      price_trend: priceTrend,
      market_activity: marketActivity
    };
  } catch (error) {
    console.error('Error getting market trends:', error);
    return {
      average_price_per_sqft: 0,
      median_price: 0,
      price_trend: 'stable',
      market_activity: 'moderate'
    };
  }
}

async function generateAIValuation(property: PropertyDetails, comparables: ComparableProperty[], marketTrends: any): Promise<number> {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured');
    }

    const prompt = `
Вы эксперт по оценке недвижимости в Дубае. Проанализируйте следующие данные и дайте точную оценку стоимости:

ОБЪЕКТ ДЛЯ ОЦЕНКИ:
- Тип: ${property.property_type}
- Спальни: ${property.bedrooms}
- Ванные: ${property.bathrooms}
- Площадь: ${property.area_sqft} кв.ft
- Район: ${property.location_area}
- Назначение: ${property.purpose === 'for-sale' ? 'Продажа' : 'Аренда'}
- Статус: ${property.completion_status || 'Неизвестно'}
- Удобства: ${property.amenities?.length || 0} позиций

СОПОСТАВИМЫЕ ОБЪЕКТЫ:
${comparables.map((comp, i) => `
${i + 1}. Цена: ${comp.price} AED, Площадь: ${comp.area_sqft} кв.ft, Спальни: ${comp.bedrooms}
   Цена за кв.ft: ${Math.round(comp.price / comp.area_sqft)} AED
`).join('')}

РЫНОЧНЫЕ ТРЕНДЫ:
- Средняя цена за кв.ft: ${marketTrends.average_price_per_sqft} AED
- Медианная цена: ${marketTrends.median_price} AED
- Тренд цен: ${marketTrends.price_trend}
- Активность рынка: ${marketTrends.market_activity}

ИНСТРУКЦИИ:
1. Проанализируйте сопоставимые объекты
2. Учтите рыночные тренды
3. Примените коррективы на район, площадь, тип объекта
4. Верните ТОЛЬКО число - оценочную стоимость в AED без текста и пояснений

Оценочная стоимость:`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiEstimate = data.choices?.[0]?.message?.content?.trim();
    
    // Extract number from AI response
    const estimateMatch = aiEstimate?.match(/[\d,]+/);
    if (!estimateMatch) {
      throw new Error('Could not parse AI estimate');
    }

    const estimate = parseInt(estimateMatch[0].replace(/,/g, ''));
    console.log('AI estimate:', estimate);
    return estimate;
  } catch (error) {
    console.error('Error generating AI valuation:', error);
    // Fallback to statistical method
    return 0;
  }
}

function calculateStatisticalValuation(property: PropertyDetails, comparables: ComparableProperty[]): ValuationResult {
  if (comparables.length === 0) {
    return {
      estimated_value: 0,
      confidence_score: 0,
      comparable_properties: [],
      valuation_factors: {
        location_factor: 1.0,
        size_factor: 1.0,
        type_factor: 1.0,
        market_trend: 1.0,
        comparable_count: 0
      },
      market_trends: {
        average_price_per_sqft: 0,
        median_price: 0,
        price_trend: 'unknown',
        market_activity: 'low'
      }
    };
  }

  // Calculate base value from comparables
  const pricesPerSqft = comparables
    .filter(comp => comp.area_sqft > 0)
    .map(comp => comp.price / comp.area_sqft);

  const avgPricePerSqft = pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length;
  const baseValue = avgPricePerSqft * property.area_sqft;

  // Apply adjustment factors
  const locationFactor = 1.0; // Same location already filtered
  const sizeFactor = property.area_sqft > 2000 ? 1.05 : property.area_sqft < 800 ? 0.95 : 1.0;
  const typeFactor = 1.0; // Same type already filtered
  const marketTrend = 1.0; // Will be enhanced with real market data

  const adjustedValue = baseValue * locationFactor * sizeFactor * typeFactor * marketTrend;

  // Calculate confidence score based on comparable count and variance
  const priceVariance = pricesPerSqft.reduce((acc, price) => acc + Math.pow(price - avgPricePerSqft, 2), 0) / pricesPerSqft.length;
  const coefficientOfVariation = Math.sqrt(priceVariance) / avgPricePerSqft;
  
  let confidenceScore = Math.max(0.1, Math.min(1.0, 
    (comparables.length / 10) * (1 - Math.min(0.5, coefficientOfVariation))
  ));

  return {
    estimated_value: Math.round(adjustedValue),
    confidence_score: Math.round(confidenceScore * 100) / 100,
    comparable_properties: comparables.map(c => c.id),
    valuation_factors: {
      location_factor: locationFactor,
      size_factor: sizeFactor,
      type_factor: typeFactor,
      market_trend: marketTrend,
      comparable_count: comparables.length
    },
    market_trends: {
      average_price_per_sqft: Math.round(avgPricePerSqft),
      median_price: Math.round(comparables.map(c => c.price).sort((a, b) => a - b)[Math.floor(comparables.length / 2)]),
      price_trend: 'stable',
      market_activity: comparables.length > 5 ? 'moderate' : 'low'
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_details, property_listing_id } = await req.json();
    
    if (!property_details) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Property details are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting AVM valuation for:', property_details);

    // Find comparable properties
    const comparables = await findComparableProperties(property_details);
    console.log(`Found ${comparables.length} comparable properties`);

    // Get market trends
    const marketTrends = await getMarketTrends(
      property_details.location_area,
      property_details.property_type,
      property_details.purpose
    );

    // Calculate statistical valuation
    const statisticalValuation = calculateStatisticalValuation(property_details, comparables);

    // Try to get AI-enhanced valuation
    let finalEstimate = statisticalValuation.estimated_value;
    let aiEstimate = 0;
    
    try {
      aiEstimate = await generateAIValuation(property_details, comparables, marketTrends);
      if (aiEstimate > 0) {
        // Blend statistical and AI estimates (70% statistical, 30% AI)
        finalEstimate = Math.round(statisticalValuation.estimated_value * 0.7 + aiEstimate * 0.3);
      }
    } catch (error) {
      console.log('AI valuation failed, using statistical only:', error instanceof Error ? error.message : String(error));
    }

    const finalValuation: ValuationResult = {
      ...statisticalValuation,
      estimated_value: finalEstimate,
      market_trends: marketTrends
    };

    // Note: Valuation results are returned directly without database storage

    const response = {
      success: true,
      valuation: finalValuation,
      comparable_count: comparables.length,
      ai_enhanced: aiEstimate > 0,
      statistical_estimate: statisticalValuation.estimated_value,
      ai_estimate: aiEstimate
    };

    console.log('AVM valuation completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AVM valuation:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});