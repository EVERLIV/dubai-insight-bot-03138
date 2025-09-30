-- Drop and recreate search_scraped_properties with correct parameter names
DROP FUNCTION IF EXISTS public.search_scraped_properties(text, text, text, numeric, numeric, integer, integer, integer, text);

-- Create the function with correct parameter names matching search_properties_unified
CREATE OR REPLACE FUNCTION public.search_scraped_properties(
    p_purpose text DEFAULT NULL,
    p_property_type text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_min_price numeric DEFAULT NULL,
    p_max_price numeric DEFAULT NULL,
    p_min_bedrooms integer DEFAULT NULL,
    p_max_bedrooms integer DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_query text DEFAULT NULL
)
RETURNS TABLE(
    id bigint,
    title text,
    price numeric,
    location_area text,
    property_type text,
    purpose text,
    bedrooms integer,
    bathrooms integer,
    area_sqft integer,
    images text[],
    agent_name text,
    agent_phone text,
    source_name text,
    source_category text,
    housing_status text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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