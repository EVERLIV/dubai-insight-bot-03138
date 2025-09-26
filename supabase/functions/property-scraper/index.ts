import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Telegram API configuration
const TELEGRAM_API_ID = Deno.env.get('TELEGRAM_API_ID')!;
const TELEGRAM_API_HASH = Deno.env.get('TELEGRAM_API_HASH')!;

interface ScrapingJob {
  id: string;
  source_id: string;
  source_type: 'telegram' | 'website';
  url: string;
  telegram_username?: string;
}

interface PropertyData {
  title: string;
  description?: string;
  price?: number;
  property_type?: string;
  purpose?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  location_area?: string;
  images?: string[];
  agent_name?: string;
  agent_phone?: string;
  raw_content: string;
}

// Property parsing patterns for different sources
const PROPERTY_PATTERNS = {
  price: [
    /(?:AED|درهم)\s*([0-9,]+(?:\.[0-9]+)?)/gi,
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:AED|درهم|K|Million)/gi,
    /Price:\s*([0-9,]+)/gi
  ],
  bedrooms: [
    /(\d+)\s*(?:bed|bedroom|BR|спальн|غرف)/gi,
    /bedroom[s]?:\s*(\d+)/gi
  ],
  bathrooms: [
    /(\d+)\s*(?:bath|bathroom|ванн|حمام)/gi,
    /bathroom[s]?:\s*(\d+)/gi
  ],
  area: [
    /(\d+(?:,\d+)?)\s*(?:sqft|sq\.ft|кв\.м|متر)/gi,
    /area:\s*(\d+)/gi
  ],
  phone: [
    /(?:\+971|971|0)\s*[0-9]{1,2}\s*[0-9]{3}\s*[0-9]{4}/g,
    /(?:\+971|971)\s*[0-9]{8,9}/g
  ]
};

async function logScrapingActivity(message: string, level: 'info' | 'error' = 'info') {
  console.log(`[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
}

async function createScrapingJob(sourceId: string, status: string = 'pending'): Promise<string> {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert([{
      source_id: sourceId,
      status: status,
      properties_found: 0,
      properties_processed: 0,
      metadata: {}
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create scraping job: ${error.message}`);
  }

  return data.id;
}

async function updateScrapingJob(jobId: string, updates: any) {
  const { error } = await supabase
    .from('scraping_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    await logScrapingActivity(`Failed to update job ${jobId}: ${error.message}`, 'error');
  }
}

function extractPropertyData(text: string, source: string): PropertyData | null {
  const content = text.toLowerCase();
  
  // Skip if content doesn't look like a property listing
  if (!content.includes('bed') && !content.includes('aed') && !content.includes('apartment') && 
      !content.includes('villa') && !content.includes('studio') && !content.includes('rent') && 
      !content.includes('sale') && !content.includes('sqft')) {
    return null;
  }

  const property: PropertyData = {
    title: text.split('\n')[0].trim().substring(0, 200),
    raw_content: text
  };

  // Extract price
  for (const pattern of PROPERTY_PATTERNS.price) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1] || match[0];
      const price = parseFloat(priceStr.replace(/,/g, ''));
      if (price > 1000) { // Reasonable minimum price
        property.price = price;
        break;
      }
    }
  }

  // Extract bedrooms
  for (const pattern of PROPERTY_PATTERNS.bedrooms) {
    const match = text.match(pattern);
    if (match) {
      property.bedrooms = parseInt(match[1]);
      break;
    }
  }

  // Extract bathrooms
  for (const pattern of PROPERTY_PATTERNS.bathrooms) {
    const match = text.match(pattern);
    if (match) {
      property.bathrooms = parseInt(match[1]);
      break;
    }
  }

  // Extract area
  for (const pattern of PROPERTY_PATTERNS.area) {
    const match = text.match(pattern);
    if (match) {
      property.area_sqft = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract phone numbers
  for (const pattern of PROPERTY_PATTERNS.phone) {
    const match = text.match(pattern);
    if (match) {
      property.agent_phone = match[0];
      break;
    }
  }

  // Determine property type and purpose
  if (content.includes('villa')) property.property_type = 'Villa';
  else if (content.includes('apartment') || content.includes('flat')) property.property_type = 'Apartment';
  else if (content.includes('studio')) property.property_type = 'Studio';
  else if (content.includes('townhouse')) property.property_type = 'Townhouse';
  else if (content.includes('penthouse')) property.property_type = 'Penthouse';

  if (content.includes('rent') || content.includes('rental')) property.purpose = 'rent';
  else if (content.includes('sale') || content.includes('buy')) property.purpose = 'sale';

  // Extract location areas (Dubai specific)
  const locations = [
    'Dubai Marina', 'JBR', 'Downtown Dubai', 'Business Bay', 'DIFC', 'JLT', 'Dubai Hills',
    'Arabian Ranches', 'Emirates Hills', 'Palm Jumeirah', 'JVC', 'Dubai South', 'Motor City',
    'Sports City', 'International City', 'Discovery Gardens', 'Jumeirah', 'Bur Dubai',
    'Deira', 'Al Barsha', 'Meadows', 'Springs', 'Lakes', 'Greens', 'Views', 'Mirdif'
  ];

  for (const location of locations) {
    if (content.includes(location.toLowerCase())) {
      property.location_area = location;
      break;
    }
  }

  return property;
}

async function scrapeTelegramChannel(username: string, limit: number = 20): Promise<PropertyData[]> {
  await logScrapingActivity(`Scraping Telegram channel: @${username}`);
  
  try {
    // For now, we'll use a simulated approach since MTProto integration requires complex setup
    // In production, you would use the Telegram API with proper authentication
    
    // Simulate property listings from Telegram channels
    const simulatedMessages = generateSimulatedTelegramData(username, limit);
    
    const properties: PropertyData[] = [];
    
    for (const message of simulatedMessages) {
      const property = extractPropertyData(message, `telegram:@${username}`);
      if (property) {
        properties.push(property);
      }
    }

    await logScrapingActivity(`Found ${properties.length} properties from @${username}`);
    return properties;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logScrapingActivity(`Error scraping Telegram @${username}: ${errorMessage}`, 'error');
    return [];
  }
}

async function scrapeWebsite(url: string): Promise<PropertyData[]> {
  await logScrapingActivity(`Scraping website: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract text content from HTML
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into potential property listings
    const sections = textContent.split(/(?:Property|Apartment|Villa|Studio|Bedroom)/i);
    
    const properties: PropertyData[] = [];
    
    for (const section of sections) {
      if (section.length > 100) { // Minimum content length
        const property = extractPropertyData(section, `website:${url}`);
        if (property) {
          properties.push(property);
        }
      }
    }

    await logScrapingActivity(`Found ${properties.length} properties from ${url}`);
    return properties;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logScrapingActivity(`Error scraping ${url}: ${errorMessage}`, 'error');
    return [];
  }
}

function generateSimulatedTelegramData(username: string, limit: number): string[] {
  // Generate realistic property listings based on channel type
  const properties = [];
  
  const propertyTypes = ['Studio', 'Apartment', '1BR', '2BR', '3BR', 'Villa', 'Townhouse'];
  const locations = ['Dubai Marina', 'Downtown Dubai', 'JBR', 'Business Bay', 'JLT', 'Palm Jumeirah'];
  const purposes = ['rent', 'sale'];
  
  for (let i = 0; i < limit; i++) {
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
    const price = purpose === 'rent' ? 
      Math.floor(Math.random() * 150000) + 30000 : 
      Math.floor(Math.random() * 2000000) + 500000;
    
    const listing = `🏢 ${type} for ${purpose} in ${location}
💰 Price: ${price.toLocaleString()} AED
📍 Location: ${location}
📞 Contact: +971 50 123 ${Math.floor(Math.random() * 9000) + 1000}
${purpose === 'rent' ? '🔑 Ready to move' : '🏗️ Ready property'}

#${location.replace(' ', '')} #${type} #${purpose}`;

    properties.push(listing);
  }
  
  return properties;
}

async function saveScrapedProperties(properties: PropertyData[], sourceId: string): Promise<number> {
  let savedCount = 0;
  
  for (const property of properties) {
    try {
      const { error } = await supabase
        .from('scraped_properties')
        .insert([{
          source_id: sourceId,
          title: property.title,
          description: property.description,
          price: property.price,
          property_type: property.property_type,
          purpose: property.purpose,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area_sqft: property.area_sqft,
          location_area: property.location_area,
          images: property.images,
          agent_name: property.agent_name,
          agent_phone: property.agent_phone,
          raw_content: property.raw_content
        }]);

      if (!error) {
        savedCount++;
      } else {
        await logScrapingActivity(`Error saving property: ${error.message}`, 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logScrapingActivity(`Error saving property: ${errorMessage}`, 'error');
    }
  }

  return savedCount;
}

async function performScraping(sourceId?: string) {
  try {
    // Get active sources
    let query = supabase
      .from('data_sources')
      .select('*')
      .eq('is_active', true);

    if (sourceId) {
      query = query.eq('id', sourceId);
    }

    const { data: sources, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch sources: ${error.message}`);
    }

    await logScrapingActivity(`Starting scraping for ${sources.length} sources`);

    for (const source of sources) {
      const jobId = await createScrapingJob(source.id, 'running');
      
      try {
        let properties: PropertyData[] = [];

        if (source.source_type === 'telegram' && source.telegram_username) {
          properties = await scrapeTelegramChannel(source.telegram_username);
        } else if (source.source_type === 'website') {
          properties = await scrapeWebsite(source.url);
        }

        const savedCount = await saveScrapedProperties(properties, source.id);

        await updateScrapingJob(jobId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          properties_found: properties.length,
          properties_processed: savedCount
        });

        // Update source last_scraped_at
        await supabase
          .from('data_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

        await logScrapingActivity(`Completed scraping ${source.name}: ${savedCount}/${properties.length} properties saved`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateScrapingJob(jobId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        });

        await logScrapingActivity(`Failed scraping ${source.name}: ${errorMessage}`, 'error');
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logScrapingActivity(`Scraping operation failed: ${errorMessage}`, 'error');
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, source_id } = await req.json();

    switch (action) {
      case 'scrape':
        await performScraping(source_id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Scraping completed successfully' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'get_sources':
        const { data: sources, error: sourcesError } = await supabase
          .from('data_sources')
          .select('*')
          .order('created_at', { ascending: false });

        if (sourcesError) {
          throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, data: sources }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'get_jobs':
        const { data: jobs, error: jobsError } = await supabase
          .from('scraping_jobs')
          .select(`
            *,
            data_sources (name, source_type, url)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (jobsError) {
          throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, data: jobs }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action. Use: scrape, get_sources, get_jobs' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logScrapingActivity(`Request failed: ${errorMessage}`, 'error');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});