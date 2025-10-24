'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import AuthModal from '@/components/auth/AuthModal'
import { MapPin, Calendar, Tag, DollarSign, UserIcon, ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useBasket } from '@/contexts/BasketContext'

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
  const params = useParams()
  const postId = params.id as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const { addToBasket } = useBasket()

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
          profiles!user_id (username, full_name),
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
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={post.image_urls[selectedImageIndex]}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {post.image_urls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {post.image_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index ? 'border-purple-400' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${post.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-800/50 flex items-center justify-center">
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
            <GlassCard className="p-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
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
                  <div className="flex items-center gap-1">
                    <UserIcon size={16} />
                    <span>{post.profiles.username}</span>
                  </div>
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
