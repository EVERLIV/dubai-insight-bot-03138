import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface ScrapedProperty {
  title: string;
  price: string;
  location: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  property_type: string;
  purpose: string;
  agent_name?: string;
  agent_phone?: string;
  images: string[];
  external_id: string;
  source_url: string;
}

// PropertyFinder scraper
async function scrapePropertyFinder(searchParams: {
  location?: string;
  property_type?: string;
  purpose?: string;
  max_price?: number;
  limit?: number;
}): Promise<{ success: boolean; properties?: ScrapedProperty[]; error?: string }> {
  try {
    const { location = '', property_type = '', purpose = 'for-sale', limit = 20 } = searchParams;
    
    // Construct PropertyFinder URL
    let url = `https://www.propertyfinder.ae/${purpose === 'for-sale' ? 'property-for-sale' : 'property-for-rent'}/`;
    
    if (location.toLowerCase().includes('dubai')) {
      url += 'dubai/';
    }
    
    if (property_type) {
      if (property_type.toLowerCase().includes('apartment')) {
        url += 'residential/';
      } else if (property_type.toLowerCase().includes('villa')) {
        url += 'villa/';
      }
    }
    
    console.log('Scraping PropertyFinder URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`PropertyFinder request failed: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse PropertyFinder HTML');
    }

    const properties: ScrapedProperty[] = [];
    const propertyCards = doc.querySelectorAll('[data-testid="property-card"], .property-card, .search-result-property-card');
    
    console.log(`Found ${propertyCards.length} property elements on PropertyFinder`);

    for (let i = 0; i < Math.min(propertyCards.length, limit); i++) {
      const card = propertyCards[i] as Element;
      
      try {
        const titleEl = card.querySelector('h2, .property-title, [data-testid="property-title"]');
        const priceEl = card.querySelector('.price, [data-testid="property-price"], .property-price');
        const locationEl = card.querySelector('.location, [data-testid="property-location"], .property-location');
        const bedroomsEl = card.querySelector('[data-testid="property-beds"], .beds, .bedrooms');
        const bathroomsEl = card.querySelector('[data-testid="property-baths"], .baths, .bathrooms');
        const areaEl = card.querySelector('[data-testid="property-area"], .area, .property-area');
        
        const title = titleEl?.textContent?.trim() || `Property in ${location}`;
        const priceText = priceEl?.textContent?.trim() || '0';
        const locationText = locationEl?.textContent?.trim() || location || 'Dubai';
        const bedroomsText = bedroomsEl?.textContent?.trim();
        const bathroomsText = bathroomsEl?.textContent?.trim();
        const areaText = areaEl?.textContent?.trim();

        // Extract price number
        const priceMatch = priceText.match(/[\d,]+/);
        const price = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
        
        // Generate external ID
        const external_id = `PF-${Date.now()}-${i}`;
        
        properties.push({
          title,
          price,
          location: locationText,
          bedrooms: bedroomsText,
          bathrooms: bathroomsText,
          area: areaText,
          property_type: property_type || 'Apartment',
          purpose: purpose === 'for-sale' ? 'for-sale' : 'for-rent',
          images: [],
          external_id,
          source_url: url
        });
      } catch (error) {
        console.error('Error parsing property card:', error);
        continue;
      }
    }

    console.log(`Successfully scraped ${properties.length} properties from PropertyFinder`);
    return { success: true, properties };
    
  } catch (error) {
    console.error('PropertyFinder scraping error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Scraping failed' };
  }
}

// Dubizzle scraper
async function scrapeDubizzle(searchParams: {
  location?: string;
  property_type?: string;
  purpose?: string;
  limit?: number;
}): Promise<{ success: boolean; properties?: ScrapedProperty[]; error?: string }> {
  try {
    const { location = '', property_type = '', purpose = 'for-sale', limit = 20 } = searchParams;
    
    let url = `https://dubai.dubizzle.com/property-${purpose === 'for-sale' ? 'for-sale' : 'for-rent'}/residential/`;
    
    if (property_type) {
      if (property_type.toLowerCase().includes('apartment')) {
        url += 'apartmentflat/';
      } else if (property_type.toLowerCase().includes('villa')) {
        url += 'villa/';
      }
    }
    
    console.log('Scraping Dubizzle URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`Dubizzle request failed: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse Dubizzle HTML');
    }

    const properties: ScrapedProperty[] = [];
    const propertyCards = doc.querySelectorAll('.listing-item, .property-item, [data-testid="listing-item"]');
    
    console.log(`Found ${propertyCards.length} property elements on Dubizzle`);

    for (let i = 0; i < Math.min(propertyCards.length, limit); i++) {
      const card = propertyCards[i] as Element;
      
      try {
        const titleEl = card.querySelector('.listing-title, .property-title, h3, h2');
        const priceEl = card.querySelector('.price, .listing-price');
        const locationEl = card.querySelector('.location, .listing-location');
        const detailsEl = card.querySelector('.listing-details, .property-details');
        
        const title = titleEl?.textContent?.trim() || `Property in ${location}`;
        const priceText = priceEl?.textContent?.trim() || '0';
        const locationText = locationEl?.textContent?.trim() || location || 'Dubai';
        
        // Extract details
        const detailsText = detailsEl?.textContent || '';
        const bedroomsMatch = detailsText.match(/(\d+)\s*(?:bed|br|bedroom)/i);
        const bathroomsMatch = detailsText.match(/(\d+)\s*(?:bath|bathroom)/i);
        const areaMatch = detailsText.match(/(\d+(?:,\d+)*)\s*(?:sq\.?\s*ft|sqft)/i);

        // Extract price number
        const priceMatch = priceText.match(/[\d,]+/);
        const price = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
        
        const external_id = `DB-${Date.now()}-${i}`;
        
        properties.push({
          title,
          price,
          location: locationText,
          bedrooms: bedroomsMatch ? bedroomsMatch[1] : undefined,
          bathrooms: bathroomsMatch ? bathroomsMatch[1] : undefined,
          area: areaMatch ? areaMatch[1] : undefined,
          property_type: property_type || 'Apartment',
          purpose: purpose === 'for-sale' ? 'for-sale' : 'for-rent',
          images: [],
          external_id,
          source_url: url
        });
      } catch (error) {
        console.error('Error parsing Dubizzle property card:', error);
        continue;
      }
    }

    console.log(`Successfully scraped ${properties.length} properties from Dubizzle`);
    return { success: true, properties };
    
  } catch (error) {
    console.error('Dubizzle scraping error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Scraping failed' };
  }
}

// Save scraped property to database
async function saveScrapedProperty(property: ScrapedProperty): Promise<boolean> {
  try {
    // Check if property already exists
    const { data: existing } = await supabase
      .from('property_listings')
      .select('id')
      .eq('external_id', property.external_id)
      .maybeSingle();

    if (existing) {
      console.log(`Property ${property.external_id} already exists, skipping`);
      return true;
    }

    // Extract numeric values
    const priceNum = parseInt(property.price.replace(/[^\d]/g, '')) || 0;
    const bedroomsNum = property.bedrooms ? parseInt(property.bedrooms.replace(/[^\d]/g, '')) : null;
    const bathroomsNum = property.bathrooms ? parseInt(property.bathrooms.replace(/[^\d]/g, '')) : null;
    const areaNum = property.area ? parseInt(property.area.replace(/[^\d]/g, '')) : null;

    const propertyData = {
      external_id: property.external_id,
      source: property.source_url.includes('propertyfinder') ? 'propertyfinder' : 'dubizzle',
      title: property.title,
      price: priceNum,
      property_type: property.property_type,
      purpose: property.purpose,
      bedrooms: bedroomsNum,
      bathrooms: bathroomsNum,
      area_sqft: areaNum,
      location_area: property.location,
      location_city: 'Dubai',
      images: property.images,
      agent_name: property.agent_name || null,
      agent_phone: property.agent_phone || null,
      raw_data: property,
      last_verified: new Date().toISOString()
    };

    const { error } = await supabase
      .from('property_listings')
      .insert(propertyData);

    if (error) {
      console.error('Error saving scraped property:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveScrapedProperty:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sources = ['propertyfinder', 'dubizzle'], location, property_type, purpose, limit = 10 } = await req.json().catch(() => ({}));
    
    console.log('Starting web scraping with params:', { sources, location, property_type, purpose, limit });
    
    let totalScraped = 0;
    let totalSaved = 0;
    const results: any = {};

    const searchParams = { location, property_type, purpose, limit };

    // Scrape PropertyFinder
    if (sources.includes('propertyfinder')) {
      console.log('Scraping PropertyFinder...');
      const pfResult = await scrapePropertyFinder(searchParams);
      results.propertyfinder = pfResult;
      
      if (pfResult.success && pfResult.properties) {
        totalScraped += pfResult.properties.length;
        
        for (const property of pfResult.properties) {
          const saved = await saveScrapedProperty(property);
          if (saved) totalSaved++;
        }
      }
    }

    // Scrape Dubizzle
    if (sources.includes('dubizzle')) {
      console.log('Scraping Dubizzle...');
      const dbResult = await scrapeDubizzle(searchParams);
      results.dubizzle = dbResult;
      
      if (dbResult.success && dbResult.properties) {
        totalScraped += dbResult.properties.length;
        
        for (const property of dbResult.properties) {
          const saved = await saveScrapedProperty(property);
          if (saved) totalSaved++;
        }
      }
    }

    const response = {
      success: true,
      message: `Successfully scraped ${totalScraped} properties, saved ${totalSaved} to database`,
      totalScraped,
      totalSaved,
      sources: Object.keys(results),
      results
    };

    console.log('Web scraping completed:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in web scraper:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});