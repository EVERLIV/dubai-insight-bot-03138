-- Create tables for real estate data scraping system

-- Table for tracking data sources (Telegram channels, websites)
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('telegram', 'website', 'facebook')),
  url TEXT NOT NULL,
  telegram_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scraping_frequency INTEGER NOT NULL DEFAULT 3600, -- seconds between scrapes
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for scraped property listings from various sources  
CREATE TABLE public.scraped_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  price_currency TEXT DEFAULT 'AED',
  property_type TEXT,
  purpose TEXT, -- rent/sale
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft INTEGER,
  location_area TEXT,
  location_city TEXT DEFAULT 'Dubai',
  images TEXT[],
  agent_name TEXT,
  agent_phone TEXT,
  raw_content TEXT, -- original scraped content
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking scraping jobs and their status
CREATE TABLE public.scraping_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  properties_found INTEGER DEFAULT 0,
  properties_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_properties ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public access to data sources" 
ON public.data_sources FOR ALL USING (true);

CREATE POLICY "Allow public access to scraped properties"
ON public.scraped_properties FOR ALL USING (true);

CREATE POLICY "Allow public access to scraping jobs"
ON public.scraping_jobs FOR ALL USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON public.data_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scraped_properties_updated_at
  BEFORE UPDATE ON public.scraped_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_data_sources_type_active ON public.data_sources(source_type, is_active);
CREATE INDEX idx_scraped_properties_source ON public.scraped_properties(source_id);
CREATE INDEX idx_scraped_properties_location ON public.scraped_properties(location_area, location_city);
CREATE INDEX idx_scraped_properties_price ON public.scraped_properties(price, price_currency);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status, created_at);

-- Insert initial Telegram channels from the provided list
INSERT INTO public.data_sources (name, source_type, url, telegram_username, is_active) VALUES
  ('Dubai Real Estate Investment', 'telegram', 'https://t.me/dubairealtyinvest', 'dubairealtyinvest', true),
  ('fäm Properties', 'telegram', 'https://t.me/fam_properties', 'fam_properties', true),
  ('Dream Realty Dubai', 'telegram', 'https://t.me/Dream_Realty_Dubai', 'Dream_Realty_Dubai', true),
  ('Dubai Look', 'telegram', 'https://t.me/dubilook', 'dubilook', true),
  ('THE CAPITAL Real Estate', 'telegram', 'https://t.me/thecapitalae', 'thecapitalae', true),
  ('Dubai Rent Arenda', 'telegram', 'https://t.me/DubaiRentArenda', 'DubaiRentArenda', true),
  ('Colife Invest', 'telegram', 'https://t.me/investcolife', 'investcolife', true),
  ('Негинский UAE', 'telegram', 'https://t.me/neginskiuae', 'neginskiuae', true),
  ('Dubai Property', 'telegram', 'https://t.me/dubai_propertyy', 'dubai_propertyy', true),
  ('AX Capital CIS', 'telegram', 'https://t.me/axcapital_cis', 'axcapital_cis', true);

-- Create function to search scraped properties with filters
CREATE OR REPLACE FUNCTION public.search_scraped_properties(
    search_purpose TEXT DEFAULT NULL,
    min_price_param NUMERIC DEFAULT NULL,
    max_price_param NUMERIC DEFAULT NULL,
    property_type_param TEXT DEFAULT NULL,
    location_param TEXT DEFAULT NULL,
    min_bedrooms_param INTEGER DEFAULT NULL,
    max_bedrooms_param INTEGER DEFAULT NULL,
    source_type_param TEXT DEFAULT NULL,
    limit_param INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    source_name TEXT,
    source_type TEXT,
    title TEXT,
    price NUMERIC,
    property_type TEXT,
    purpose TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    location_area TEXT,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        sp.id,
        ds.name as source_name,
        ds.source_type,
        sp.title,
        sp.price,
        sp.property_type,
        sp.purpose,
        sp.bedrooms,
        sp.bathrooms,
        sp.area_sqft,
        sp.location_area,
        sp.images,
        sp.agent_name,
        sp.agent_phone,
        sp.scraped_at
    FROM public.scraped_properties sp
    JOIN public.data_sources ds ON sp.source_id = ds.id
    WHERE 
        ds.is_active = true
        AND (search_purpose IS NULL OR sp.purpose = search_purpose)
        AND (min_price_param IS NULL OR sp.price >= min_price_param)
        AND (max_price_param IS NULL OR sp.price <= max_price_param)
        AND (property_type_param IS NULL OR sp.property_type ILIKE '%' || property_type_param || '%')
        AND (location_param IS NULL OR sp.location_area ILIKE '%' || location_param || '%')
        AND (min_bedrooms_param IS NULL OR sp.bedrooms >= min_bedrooms_param)
        AND (max_bedrooms_param IS NULL OR sp.bedrooms <= max_bedrooms_param)
        AND (source_type_param IS NULL OR ds.source_type = source_type_param)
    ORDER BY sp.scraped_at DESC
    LIMIT limit_param;
$$;