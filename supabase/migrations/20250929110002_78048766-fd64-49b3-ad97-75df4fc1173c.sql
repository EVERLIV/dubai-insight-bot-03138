-- Fix database function overloading issue by creating specific functions
-- Drop existing problematic functions
DROP FUNCTION IF EXISTS public.search_properties(text, numeric, numeric, text, text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.search_properties(text, numeric, numeric, text, text, integer, integer, text, integer);

-- Create new unified search function
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id::text,
    bp.external_id,
    bp.title,
    bp.price,
    bp.property_type,
    bp.purpose,
    bp.bedrooms,
    bp.bathrooms,
    bp.area_sqft,
    bp.location_area,
    bp.images,
    bp.agent_name,
    bp.agent_phone,
    bp.housing_status,
    bp.source_name,
    'api'::text as source_category
  FROM bayut_properties bp
  WHERE 
    (search_purpose IS NULL OR bp.purpose = search_purpose)
    AND (min_price_param IS NULL OR bp.price >= min_price_param)
    AND (max_price_param IS NULL OR bp.price <= max_price_param)
    AND (property_type_param IS NULL OR bp.property_type ILIKE '%' || property_type_param || '%')
    AND (location_param IS NULL OR bp.location_area ILIKE '%' || location_param || '%')
    AND (min_bedrooms_param IS NULL OR bp.bedrooms >= min_bedrooms_param)
    AND (max_bedrooms_param IS NULL OR bp.bedrooms <= max_bedrooms_param)
    AND (housing_status_param IS NULL OR bp.housing_status = housing_status_param)
  
  UNION ALL
  
  SELECT 
    sp.id::text,
    sp.external_id,
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
    sp.housing_status,
    sp.source_name,
    'scraped'::text as source_category
  FROM scraped_properties sp
  WHERE 
    (search_purpose IS NULL OR sp.purpose = search_purpose)
    AND (min_price_param IS NULL OR sp.price >= min_price_param)
    AND (max_price_param IS NULL OR sp.price <= max_price_param)
    AND (property_type_param IS NULL OR sp.property_type ILIKE '%' || property_type_param || '%')
    AND (location_param IS NULL OR sp.location_area ILIKE '%' || location_param || '%')
    AND (min_bedrooms_param IS NULL OR sp.bedrooms >= min_bedrooms_param)
    AND (max_bedrooms_param IS NULL OR sp.bedrooms <= max_bedrooms_param)
    AND (housing_status_param IS NULL OR sp.housing_status = housing_status_param)
  
  ORDER BY 
    CASE WHEN source_category = 'api' THEN 1 ELSE 2 END,
    price DESC
  LIMIT limit_param;
END;
$$;