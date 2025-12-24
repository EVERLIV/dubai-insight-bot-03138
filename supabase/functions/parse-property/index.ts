import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ParsedProperty {
  title: string;
  price: number | null;
  location_area: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  images: string[];
  agent_name: string | null;
  agent_phone: string | null;
  source_name: string;
}

async function parsePropertyWithAI(text: string, source: string): Promise<ParsedProperty | null> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured');
    return null;
  }

  const systemPrompt = `You are a real estate listing parser for Ho Chi Minh City, Vietnam. 
Extract property information from the text provided. Return a JSON object with these fields:
- title: A descriptive title for the property (in English)
- price: Monthly rent in VND (number only, no currency symbols). Convert from USD if needed (1 USD ≈ 25,000 VND)
- location_area: District/area name (e.g., "District 1", "Thao Dien", "Binh Thanh")
- property_type: Type of property (Apartment, Studio, Villa, House, Room)
- bedrooms: Number of bedrooms (integer)
- bathrooms: Number of bathrooms (integer)
- area_sqft: Area in square meters (integer)
- images: Array of image URLs found in the text
- agent_name: Contact person name if mentioned
- agent_phone: Phone number if mentioned

If a field cannot be determined, use null. Be accurate with numbers.
For Vietnamese text, translate the title to English.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this property listing from ${source}:\n\n${text}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_property',
            description: 'Extract property details from listing text',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                price: { type: ['number', 'null'] },
                location_area: { type: ['string', 'null'] },
                property_type: { type: ['string', 'null'] },
                bedrooms: { type: ['integer', 'null'] },
                bathrooms: { type: ['integer', 'null'] },
                area_sqft: { type: ['integer', 'null'] },
                images: { type: 'array', items: { type: 'string' } },
                agent_name: { type: ['string', 'null'] },
                agent_phone: { type: ['string', 'null'] }
              },
              required: ['title', 'images']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_property' } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        ...parsed,
        images: parsed.images || [],
        source_name: source
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing property:', error);
    return null;
  }
}

async function saveProperty(property: ParsedProperty): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .insert({
        title: property.title,
        price: property.price,
        location_area: property.location_area,
        property_type: property.property_type,
        purpose: 'for-rent',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area_sqft: property.area_sqft,
        images: property.images,
        agent_name: property.agent_name,
        agent_phone: property.agent_phone,
        source_name: property.source_name,
        source_category: 'imported',
        housing_status: 'secondary'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving property:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving property:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, source, save } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing property from:', source || 'unknown');

    const parsed = await parsePropertyWithAI(text, source || 'manual');

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse property listing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If save flag is true, save to database
    if (save) {
      const saved = await saveProperty(parsed);
      if (saved) {
        return new Response(
          JSON.stringify({ success: true, property: parsed, saved: true, id: saved.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, property: parsed, saved: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
