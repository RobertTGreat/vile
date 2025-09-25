-- Add missing foreign key constraints

-- Add foreign key from posts.user_id to profiles.id
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key from post_tags.post_id to posts.id
ALTER TABLE public.post_tags
ADD CONSTRAINT post_tags_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.posts(id)
ON DELETE CASCADE;

-- Add foreign key from post_tags.tag_id to tags.id
ALTER TABLE public.post_tags
ADD CONSTRAINT post_tags_tag_id_fkey
FOREIGN KEY (tag_id) REFERENCES public.tags(id)
ON DELETE CASCADE;
