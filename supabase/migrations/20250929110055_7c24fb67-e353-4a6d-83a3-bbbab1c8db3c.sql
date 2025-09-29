-- Fix security warning by setting search_path for the new function
ALTER FUNCTION public.search_properties_unified SET search_path = 'public';