-- Drop and recreate search_properties_unified with correct parameter names
DROP FUNCTION IF EXISTS public.search_properties_unified(text, text, text, numeric, numeric, integer, integer, text, integer, text);

-- Create the function with correct parameter names
CREATE OR REPLACE FUNCTION public.search_properties_unified(
    p_purpose text DEFAULT NULL,
    p_property_type text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_min_price numeric DEFAULT NULL,
    p_max_price numeric DEFAULT NULL,
    p_min_bedrooms integer DEFAULT NULL,
    p_max_bedrooms integer DEFAULT NULL,
    p_housing_status text DEFAULT NULL,
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