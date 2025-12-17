-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow all access to channel_posts" ON public.channel_posts;

-- Create permissive policy for all operations
CREATE POLICY "Allow all access to channel_posts" 
ON public.channel_posts 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);