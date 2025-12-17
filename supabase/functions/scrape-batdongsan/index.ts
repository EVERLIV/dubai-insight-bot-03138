import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Scrape a URL using Firecrawl
async function scrapeUrl(url: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return null;
  }

  try {
    console.log('Scraping URL:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl error:', response.status, error);
      return null;
    }

    const data = await response.json();
    return data.data?.markdown || data.markdown || null;
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
}

// Search batdongsan.com.vn
async function searchBatdongsan(query: string): Promise<string[]> {
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return [];
  }

  try {
    console.log('Searching batdongsan for:', query);
    
    // Search for rental listings in HCMC
    const searchUrl = `https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-tp-hcm${query ? `?keyword=${encodeURIComponent(query)}` : ''}`;
    
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        limit: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl map error:', response.status, error);
      return [];
    }

    const data = await response.json();
    // Filter to only property detail pages
    const links = (data.links || []).filter((link: string) => 
      link.includes('/cho-thue-') && 
      link.includes('-pr') &&
      !link.includes('?')
    );

    console.log('Found', links.length, 'property links');
    return links.slice(0, 10); // Limit to 10 properties
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Parse property data with AI
async function parsePropertyWithAI(markdown: string, url: string): Promise<any | null> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  const systemPrompt = `You are a Vietnamese real estate listing parser. 
Extract property information from the markdown content of batdongsan.com.vn.
Return a JSON object with these fields:
- title: Property title (translate to English if in Vietnamese)
- price: Monthly rent in VND (number only). Look for "triệu/tháng" or "tr/th"
- location_area: District name (e.g., "Quận 1", "District 1", "Bình Thạnh")
- property_type: Type (Căn hộ = Apartment, Phòng trọ = Room, Nhà = House, Biệt thự = Villa)
- bedrooms: Number of bedrooms (look for "PN" or "phòng ngủ")
- bathrooms: Number of bathrooms (look for "WC" or "phòng tắm")
- area_sqft: Area in m² (number only)
- images: Array of image URLs
- agent_name: Contact name
- agent_phone: Phone number

Convert prices: 15 triệu = 15000000 VND
If a field cannot be found, use null.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this batdongsan.com.vn listing:\n\nURL: ${url}\n\n${markdown.slice(0, 8000)}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_property',
            description: 'Extract property details',
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
              required: ['title']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_property' } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', response.status, error);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }

    return null;
  } catch (error) {
    console.error('AI parse error:', error);
    return null;
  }
}

// Save property to database
async function saveProperty(property: any, sourceUrl: string): Promise<number | null> {
  try {
    // Check if already exists by title similarity
    const { data: existing } = await supabase
      .from('property_listings')
      .select('id')
      .eq('source_name', 'batdongsan')
      .ilike('title', `%${property.title?.slice(0, 50)}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Property already exists, skipping:', property.title?.slice(0, 50));
      return null;
    }

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
        images: property.images || [],
        agent_name: property.agent_name,
        agent_phone: property.agent_phone,
        source_name: 'batdongsan',
        source_category: 'scraped',
        housing_status: 'secondary',
        external_id: sourceUrl
      })
      .select('id')
      .single();

    if (error) {
      console.error('Save error:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Save error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, url } = await req.json();
    console.log('Scrape request:', { action, query, url });

    if (action === 'search') {
      // Search and scrape multiple listings
      const urls = await searchBatdongsan(query || '');
      
      if (urls.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No listings found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: any[] = [];
      
      for (const propertyUrl of urls.slice(0, 5)) { // Process max 5
        console.log('Processing:', propertyUrl);
        
        const markdown = await scrapeUrl(propertyUrl);
        if (!markdown) continue;

        const parsed = await parsePropertyWithAI(markdown, propertyUrl);
        if (!parsed) continue;

        const savedId = await saveProperty(parsed, propertyUrl);
        if (savedId) {
          results.push({ id: savedId, title: parsed.title });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return new Response(
        JSON.stringify({ success: true, imported: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'single' && url) {
      // Scrape single URL
      const markdown = await scrapeUrl(url);
      
      if (!markdown) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to scrape URL' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const parsed = await parsePropertyWithAI(markdown, url);
      
      if (!parsed) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to parse listing' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const savedId = await saveProperty(parsed, url);

      return new Response(
        JSON.stringify({ 
          success: true, 
          property: parsed, 
          saved: !!savedId,
          id: savedId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "search" or "single"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});