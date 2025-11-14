'use client'

/**
 * Map Page Component
 * 
 * Facebook Marketplace-style map viewer for browsing posts by location.
 * 
 * Features:
 * - Interactive map with all posts displayed as markers
 * - Filtering by category, condition, and search term
 * - Real-time updates when filters change
 * - Responsive design matching the app's glassmorphism theme
 * - Integration with existing post fetching system
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { safeGetUser } from '@/lib/auth-utils'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import { useCachedData } from '@/hooks/useCachedData'
import { Search, Filter, MapPin, X } from 'lucide-react'
import CreatePostModal from '@/components/posts/CreatePostModal'
import AuthModal from '@/components/auth/AuthModal'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

// Dynamically import MapViewer to avoid SSR issues with Leaflet
const MapViewer = dynamicImport(() => import('@/components/map/MapViewer'), {
  ssr: false,
  loading: () => (
    <GlassCard className="p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
    </GlassCard>
  )
})

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

export default function MapPage() {
  // Modal state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const supabase = createClient()

  /**
   * Effect to manage user authentication state
   */
  useEffect(() => {
    const getUser = async () => {
      const user = await safeGetUser(supabase)
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' && !session) {
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Create cache key based on filter parameters
  const cacheKey = `mapPosts:${searchTerm}:${selectedCategory}:${selectedCondition}`

  // Fetch posts with filters
  const { data: posts = [], loading: postsLoading, refetch: refetchPosts } = useCachedData({
    cacheKey,
    fetcher: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name),
          tags:post_tags (
            tags:tag_id (name, color)
          )
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      if (selectedCondition) {
        query = query.eq('condition', selectedCondition)
      }

      // Only get posts with locations
      query = query.not('location', 'is', null)
      query = query.neq('location', '')

      const { data, error } = await query

      if (error) {
        if (error.message.includes('relation "posts" does not exist')) {
          console.warn('Database tables not yet created. Please run the migration first.')
          return []
        }
        console.error('Database error:', error)
        return []
      }

      return data || []
    },
    enabled: true,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    persist: false
  })

  // Debounce search and refetch
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      refetchPosts()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategory, selectedCondition, refetchPosts])

  // Set up real-time subscription for cache invalidation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const postsChannel = supabase
      .channel('map-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        () => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            refetchPosts()
          }, 1000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        () => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            refetchPosts()
          }, 1000)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeoutId)
      supabase.removeChannel(postsChannel)
    }
  }, [supabase, refetchPosts])

  /**
   * Handle create post action
   */
  const handleCreatePost = () => {
    if (user) {
      setIsCreatePostOpen(true)
    } else {
      setIsAuthOpen(true)
      setAuthMode('signin')
    }
  }

  /**
   * Handle post creation completion
   */
  const handlePostCreated = () => {
    setIsCreatePostOpen(false)
    refetchPosts()
  }

  /**
   * Handle authentication action
   */
  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedCondition('')
  }

  const categories = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Sports', 'Automotive', 'Home & Garden', 'Toys & Games', 'Collectibles', 'Other']
  const conditions = ['new', 'like_new', 'good', 'fair', 'poor']

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== '' || selectedCondition !== ''

  return (
    <div className="min-h-screen">
      <Header onAuth={handleAuth} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Browse on Map
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Explore marketplace items by location
          </p>
        </div>

        {/* Filters Section */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input rounded-xl focus:outline-none"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 glass-button rounded-xl"
            >
              <Filter size={20} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {[searchTerm, selectedCategory, selectedCondition].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 glass-button rounded-xl"
              >
                <X size={20} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Filters Panel */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block mt-4 pt-4 border-t`} style={{ borderColor: 'var(--border-glass)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      selectedCategory === '' 
                        ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400' 
                        : 'glass-button hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        selectedCategory === category 
                          ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400' 
                          : 'glass-button hover:bg-white/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCondition('')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      selectedCondition === '' 
                        ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400' 
                        : 'glass-button hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  {conditions.map(condition => (
                    <button
                      key={condition}
                      onClick={() => setSelectedCondition(condition)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        selectedCondition === condition 
                          ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400' 
                          : 'glass-button hover:bg-white/10'
                      }`}
                    >
                      {condition.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Map Viewer */}
        {postsLoading ? (
          <GlassCard className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>
          </GlassCard>
        ) : (
          <div className="mb-6">
            <MapViewer posts={posts || []} />
          </div>
        )}

        {/* Posts Count */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {(posts || []).length} {(posts || []).length === 1 ? 'post' : 'posts'} with locations
              </span>
            </div>
            {user && (
              <GlassButton onClick={handleCreatePost}>
                Create Post
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </main>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  )
}

