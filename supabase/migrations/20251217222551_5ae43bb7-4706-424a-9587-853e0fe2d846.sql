-- Add images and telegraph_url columns to news_articles
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS telegraph_url TEXT,
ADD COLUMN IF NOT EXISTS full_content TEXT;