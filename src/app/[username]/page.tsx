/**
 * Public Profile Page Component
 * 
 * Public profile page accessible via /@username for any user.
 * Displays user profile information and their posts.
 * 
 * Features:
 * - View any user's profile (public)
 * - View user's posts (read-only)
 * - Edit/delete actions only shown to profile owner
 * - Profile header with avatar, name, stats
 * - Responsive design
 * 
 * Route: /[username] (handled via middleware rewrite from /@username)
 * Example: /@john_doe or /john_doe
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import EditPostModal from '@/components/posts/EditPostModal'
import ProfileEditModal from '@/components/auth/ProfileEditModal'
import { Edit, Trash2, Eye, Calendar, DollarSign, MapPin, UserCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * Post interface - represents a marketplace listing
 */
interface Post {
  id: string
  title: string
  description: string
  price: number | null
  condition: string | null
  category: string | null
  location: string | null
  image_urls: string[] | null
  created_at: string
  is_sold: boolean
  post_tags: Array<{
    tags: {
      id: string
      name: string
      color: string
    }
  }>
}

/**
 * Profile interface
 */
interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  // Extract username from URL (remove @ symbol if present)
  const usernameParam = params.username as string
  const username = usernameParam?.startsWith('@') ? usernameParam.slice(1) : usernameParam

  // Current user state (for ownership check)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')
  
  // Edit modal state
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)

  /**
   * Effect to fetch current user and profile data
   */
  useEffect(() => {
    const fetchData = async () => {
      // Fetch current user (for ownership check)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch profile by username
      await fetchProfileByUsername()
    }

    fetchData()
  }, [username, supabase])

  /**
   * Effect to fetch posts when profile is loaded
   */
  useEffect(() => {
    if (profile?.id) {
      fetchUserPosts(profile.id)
    }
  }, [profile?.id])

  /**
   * Fetch profile by username
   */
  const fetchProfileByUsername = async () => {
    try {
      setProfileLoading(true)
      setProfileError('')

      if (!username) {
        setProfileError('Username is required')
        setProfileLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', username) // Case-insensitive search
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setProfileError('User not found')
        } else {
          throw error
        }
        setProfileLoading(false)
        return
      }

      if (!data) {
        setProfileError('User not found')
        setProfileLoading(false)
        return
      }

      setProfile(data)
    } catch (error: any) {
      setProfileError(error.message || 'Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }

  /**
   * Fetch user's posts
   */
  const fetchUserPosts = async (userId: string) => {
    try {
      setPostsLoading(true)
      setPostsError('')

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_tags (
            tags (
              name,
              color
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      setPostsError(error.message || 'Failed to load posts')
    } finally {
      setPostsLoading(false)
    }
  }

  /**
   * Check if current user is viewing their own profile
   */
  const isOwnProfile = currentUser && profile && currentUser.id === profile.id

  /**
   * Handle delete post (only for own profile)
   */
  const handleDeletePost = async (postId: string) => {
    if (!isOwnProfile) return
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      // Remove from local state
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error: any) {
      setPostsError(error.message || 'Failed to delete post')
    }
  }

  /**
   * Handle edit post (only for own profile)
   */
  const handleEditPost = (post: Post) => {
    if (!isOwnProfile) return
    setEditingPost(post)
    setIsEditModalOpen(true)
  }

  /**
   * Handle post updated callback
   */
  const handlePostUpdated = async () => {
    if (profile?.id) {
      await fetchUserPosts(profile.id)
    }
  }

  /**
   * Handle profile updated callback
   */
  const handleProfileUpdated = async () => {
    await fetchProfileByUsername()
  }

  /**
   * Format price as currency
   */
  const formatPrice = (price: number | null) => {
    if (!price) return 'Price not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  /**
   * Format date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleAuth = () => {
    // Redirect to home for auth
    window.location.href = '/'
  }

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen">
        <Header onAuth={handleAuth} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (profileError || !profile) {
    return (
      <div className="min-h-screen">
        <Header onAuth={handleAuth} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {profileError || 'User not found'}
            </h1>
            <Link href="/">
              <GlassButton>Go Home</GlassButton>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header onAuth={handleAuth} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-4 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Profile Header */}
        <div className="mb-10">
          <GlassCard className="p-6">
            <div className="flex items-start md:items-center gap-4 md:gap-6 flex-col md:flex-row">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20">
                <img
                  src={profile.avatar_url || '/defaultPFP.png'}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <div>
                    <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {profile.full_name || profile.username || 'User'}
                    </div>
                    {profile.username && (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        @{profile.username}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{posts.length}</span> Posts
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{posts.filter(p => p.is_sold).length}</span> Sold
                      </div>
                    </div>
                    {isOwnProfile && (
                      <GlassButton
                        variant="secondary"
                        onClick={() => setIsProfileEditOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <UserCircle size={16} />
                        Edit Profile
                      </GlassButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Posts Section */}
        {postsLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>
          </div>
        ) : postsError ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{postsError}</div>
            <GlassButton onClick={() => profile?.id && fetchUserPosts(profile.id)}>
              Try Again
            </GlassButton>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>
              {isOwnProfile ? "You haven't created any posts yet" : "No posts yet"}
            </div>
            {isOwnProfile && (
              <Link href="/search">
                <GlassButton>Create Your First Post</GlassButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <GlassCard key={post.id} className="p-6">
                {/* Post Image */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={post.image_urls[0]}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Post Details */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {post.description}
                    </p>
                  )}
                  
                  {/* Price and Condition */}
                  <div className="flex items-center gap-4 mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span className={post.price ? 'font-medium' : ''} style={{ color: post.price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {formatPrice(post.price)}
                      </span>
                    </div>
                    
                    {post.condition && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                        {post.condition.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Location and Date */}
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {post.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{post.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  {post.is_sold && (
                    <div className="mt-2">
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium border border-red-400/30">
                        Sold
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.post_tags.map((tagWrapper, index) => (
                      <span
                        key={`tag-${tagWrapper.tags.id}-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: tagWrapper.tags.color + '20', 
                          color: tagWrapper.tags.color 
                        }}
                      >
                        {tagWrapper.tags.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/post/${post.id}`} className="flex-1">
                    <GlassButton variant="secondary" className="w-full flex items-center justify-center gap-2">
                      <Eye size={16} />
                      View
                    </GlassButton>
                  </Link>
                  {isOwnProfile && (
                    <>
                      <GlassButton
                        variant="secondary"
                        onClick={() => handleEditPost(post)}
                        className="flex items-center justify-center gap-2 px-3"
                      >
                        <Edit size={16} />
                      </GlassButton>
                      <GlassButton
                        variant="secondary"
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center justify-center gap-2 px-3"
                      >
                        <Trash2 size={16} />
                      </GlassButton>
                    </>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {/* Edit Post Modal - Only shown to profile owner */}
      {isOwnProfile && (
        <>
          <EditPostModal
            key={editingPost?.id || 'no-post'}
            post={editingPost}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingPost(null)
            }}
            onPostUpdated={handlePostUpdated}
          />

          <ProfileEditModal
            isOpen={isProfileEditOpen}
            onClose={() => setIsProfileEditOpen(false)}
            onProfileUpdated={handleProfileUpdated}
          />
        </>
      )}
    </div>
  )
}
