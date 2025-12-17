-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload (for admin)
CREATE POLICY "Anyone can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

-- Allow update and delete
CREATE POLICY "Anyone can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');

CREATE POLICY "Anyone can delete property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images');