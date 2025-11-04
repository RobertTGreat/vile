# Profile System Setup Guide

## Database Changes Required

### 1. Add `avatar_url` column to `profiles` table

In your Supabase SQL Editor, run:

```sql
-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create `avatars` Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name it: `avatars`
4. Make it **Public** (so profile pictures can be accessed)
5. Set up Row Level Security (RLS) policies:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Features Added

✅ **Profile Edit Modal** - Users can edit their profile information
✅ **Username Update** - Change username anytime
✅ **Full Name Update** - Update display name
✅ **Profile Picture Upload** - Upload and update profile pictures
✅ **Image Compression** - Automatic compression before upload
✅ **Avatar Display** - Shows custom avatar or default picture
✅ **Edit Profile Button** - Added to My Posts page

## Usage

1. Users go to `/my-posts` page
2. Click "Edit Profile" button
3. Upload a new profile picture (optional)
4. Update username and/or full name
5. Click "Save Changes"

## File Structure

- `src/components/auth/ProfileEditModal.tsx` - Profile editing modal
- `src/lib/supabase-storage.ts` - Extended with avatar upload methods
- `src/app/my-posts/page.tsx` - Updated to show avatar and edit button

## Notes

- Profile pictures are compressed to 512x512 max size and 0.5MB max file size
- Old avatars are automatically deleted when a new one is uploaded
- Default profile picture (`/defaultPFP.png`) is shown if no avatar is set
- Username and full name are optional fields

