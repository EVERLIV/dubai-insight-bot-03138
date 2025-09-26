-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create properties cache table
CREATE TABLE public.property_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL, -- 'bayut', 'dubizzle', 'dld'
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    price_currency TEXT DEFAULT 'AED',
    property_type TEXT NOT NULL, -- 'apartment', 'villa', 'townhouse', etc.
    purpose TEXT NOT NULL, -- 'for-sale', 'for-rent'
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    location_area TEXT,
    location_city TEXT DEFAULT 'Dubai',
    location_coords POINT,
    amenities TEXT[],
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT,
    completion_status TEXT,
    is_furnished BOOLEAN DEFAULT false,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user search preferences table
CREATE TABLE public.user_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    property_types TEXT[],
    purpose TEXT, -- 'for-sale', 'for-rent', 'both'
    min_bedrooms INTEGER,
    max_bedrooms INTEGER,
    preferred_areas TEXT[],
    max_area_sqft INTEGER,
    min_area_sqft INTEGER,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AVM (Automated Valuation Model) data table
CREATE TABLE public.property_valuations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    estimated_value DECIMAL(12,2) NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    comparable_properties UUID[],
    valuation_factors JSONB,
    market_trends JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create API usage tracking table
CREATE TABLE public.api_usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_source TEXT NOT NULL,
    endpoint TEXT,
    request_params JSONB,
    response_status INTEGER,
    credits_used INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user search history table
CREATE TABLE public.search_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    search_query TEXT NOT NULL,
    search_filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_property_listings_source ON public.property_listings(source);
CREATE INDEX idx_property_listings_purpose ON public.property_listings(purpose);
CREATE INDEX idx_property_listings_price ON public.property_listings(price);
CREATE INDEX idx_property_listings_location ON public.property_listings(location_area);
CREATE INDEX idx_property_listings_updated ON public.property_listings(updated_at);
CREATE INDEX idx_user_preferences_telegram_id ON public.user_preferences(telegram_user_id);
CREATE INDEX idx_search_history_telegram_id ON public.search_history(telegram_user_id);
CREATE INDEX idx_api_usage_logs_created ON public.api_usage_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (for the bot)
CREATE POLICY "Allow public read access to property listings" 
ON public.property_listings FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert/update to property listings" 
ON public.property_listings FOR ALL 
USING (true);

CREATE POLICY "Allow public access to user preferences" 
ON public.user_preferences FOR ALL 
USING (true);

CREATE POLICY "Allow public access to property valuations" 
ON public.property_valuations FOR ALL 
USING (true);

CREATE POLICY "Allow public access to api usage logs" 
ON public.api_usage_logs FOR ALL 
USING (true);

CREATE POLICY "Allow public access to search history" 
ON public.search_history FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_property_listings_updated_at
    BEFORE UPDATE ON public.property_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for property search with filters
CREATE OR REPLACE FUNCTION public.search_properties(
    search_purpose TEXT DEFAULT NULL,
    min_price_param DECIMAL DEFAULT NULL,
    max_price_param DECIMAL DEFAULT NULL,
    property_type_param TEXT DEFAULT NULL,
    location_param TEXT DEFAULT NULL,
    min_bedrooms_param INTEGER DEFAULT NULL,
    max_bedrooms_param INTEGER DEFAULT NULL,
    limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    external_id TEXT,
    title TEXT,
    price DECIMAL,
    property_type TEXT,
    purpose TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    location_area TEXT,
    images TEXT[],
    agent_name TEXT,
    agent_phone TEXT
)
LANGUAGE SQL
AS $$
    SELECT 
        pl.id,
        pl.external_id,
        pl.title,
        pl.price,
        pl.property_type,
        pl.purpose,
        pl.bedrooms,
        pl.bathrooms,
        pl.area_sqft,
        pl.location_area,
        pl.images,
        pl.agent_name,
        pl.agent_phone
    FROM public.property_listings pl
    WHERE 
        (search_purpose IS NULL OR pl.purpose = search_purpose)
        AND (min_price_param IS NULL OR pl.price >= min_price_param)
        AND (max_price_param IS NULL OR pl.price <= max_price_param)
        AND (property_type_param IS NULL OR pl.property_type ILIKE '%' || property_type_param || '%')
        AND (location_param IS NULL OR pl.location_area ILIKE '%' || location_param || '%')
        AND (min_bedrooms_param IS NULL OR pl.bedrooms >= min_bedrooms_param)
        AND (max_bedrooms_param IS NULL OR pl.bedrooms <= max_bedrooms_param)
    ORDER BY pl.updated_at DESC
    LIMIT limit_param;
$$;