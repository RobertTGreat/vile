-- Add image_urls column to posts table for storing UploadThing URLs
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Create index for image_urls
CREATE INDEX IF NOT EXISTS posts_image_urls_idx ON public.posts USING GIN (image_urls);
