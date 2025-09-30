-- Create tables for property data
CREATE TABLE IF NOT EXISTS public.property_listings (
    id BIGSERIAL PRIMARY KEY,
    external_id TEXT UNIQUE,
    title TEXT NOT NULL,
    price DECIMAL,
    location_area TEXT,
    property_type TEXT,
    purpose TEXT CHECK (purpose IN ('for-sale', 'for-rent')),
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    source_name TEXT DEFAULT 'bayut_api',
    source_category TEXT DEFAULT 'api',
    housing_status TEXT CHECK (housing_status IN ('primary', 'secondary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for scraped properties
CREATE TABLE IF NOT EXISTS public.scraped_properties (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price DECIMAL,
    location_area TEXT,
    property_type TEXT,
    purpose TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    source_name TEXT DEFAULT 'scraped',
    source_category TEXT DEFAULT 'scraped',
    housing_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for search history
CREATE TABLE IF NOT EXISTS public.search_history (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT,
    query TEXT,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for user preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for API usage logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT,
    endpoint TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for market analysis
CREATE TABLE IF NOT EXISTS public.market_analysis (
    id BIGSERIAL PRIMARY KEY,
    analysis_data JSONB,
    news_articles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow all access to property_listings" ON public.property_listings FOR ALL USING (true);
CREATE POLICY "Allow all access to scraped_properties" ON public.scraped_properties FOR ALL USING (true);
CREATE POLICY "Allow all access to search_history" ON public.search_history FOR ALL USING (true);
CREATE POLICY "Allow all access to user_preferences" ON public.user_preferences FOR ALL USING (true);
CREATE POLICY "Allow all access to api_usage_logs" ON public.api_usage_logs FOR ALL USING (true);
CREATE POLICY "Allow all access to market_analysis" ON public.market_analysis FOR ALL USING (true);

-- Create unified search function
CREATE OR REPLACE FUNCTION public.search_properties_unified(
    p_purpose TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_min_bedrooms INTEGER DEFAULT NULL,
    p_max_bedrooms INTEGER DEFAULT NULL,
    p_housing_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_query TEXT DEFAULT NULL
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    price DECIMAL,
    location_area TEXT,
    property_type TEXT,
    purpose TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    source_name TEXT,
    source_category TEXT,
    housing_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.title,
        pl.price,
        pl.location_area,
        pl.property_type,
        pl.purpose,
        pl.bedrooms,
        pl.bathrooms,
        pl.area_sqft,
        pl.images,
        pl.agent_name,
        pl.agent_phone,
        pl.source_name,
        pl.source_category,
        pl.housing_status,
        pl.created_at
    FROM public.property_listings pl
    WHERE 
        (p_purpose IS NULL OR pl.purpose = p_purpose)
        AND (p_property_type IS NULL OR pl.property_type ILIKE '%' || p_property_type || '%')
        AND (p_location IS NULL OR pl.location_area ILIKE '%' || p_location || '%')
        AND (p_min_price IS NULL OR pl.price >= p_min_price)
        AND (p_max_price IS NULL OR pl.price <= p_max_price)
        AND (p_min_bedrooms IS NULL OR pl.bedrooms >= p_min_bedrooms)
        AND (p_max_bedrooms IS NULL OR pl.bedrooms <= p_max_bedrooms)
        AND (p_housing_status IS NULL OR pl.housing_status = p_housing_status)
        AND (p_query IS NULL OR pl.title ILIKE '%' || p_query || '%' OR pl.location_area ILIKE '%' || p_query || '%')
    ORDER BY pl.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create scraped properties search function
CREATE OR REPLACE FUNCTION public.search_scraped_properties(
    p_purpose TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_min_bedrooms INTEGER DEFAULT NULL,
    p_max_bedrooms INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_query TEXT DEFAULT NULL
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    price DECIMAL,
    location_area TEXT,
    property_type TEXT,
    purpose TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    source_name TEXT,
    source_category TEXT,
    housing_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.title,
        sp.price,
        sp.location_area,
        sp.property_type,
        sp.purpose,
        sp.bedrooms,
        sp.bathrooms,
        sp.area_sqft,
        sp.images,
        sp.agent_name,
        sp.agent_phone,
        sp.source_name,
        sp.source_category,
        sp.housing_status,
        sp.created_at
    FROM public.scraped_properties sp
    WHERE 
        (p_purpose IS NULL OR sp.purpose = p_purpose)
        AND (p_property_type IS NULL OR sp.property_type ILIKE '%' || p_property_type || '%')
        AND (p_location IS NULL OR sp.location_area ILIKE '%' || p_location || '%')
        AND (p_min_price IS NULL OR sp.price >= p_min_price)
        AND (p_max_price IS NULL OR sp.price <= p_max_price)
        AND (p_min_bedrooms IS NULL OR sp.bedrooms >= p_min_bedrooms)
        AND (p_max_bedrooms IS NULL OR sp.bedrooms <= p_max_bedrooms)
        AND (p_query IS NULL OR sp.title ILIKE '%' || p_query || '%' OR sp.location_area ILIKE '%' || p_query || '%')
    ORDER BY sp.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;