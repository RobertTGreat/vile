/**
 * Avatar Component with Caching
 *
 * Displays user avatars with automatic caching from the avatars bucket.
 * Prevents loading animations on subsequent loads.
 *
 * Features:
 * - Automatic caching of avatar images
 * - Fallback to default avatar
 * - Loading states
 * - Responsive sizing
 *
 * Usage:
 * <Avatar src="https://supabase-url/avatar.jpg" alt="User Name" size="md" />
 */

import { useCachedAvatar } from '@/hooks/useCachedData'

interface AvatarProps {
  src: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

export default function Avatar({ src, alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
  const { imageUrl, loading, error } = useCachedAvatar(src)

  const sizeClass = sizeClasses[size]

  if (loading) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-700/50 animate-pulse flex-shrink-0 ${className}`} />
    )
  }

  if (error || !imageUrl) {
    // Fallback to default avatar
    return (
      <div className={`${sizeClass} rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0 ${className}`}>
        <svg
          className="w-1/2 h-1/2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
    />
  )
}
