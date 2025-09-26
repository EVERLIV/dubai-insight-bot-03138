-- Fix security issues

-- Move extensions from public schema to their proper schemas
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

-- Create extensions in proper schemas
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Fix search_path for search function
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
SECURITY DEFINER SET search_path = public
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