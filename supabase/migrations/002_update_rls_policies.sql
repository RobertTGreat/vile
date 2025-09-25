-- Update RLS policies to allow public read access to posts
-- This allows anyone to view posts without authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON tags;
DROP POLICY IF EXISTS "Enable read access for all users" ON post_tags;

-- Create new policies for public read access
CREATE POLICY "Enable read access for all users" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON post_tags
    FOR SELECT USING (true);

-- Keep existing policies for authenticated users to create/update/delete
-- These should already exist from the initial migration
