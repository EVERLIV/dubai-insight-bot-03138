-- Add housing status column to scraped_properties table
ALTER TABLE public.scraped_properties 
ADD COLUMN housing_status text CHECK (housing_status IN ('primary', 'secondary', 'off-plan'));

-- Add housing status column to property_listings table  
ALTER TABLE public.property_listings 
ADD COLUMN housing_status text CHECK (housing_status IN ('primary', 'secondary', 'off-plan'));

-- Update scraped_properties to standardize purpose values
UPDATE public.scraped_properties 
SET purpose = 'for-sale' 
WHERE purpose = 'sale';

UPDATE public.scraped_properties 
SET purpose = 'for-rent' 
WHERE purpose = 'rent';

-- Update scraped_properties to standardize property_type values
UPDATE public.scraped_properties 
SET property_type = 'Apartment' 
WHERE property_type = 'apartment' OR property_type ILIKE '%apartment%';

UPDATE public.scraped_properties 
SET property_type = 'Villa' 
WHERE property_type = 'villa' OR property_type ILIKE '%villa%';

UPDATE public.scraped_properties 
SET property_type = 'Townhouse' 
WHERE property_type = 'townhouse' OR property_type ILIKE '%townhouse%';

UPDATE public.scraped_properties 
SET property_type = 'Studio' 
WHERE property_type = 'studio' OR property_type ILIKE '%studio%';

UPDATE public.scraped_properties 
SET property_type = 'Commercial' 
WHERE property_type = 'commercial' OR property_type ILIKE '%commercial%';

-- Update property_listings to standardize property_type values
UPDATE public.property_listings 
SET property_type = 'Apartment' 
WHERE property_type = 'Apartments';

UPDATE public.property_listings 
SET property_type = 'Villa' 
WHERE property_type = 'Villas';

UPDATE public.property_listings 
SET property_type = 'Townhouse' 
WHERE property_type = 'Townhouses';

-- Set default housing status based on heuristics (can be improved with more data)
-- Assume new developments (higher prices, newer areas) are primary
UPDATE public.scraped_properties 
SET housing_status = 'primary'
WHERE housing_status IS NULL 
  AND (
    location_area ILIKE '%hills%' 
    OR location_area ILIKE '%creek%' 
    OR location_area ILIKE '%lagoons%'
    OR location_area ILIKE '%vista%'
    OR (price > 1500000 AND purpose = 'for-sale')
  );

-- Set secondary for older areas and lower prices
UPDATE public.scraped_properties 
SET housing_status = 'secondary'
WHERE housing_status IS NULL;

-- Update property_listings with housing status
UPDATE public.property_listings 
SET housing_status = 'primary'
WHERE housing_status IS NULL 
  AND (
    location_area ILIKE '%hills%' 
    OR location_area ILIKE '%creek%' 
    OR location_area ILIKE '%lagoons%'
    OR location_area ILIKE '%vista%'
    OR (price > 1500000 AND purpose = 'for-sale')
  );

UPDATE public.property_listings 
SET housing_status = 'secondary'
WHERE housing_status IS NULL;