-- Update search functions to support housing_status and strict filtering

-- Update search_scraped_properties function
CREATE OR REPLACE FUNCTION public.search_scraped_properties(
    search_purpose text DEFAULT NULL::text, 
    min_price_param numeric DEFAULT NULL::numeric, 
    max_price_param numeric DEFAULT NULL::numeric, 
    property_type_param text DEFAULT NULL::text, 
    location_param text DEFAULT NULL::text, 
    min_bedrooms_param integer DEFAULT NULL::integer, 
    max_bedrooms_param integer DEFAULT NULL::integer, 
    source_type_param text DEFAULT NULL::text,
    housing_status_param text DEFAULT NULL::text,
    limit_param integer DEFAULT 10
)
RETURNS TABLE(
    id uuid, 
    source_name text, 
    source_type text, 
    title text, 
    price numeric, 
    property_type text, 
    purpose text, 
    bedrooms integer, 
    bathrooms integer, 
    area_sqft integer, 
    location_area text, 
    images text[], 
    agent_name text, 
    agent_phone text, 
    scraped_at timestamp with time zone,
    housing_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        sp.scraped_at,
        sp.housing_status
    FROM public.scraped_properties sp
    JOIN public.data_sources ds ON sp.source_id = ds.id
    WHERE 
        ds.is_active = true
        AND (search_purpose IS NULL OR sp.purpose = search_purpose)
        AND (min_price_param IS NULL OR sp.price >= min_price_param)
        AND (max_price_param IS NULL OR sp.price <= max_price_param)
        AND (property_type_param IS NULL OR sp.property_type = property_type_param)
        AND (location_param IS NULL OR sp.location_area ILIKE '%' || location_param || '%')
        AND (min_bedrooms_param IS NULL OR sp.bedrooms >= min_bedrooms_param)
        AND (max_bedrooms_param IS NULL OR sp.bedrooms <= max_bedrooms_param)
        AND (source_type_param IS NULL OR ds.source_type = source_type_param)
        AND (housing_status_param IS NULL OR sp.housing_status = housing_status_param)
    ORDER BY sp.scraped_at DESC
    LIMIT limit_param;
$function$;

-- Update search_properties function
CREATE OR REPLACE FUNCTION public.search_properties(
    search_purpose text DEFAULT NULL::text, 
    min_price_param numeric DEFAULT NULL::numeric, 
    max_price_param numeric DEFAULT NULL::numeric, 
    property_type_param text DEFAULT NULL::text, 
    location_param text DEFAULT NULL::text, 
    min_bedrooms_param integer DEFAULT NULL::integer, 
    max_bedrooms_param integer DEFAULT NULL::integer,
    housing_status_param text DEFAULT NULL::text,
    limit_param integer DEFAULT 10
)
RETURNS TABLE(
    id uuid, 
    external_id text, 
    title text, 
    price numeric, 
    property_type text, 
    purpose text, 
    bedrooms integer, 
    bathrooms integer, 
    area_sqft integer, 
    location_area text, 
    images text[], 
    agent_name text, 
    agent_phone text,
    housing_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        pl.agent_phone,
        pl.housing_status
    FROM public.property_listings pl
    WHERE 
        (search_purpose IS NULL OR pl.purpose = search_purpose)
        AND (min_price_param IS NULL OR pl.price >= min_price_param)
        AND (max_price_param IS NULL OR pl.price <= max_price_param)
        AND (property_type_param IS NULL OR pl.property_type = property_type_param)
        AND (location_param IS NULL OR pl.location_area ILIKE '%' || location_param || '%')
        AND (min_bedrooms_param IS NULL OR pl.bedrooms >= min_bedrooms_param)
        AND (max_bedrooms_param IS NULL OR pl.bedrooms <= max_bedrooms_param)
        AND (housing_status_param IS NULL OR pl.housing_status = housing_status_param)
    ORDER BY pl.updated_at DESC
    LIMIT limit_param;
$function$;