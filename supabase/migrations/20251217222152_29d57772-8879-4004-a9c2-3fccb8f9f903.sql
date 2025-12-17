-- Drop and recreate the policy with proper WITH CHECK for INSERT
DROP POLICY IF EXISTS "Allow all access to channel_posts" ON public.channel_posts;

CREATE POLICY "Allow all access to channel_posts" 
ON public.channel_posts 
FOR ALL 
USING (true)
WITH CHECK (true);