-- Fix security issues by setting search_path for functions
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix scraped properties search function
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;