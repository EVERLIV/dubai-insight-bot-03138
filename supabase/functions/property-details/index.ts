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

interface PropertyDetail {
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
    plot?: number;
    unit?: string;
  };
  details?: {
    bedrooms?: number;
    bathrooms?: number;
    is_furnished?: boolean;
    completion_status?: string;
    completion_date?: string;
    permit_number?: string;
    developer?: string;
  };
  location?: {
    city?: { name?: string; name_ar?: string };
    community?: { name?: string; name_ar?: string };
    sub_community?: { name?: string; name_ar?: string };
    building?: { name?: string };
    coordinates?: { lat: number; lng: number };
  };
  amenities?: string[];
  media?: {
    photos?: string[];
    videos?: string[];
    virtual_tour?: string;
  };
  agent?: {
    id?: number;
    name?: string;
    company?: string;
    contact?: {
      mobile?: string;
      phone?: string;
      email?: string;
    };
    avatar?: string;
  };
  description?: string;
  features?: string[];
  floor_plan?: string[];
}

interface PriceTrend {
  period: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  total_properties: number;
}

interface MortgageCalculation {
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  down_payment: number;
  loan_amount: number;
  interest_rate: number;
  loan_term_years: number;
}

async function getPropertyDetail(propertyId: string): Promise<PropertyDetail | null> {
  try {
    console.log('Fetching property detail for ID:', propertyId);
    
    const response = await fetch(`https://bayut-api1.p.rapidapi.com/properties/detail/${propertyId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
      }
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    return data.property || null;
  } catch (error) {
    console.error('Error fetching property detail:', error);
    return null;
  }
}

async function getSimilarProperties(propertyId: string, limit: number = 10): Promise<PropertyDetail[]> {
  try {
    console.log('Fetching similar properties for ID:', propertyId);
    
    const response = await fetch('https://bayut-api1.p.rapidapi.com/properties/similar', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        property_id: parseInt(propertyId),
        limit 
      })
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    return data.similar_properties || [];
  } catch (error) {
    console.error('Error fetching similar properties:', error);
    return [];
  }
}

async function getPriceTrends(params: {
  location?: string;
  property_type?: string;
  purpose?: string;
  bedrooms?: number;
}): Promise<PriceTrend[]> {
  try {
    console.log('Fetching price trends for params:', params);
    
    const response = await fetch('https://bayut-api1.p.rapidapi.com/properties/price-trends', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': BAYUT_API_KEY!,
        'X-RapidAPI-Host': 'bayut-api1.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Bayut API error: ${response.status}`);
    }

    const data = await response.json();
    return data.price_trends || [];
  } catch (error) {
    console.error('Error fetching price trends:', error);
    return [];
  }
}

function calculateMortgage(params: {
  property_price: number;
  down_payment_percent: number;
  interest_rate_percent: number;
  loan_term_years: number;
}): MortgageCalculation {
  const { property_price, down_payment_percent, interest_rate_percent, loan_term_years } = params;
  
  const down_payment = property_price * (down_payment_percent / 100);
  const loan_amount = property_price - down_payment;
  const monthly_interest_rate = (interest_rate_percent / 100) / 12;
  const number_of_payments = loan_term_years * 12;
  
  let monthly_payment = 0;
  if (monthly_interest_rate > 0) {
    monthly_payment = loan_amount * (monthly_interest_rate * Math.pow(1 + monthly_interest_rate, number_of_payments)) / 
                     (Math.pow(1 + monthly_interest_rate, number_of_payments) - 1);
  } else {
    monthly_payment = loan_amount / number_of_payments;
  }
  
  const total_payment = monthly_payment * number_of_payments;
  const total_interest = total_payment - loan_amount;
  
  return {
    monthly_payment: Math.round(monthly_payment * 100) / 100,
    total_payment: Math.round(total_payment * 100) / 100,
    total_interest: Math.round(total_interest * 100) / 100,
    down_payment: Math.round(down_payment * 100) / 100,
    loan_amount: Math.round(loan_amount * 100) / 100,
    interest_rate: interest_rate_percent,
    loan_term_years
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const propertyId = url.searchParams.get('property_id');
    
    console.log('Property details request:', { action, propertyId });

    let response;

    switch (action) {
      case 'detail':
        if (!propertyId) {
          throw new Error('Property ID is required for detail action');
        }
        const propertyDetail = await getPropertyDetail(propertyId);
        if (!propertyDetail) {
          throw new Error('Property not found');
        }
        response = { success: true, data: propertyDetail };
        break;

      case 'similar':
        if (!propertyId) {
          throw new Error('Property ID is required for similar action');
        }
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10;
        const similarProperties = await getSimilarProperties(propertyId, limit);
        response = { success: true, data: similarProperties };
        break;

      case 'price-trends':
        const location = url.searchParams.get('location') || undefined;
        const property_type = url.searchParams.get('property_type') || undefined;
        const purpose = url.searchParams.get('purpose') || undefined;
        const bedrooms = url.searchParams.get('bedrooms') ? parseInt(url.searchParams.get('bedrooms')!) : undefined;
        
        const priceTrends = await getPriceTrends({ location, property_type, purpose, bedrooms });
        response = { success: true, data: priceTrends };
        break;

      case 'mortgage-calculate':
        const requestBody = await req.json();
        const { property_price, down_payment_percent = 20, interest_rate_percent = 3.5, loan_term_years = 25 } = requestBody;
        
        if (!property_price) {
          throw new Error('Property price is required for mortgage calculation');
        }
        
        const mortgageCalc = calculateMortgage({
          property_price,
          down_payment_percent,
          interest_rate_percent,
          loan_term_years
        });
        
        response = { success: true, data: mortgageCalc };
        break;

      default:
        throw new Error('Invalid action parameter');
    }

    // Log API usage
    const executionTime = Date.now() - startTime;
    await supabase
      .from('api_usage_logs')
      .insert({
        api_source: 'bayut',
        endpoint: `/property-details?action=${action}`,
        request_params: { action, propertyId },
        response_status: 200,
        execution_time_ms: executionTime
      });

    console.log('Property details response:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in property details:', error);
    
    const executionTime = Date.now() - startTime;
    await supabase
      .from('api_usage_logs')
      .insert({
        api_source: 'bayut',
        endpoint: '/property-details',
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