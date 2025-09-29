-- Fix the column ambiguity issue
DROP FUNCTION IF EXISTS public.search_properties_unified;

CREATE OR REPLACE FUNCTION public.search_properties_unified(
  search_purpose text DEFAULT NULL,
  min_price_param numeric DEFAULT NULL,
  max_price_param numeric DEFAULT NULL,
  property_type_param text DEFAULT NULL,
  location_param text DEFAULT NULL,
  min_bedrooms_param integer DEFAULT NULL,
  max_bedrooms_param integer DEFAULT NULL,
  housing_status_param text DEFAULT NULL,
  limit_param integer DEFAULT 10
)
RETURNS TABLE (
  id text,
  external_id text,
  title text,
  price numeric,
  property_type text,
  purpose text,
  bedrooms integer,
  bathrooms integer,
  area_sqft numeric,
  location_area text,
  images text[],
  agent_name text,
  agent_phone text,
  housing_status text,
  source_name text,
  source_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH api_properties AS (
    SELECT 
      pl.id::text,
      pl.external_id,
      pl.title,
      pl.price,
      pl.property_type,
      pl.purpose,
      pl.bedrooms,
      pl.bathrooms,
      pl.area_sqft::numeric,
      pl.location_area,
      pl.images,
      pl.agent_name,
      pl.agent_phone,
      pl.housing_status,
      pl.source as source_name,
      'api'::text as source_category
    FROM property_listings pl
    WHERE 
      (search_purpose IS NULL OR pl.purpose = search_purpose)
      AND (min_price_param IS NULL OR pl.price >= min_price_param)
      AND (max_price_param IS NULL OR pl.price <= max_price_param)
      AND (property_type_param IS NULL OR pl.property_type ILIKE '%' || property_type_param || '%')
      AND (location_param IS NULL OR pl.location_area ILIKE '%' || location_param || '%')
      AND (min_bedrooms_param IS NULL OR pl.bedrooms >= min_bedrooms_param)
      AND (max_bedrooms_param IS NULL OR pl.bedrooms <= max_bedrooms_param)
      AND (housing_status_param IS NULL OR pl.housing_status = housing_status_param)
  ),
  scraped_properties_data AS (
    SELECT 
      sp.id::text,
      sp.external_id,
      sp.title,
      sp.price,
      sp.property_type,
      sp.purpose,
      sp.bedrooms,
      sp.bathrooms,
      sp.area_sqft::numeric,
      sp.location_area,
      sp.images,
      sp.agent_name,
      sp.agent_phone,
      sp.housing_status,
      ds.name as source_name,
      'scraped'::text as source_category
    FROM scraped_properties sp
    JOIN data_sources ds ON sp.source_id = ds.id
    WHERE 
      ds.is_active = true
      AND (search_purpose IS NULL OR sp.purpose = search_purpose)
      AND (min_price_param IS NULL OR sp.price >= min_price_param)
      AND (max_price_param IS NULL OR sp.price <= max_price_param)
      AND (property_type_param IS NULL OR sp.property_type ILIKE '%' || property_type_param || '%')
      AND (location_param IS NULL OR sp.location_area ILIKE '%' || location_param || '%')
      AND (min_bedrooms_param IS NULL OR sp.bedrooms >= min_bedrooms_param)
      AND (max_bedrooms_param IS NULL OR sp.bedrooms <= max_bedrooms_param)
      AND (housing_status_param IS NULL OR sp.housing_status = housing_status_param)
  ),
  combined_results AS (
    SELECT * FROM api_properties
    UNION ALL
    SELECT * FROM scraped_properties_data
  )
  SELECT 
    cr.id,
    cr.external_id,
    cr.title,
    cr.price,
    cr.property_type,
    cr.purpose,
    cr.bedrooms,
    cr.bathrooms,
    cr.area_sqft,
    cr.location_area,
    cr.images,
    cr.agent_name,
    cr.agent_phone,
    cr.housing_status,
    cr.source_name,
    cr.source_category
  FROM combined_results cr
  ORDER BY 
    CASE WHEN cr.source_category = 'api' THEN 1 ELSE 2 END,
    cr.price DESC
  LIMIT limit_param;
END;
$$;