-- Удаляем демо данные из property_listings
DELETE FROM public.property_listings WHERE source = 'demo';