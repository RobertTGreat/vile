-- Fix the relationship between posts and profiles
-- Since posts.user_id references auth.users(id) and profiles.id also references auth.users(id)
-- We need to add a direct foreign key from posts.user_id to profiles.id

-- First, drop the existing foreign key constraint from posts.user_id to auth.users
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Add the correct foreign key constraint from posts.user_id to profiles.id
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;
