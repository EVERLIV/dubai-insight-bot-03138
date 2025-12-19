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

// District URLs for targeted scraping
const DISTRICT_URLS: Record<string, string> = {
  'district-1': 'https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-quan-1',
  'district-2': 'https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-quan-2',
  'district-3': 'https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-quan-3',
  'district-7': 'https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-quan-7',
  'thao-dien': 'https://batdongsan.com.vn/cho-thue-can-ho-chung-cu-phuong-thao-dien',
};

// Extract district number from Vietnamese title (e.g., "Quận 7" → "7")
function extractDistrictFromTitle(title: string): string | null {
  const match = title.match(/Qu[aậ]n\s*(\d+)/i);
  if (match) return match[1];
  
  // Also check for Thảo Điền, Bình Thạnh, etc.
  if (/Th[aả]o\s*[ĐD]i[eề]n/i.test(title)) return 'Thảo Điền';
  if (/B[iì]nh\s*Th[aạ]nh/i.test(title)) return 'Bình Thạnh';
  if (/Thu\s*[ĐD][uứ]c/i.test(title)) return 'Thủ Đức';
  
  return null;
}

// Search batdongsan.com.vn by district - scrape listing page and extract property links
async function searchByDistrict(districtKey: string): Promise<string[]> {
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return [];
  }

  const searchUrl = DISTRICT_URLS[districtKey];
  if (!searchUrl) {
    console.error('Unknown district:', districtKey);
    return [];
  }

  try {
    console.log('Searching district:', districtKey, 'URL:', searchUrl);
    
    // Use scrape with links format to get all links from the page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['links'],
        waitFor: 5000, // Wait for JS to load
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl scrape error:', response.status, error);
      return [];
    }

    const data = await response.json();
    const allLinks = data.data?.links || data.links || [];
    console.log('Firecrawl returned', allLinks.length, 'total links');
    
    // Filter to only rental apartment detail pages (looking for -pr followed by numbers)
    const links = allLinks.filter((link: string) => 
      link.includes('batdongsan.com.vn') &&
      link.includes('-pr') &&
      /\-pr\d+$/.test(link) && // Ends with -prXXXXXX (property ID)
      !link.includes('/ban-') // Exclude sales
    );

    console.log('Found', links.length, 'rental apartment links in', districtKey);
    if (links.length === 0 && allLinks.length > 0) {
      // Log sample links to debug
      const sampleLinks = allLinks.filter((l: string) => l.includes('-pr')).slice(0, 3);
      console.log('Sample -pr links:', sampleLinks);
    }
    return links.slice(0, 15); // Limit to 15 per district
  } catch (error) {
    console.error('District search error:', error);
    return [];
  }
}

// Search batdongsan.com.vn (general search)
async function searchBatdongsan(query: string): Promise<string[]> {
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return [];
  }

  try {
    console.log('Searching batdongsan for:', query);
    
    // Search for rental apartments in HCMC
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
    // Filter to only rental apartment detail pages
    const links = (data.links || []).filter((link: string) => 
      link.includes('/cho-thue-can-ho') && 
      link.includes('-pr') &&
      !link.includes('?') &&
      !link.includes('/ban-')
    );

    console.log('Found', links.length, 'property links');
    return links.slice(0, 10);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Auto-scrape targeted districts (for cron job)
async function autoScrapeDistricts(): Promise<{ district: string; imported: number }[]> {
  const targetDistricts = ['district-1', 'district-2', 'district-3', 'district-7', 'thao-dien'];
  const results: { district: string; imported: number }[] = [];
  
  console.log('Starting auto-scrape for districts:', targetDistricts);
  
  for (const district of targetDistricts) {
    const urls = await searchByDistrict(district);
    let imported = 0;
    
    for (const url of urls.slice(0, 5)) { // Max 5 per district per run
      console.log(`[${district}] Processing:`, url);
      
      const markdown = await scrapeUrl(url);
      if (!markdown) continue;

      const parsed = await parsePropertyWithAI(markdown, url);
      if (!parsed) continue;

      const savedId = await saveProperty(parsed, url);
      if (savedId) {
        imported++;
        console.log(`[${district}] Saved property #${savedId}: ${parsed.title}`);
      }
      
      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    results.push({ district, imported });
    console.log(`[${district}] Imported ${imported} properties`);
    
    // Pause between districts
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('Auto-scrape completed. Results:', results);
  return results;
}

// Parse property data with AI
async function parsePropertyWithAI(markdown: string, url: string): Promise<any | null> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

const systemPrompt = `Ты парсер объявлений недвижимости с сайта batdongsan.com.vn.
Извлеки информацию из markdown-контента и верни JSON.

ВАЖНО для заголовка (title):
- Переведи заголовок на РУССКИЙ язык
- Сделай его КОРОТКИМ (максимум 50-60 символов)
- Формат: "[Тип] [Комнаты]ПН в [Район на русском]"
- ОБЯЗАТЕЛЬНО переводи названия районов на русский:
  - Quận 1, District 1 → Район 1
  - Quận 2, District 2 → Район 2
  - Quận 7, District 7 → Район 7
  - Bình Thạnh, Binh Thanh → Бинь Тхань
  - Thủ Đức, Thu Duc → Тху Дык
  - Thảo Điền, Thao Dien → Тхао Дьен
  - Phú Nhuận, Phu Nhuan → Фу Нхуан
  - Gò Vấp, Go Vap → Го Вап
  - Tân Bình, Tan Binh → Тан Бинь
- Примеры: "Квартира 2ПН в Район 7", "Студия в Бинь Тхань", "Апартаменты 3ПН в Тхао Дьен"

Для поля location_area тоже переводи на русский!

Поля для извлечения:
- title: Короткий русский заголовок (см. формат выше)
- price: Аренда в VND (число). "15 triệu/tháng" = 15000000
- location_area: Район НА РУССКОМ (Район 1, Бинь Тхань, Тху Дык, etc.)
- property_type: Тип (Căn hộ = Apartment, Phòng trọ = Room, Nhà = House, Biệt thự = Villa)
- bedrooms: Спальни (ищи "PN" или "phòng ngủ")
- bathrooms: Ванные (ищи "WC" или "phòng tắm")
- area_sqft: Площадь в m² (только число)
- images: Массив URL картинок
- agent_name: Имя контакта
- agent_phone: Телефон

Если поле не найдено - null.`;

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

    // Extract district from title
    const district = extractDistrictFromTitle(property.title || '') || property.location_area;

    const { data, error } = await supabase
      .from('property_listings')
      .insert({
        title: property.title,
        price: property.price,
        location_area: property.location_area,
        district: district,
        property_type: property.property_type,
        purpose: 'for-rent',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area_sqft: property.area_sqft,
        images: property.images || [],
        agent_name: 'RentHCM',
        agent_phone: 'https://t.me/renthcm',
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

    if (action === 'auto') {
      // Auto-scrape targeted districts (District 9, Thu Duc, Thảo Điền)
      console.log('Starting auto-scrape job...');
      
      const results = await autoScrapeDistricts();
      const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          mode: 'auto',
          districts: results,
          totalImported,
          timestamp: new Date().toISOString()
        }),
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
      JSON.stringify({ error: 'Invalid action. Use "search", "single", or "auto"' }),
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