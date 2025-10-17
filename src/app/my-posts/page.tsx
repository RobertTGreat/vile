'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import EditPostModal from '@/components/posts/EditPostModal'
import { Edit, Trash2, Eye, Calendar, DollarSign, MapPin } from 'lucide-react'
import Link from 'next/link'

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

export default function MyPostsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchUserPosts(user.id)
      } else {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])


  const fetchUserPosts = async (userId: string) => {
    try {
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
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
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
      setError(error.message)
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
  }

  const handlePostUpdated = async () => {
    if (user) {
      await fetchUserPosts(user.id)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

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

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header onAuth={handleAuth} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Please sign in to view your posts
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            My Posts
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your marketplace listings
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading your posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <GlassButton onClick={() => window.location.reload()}>
              Try Again
            </GlassButton>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>
              You haven't created any posts yet
            </div>
            <Link href="/search">
              <GlassButton>Create Your First Post</GlassButton>
            </Link>
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
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

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
    </div>
  )
}
