'use client'

/**
 * Post Detail Page Component
 * 
 * Dynamic route page displaying individual post details.
 * Users can view post information, images, seller details, and add to basket.
 * 
 * Features:
 * - Dynamic route using post ID
 * - Image gallery with navigation
 * - Add to basket functionality
 * - Authentication modal for non-logged-in users
 * - Post metadata display (price, condition, location, tags)
 * - Seller information
 * - Sold status display
 * 
 * Route: /post/[id]
 */

import { useState, useEffect } from 'react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import AuthModal from '@/components/auth/AuthModal'
import { MapPin, Calendar, Tag, DollarSign, UserIcon, ArrowLeft, ShoppingCart, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useBasket } from '@/contexts/BasketContext'
import { useMessaging } from '@/contexts/MessagingContext'
import { getOrCreateConversation } from '@/lib/messaging-utils'

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
  profiles: {
    username: string
    full_name: string
  }
  post_tags: Array<{
    tags: {
      id: string
      name: string
      color: string
    }
  }>
}

export default function PostPage() {
  // Get post ID from URL params
  const params = useParams()
  const postId = params.id as string
  
  // Post data state
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  // Basket functionality
  const { addToBasket } = useBasket()
  
  // Messaging functionality
  const { openMessaging, selectConversation } = useMessaging()

  const supabase = createClient()

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_id,
          profiles!user_id (username, full_name, id),
          post_tags (
            tags (name, color)
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToBasket = () => {
    if (post) {
      addToBasket({
        id: post.id,
        title: post.title,
        price: post.price || 0,
        image_url: post.image_urls?.[0] || '',
        seller: post.profiles.username
      })
    }
  }

  /**
   * Handle starting a conversation with the post seller
   * Creates or finds existing conversation and opens messaging popup
   */
  const handleMessageSeller = async () => {
    if (!post) return

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // If not logged in, open auth modal
        handleAuth('signin')
        return
      }

      // Get post seller's user ID (from post.user_id or post.profiles.id)
      const postUserId = (post as any).user_id || (post.profiles as any).id

      // Don't allow messaging yourself
      if (postUserId === user.id) {
        alert('You cannot message yourself')
        return
      }

      // Get or create conversation with post context
      const conversationId = await getOrCreateConversation(user.id, postUserId, postId)
      
      // Open messaging and select conversation
      openMessaging()
      selectConversation(conversationId)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header onAuth={handleAuth} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div style={{ color: 'var(--text-muted)' }}>Loading post...</div>
          </div>
        </main>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen">
        <Header onAuth={handleAuth} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Post not found
            </h1>
            <Link href="/search">
              <GlassButton>Back to Search</GlassButton>
            </Link>
          </div>
        </main>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header onAuth={handleAuth} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/search" className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} />
            Back to Search
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {post.image_urls && post.image_urls.length > 0 ? (
              <>
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  {/* Blurred background image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-xl scale-110"
                    style={{ backgroundImage: `url(${post.image_urls[selectedImageIndex]})` }}
                  />
                  {/* Main image with fit */}
                  <img
                    src={post.image_urls[selectedImageIndex]}
                    alt={post.title}
                    className="relative w-full h-full object-contain z-10"
                  />
                </div>
                {post.image_urls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {post.image_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all relative ${
                          selectedImageIndex === index ? 'border-purple-400' : 'border-transparent'
                        }`}
                      >
                        {/* Blurred background image */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center blur-xl scale-110"
                          style={{ backgroundImage: `url(${url})` }}
                        />
                        {/* Main image with fit */}
                        <img
                          src={url}
                          alt={`${post.title} ${index + 1}`}
                          className="relative w-full h-full object-contain z-10"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video rounded-xl bg-gray-800/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                    <Tag size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>No images</p>
                </div>
              </div>
            )}
          </div>

          {/* Post Details */}
          <div className="space-y-6">
            <GlassCard className="p-6 relative">
              {/* Message Seller Button - Top Right */}
              <button
                onClick={handleMessageSeller}
                className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-primary)' }}
                title="Message Seller"
              >
                <MessageCircle size={20} />
              </button>
              
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 pr-12" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                  </h1>
                  {post.price && (
                    <div className="flex items-center gap-2 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <DollarSign size={24} />
                      {post.price.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {post.profiles.username ? (
                    <Link
                      href={`/@${post.profiles.username}`}
                      className="flex items-center gap-1 hover:underline transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
                    >
                      <UserIcon size={16} />
                      <span>@{post.profiles.username}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1">
                      <UserIcon size={16} />
                      <span>{post.profiles.full_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {post.description && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Description
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{post.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {post.condition && (
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Condition:</span>
                      <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                        {post.condition.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                  {post.category && (
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Category:</span>
                      <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{post.category}</span>
                    </div>
                  )}
                  {post.location && (
                    <div className="col-span-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Location:</span>
                      <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{post.location}</span>
                    </div>
                  )}
                </div>

                {post.post_tags && post.post_tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.post_tags.map((tagWrapper, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                          style={{ 
                            backgroundColor: tagWrapper.tags.color + '20', 
                            color: tagWrapper.tags.color 
                          }}
                        >
                          <Tag size={12} />
                          {tagWrapper.tags.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-glass)' }}>
                  {/* Add to Basket Button */}
                  {post.is_sold ? (
                    <div className="text-center py-4">
                      <span className="text-red-400 font-semibold">This item has been sold</span>
                    </div>
                  ) : (
                    <GlassButton
                      onClick={handleAddToBasket}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={!post.price}
                    >
                      <ShoppingCart size={20} />
                      Add to Basket
                    </GlassButton>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  )
}
