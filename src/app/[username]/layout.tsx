import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'

/**
 * Profile Layout Component
 * 
 * Generates dynamic metadata for profile pages to enable rich previews
 * when sharing on social media platforms (Facebook, Twitter, LinkedIn, etc.)
 * 
 * Features:
 * - Open Graph meta tags for Facebook, LinkedIn, etc.
 * - Twitter Card meta tags
 * - Dynamic profile data fetching
 * - Profile image, name, and stats in preview
 */

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

/**
 * Get the base URL for absolute URLs
 * Uses environment variable or defaults to localhost for development
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Ensure image URL is absolute
 * If the URL is already absolute, return it as-is
 * Otherwise, prepend the base URL
 */
function getAbsoluteImageUrl(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined
  
  // If already absolute URL (starts with http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // If relative URL, make it absolute
  const baseUrl = getBaseUrl()
  return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`
}

/**
 * Generate metadata for a profile page
 * This function is called by Next.js to generate meta tags for SEO and social sharing
 */
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const resolvedParams = await params
  
  try {
    // Extract username (remove @ symbol if present)
    const username = resolvedParams.username?.startsWith('@') 
      ? resolvedParams.username.slice(1) 
      : resolvedParams.username

    if (!username) {
      return {
        title: 'Profile Not Found | Repacked',
        description: 'The profile you are looking for could not be found.',
      }
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', username)
      .single()

    if (profileError || !profile) {
      // Return default metadata if profile not found
      return {
        title: 'Profile Not Found | Repacked',
        description: 'The profile you are looking for could not be found.',
      }
    }

    const typedProfile = profile as unknown as Profile
    const baseUrl = getBaseUrl()
    const profileUrl = `${baseUrl}/${username}`
    
    // Get the profile avatar URL (absolute)
    const avatarUrl = typedProfile.avatar_url 
      ? getAbsoluteImageUrl(typedProfile.avatar_url)
      : getAbsoluteImageUrl('/defaultPFP.png')

    // Fetch post count for the profile
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', typedProfile.id)

    // Fetch sold count
    const { count: soldCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', typedProfile.id)
      .eq('is_sold', true)

    // Build profile name
    const displayName = typedProfile.full_name || typedProfile.username || 'User'
    const usernameText = typedProfile.username ? `@${typedProfile.username}` : ''

    // Build description with stats
    let description = `View ${displayName}'s profile on Repacked marketplace`
    if (usernameText) {
      description = `${usernameText} - ${description}`
    }
    
    // Add post count if available
    if (postCount !== null && postCount !== undefined) {
      description += `. ${postCount} ${postCount === 1 ? 'post' : 'posts'}`
      if (soldCount !== null && soldCount !== undefined && soldCount > 0) {
        description += `, ${soldCount} ${soldCount === 1 ? 'item' : 'items'} sold`
      }
    }

    // Truncate description if too long (Open Graph has limits)
    const maxDescriptionLength = 200
    if (description.length > maxDescriptionLength) {
      description = description.substring(0, maxDescriptionLength - 3) + '...'
    }

    // Build metadata object
    const metadata: Metadata = {
      title: `${displayName}${usernameText ? ` (${usernameText})` : ''} | Repacked`,
      description: description,
      openGraph: {
        title: displayName,
        description: description,
        url: profileUrl,
        siteName: 'Repacked',
        type: 'profile',
        images: avatarUrl ? [
          {
            url: avatarUrl,
            width: 400,
            height: 400,
            alt: `${displayName}'s profile picture`,
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary',
        title: displayName,
        description: description,
        images: avatarUrl ? [avatarUrl] : undefined,
      },
      alternates: {
        canonical: profileUrl,
      },
    }

    return metadata
  } catch (error) {
    console.error('Error generating metadata:', error)
    // Return default metadata on error
    return {
      title: 'Profile | Repacked',
      description: 'View this profile on Repacked marketplace.',
    }
  }
}

/**
 * Layout component - just passes children through
 * The metadata is generated by generateMetadata function above
 */
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
