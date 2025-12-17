-- Add new fields for detailed property search
ALTER TABLE public.property_listings 
ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS rental_period text DEFAULT null,
ADD COLUMN IF NOT EXISTS district text DEFAULT null;

-- Add same fields to scraped_properties for consistency
ALTER TABLE public.scraped_properties 
ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS rental_period text DEFAULT null,
ADD COLUMN IF NOT EXISTS district text DEFAULT null;

-- Add comments for documentation
COMMENT ON COLUMN public.property_listings.pets_allowed IS 'true = pets allowed, false = no pets, null = not specified';
COMMENT ON COLUMN public.property_listings.rental_period IS 'short-term, long-term, or both';
COMMENT ON COLUMN public.property_listings.district IS 'District in HCMC: District 1, District 2, Binh Thanh, etc.';