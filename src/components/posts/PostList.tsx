'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import PostCard from './PostCard'
import GlassButton from '@/components/ui/GlassButton'
import { Search, Filter, Plus } from 'lucide-react'

interface Post {
  id: string
  title: string
  description: string
  price: number | null
  condition: string | null
  category: string | null
  location: string | null
  created_at: string
  is_sold: boolean
  profiles: {
    username: string
    full_name: string
  }
  tags: Array<{
    tags: {
      name: string
      color: string
    }
  }>
}

interface PostListProps {
  onCreatePost: () => void
  isAuthenticated: boolean
}

export default function PostList({ onCreatePost, isAuthenticated }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name),
          tags:post_tags (
            tags:tag_id (name, color)
          )
        `)

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'price_low':
          query = query.order('price', { ascending: true, nullsFirst: false })
          break
        case 'price_high':
          query = query.order('price', { ascending: false, nullsFirst: false })
          break
        case 'title':
          query = query.order('title', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      if (selectedCondition) {
        query = query.eq('condition', selectedCondition)
      }

      const { data, error } = await query

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.message.includes('relation "posts" does not exist') || 
            error.message.includes('relation') ||
            error.message.includes('does not exist')) {
          console.warn('Database tables not yet created. Please run the migration first.')
          setPosts([])
          return
        }
        console.error('Database error:', error)
        setPosts([])
        return
      }
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Set empty array on error to prevent crashes
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPosts()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategory, selectedCondition, sortBy])

  const categories = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Sports', 'Automotive', 'Home & Garden', 'Toys & Games', 'Collectibles', 'Other']
  const conditions = ['new', 'like_new', 'good', 'fair', 'poor']
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'title', label: 'Title A-Z' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div style={{ color: 'var(--text-muted)' }}>Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar - Filters */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-24 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-input rounded-xl focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="space-y-4 p-4 glass-card rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
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
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
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
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      sortBy === option.value 
                        ? 'bg-blue-500/20 border border-blue-400/30 text-blue-400' 
                        : 'glass-button hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Create Post Button - Only show if authenticated */}
        {isAuthenticated && (
          <div className="flex justify-end">
            <GlassButton onClick={onCreatePost} className="p-3">
              <Plus size={24} />
            </GlassButton>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>No posts found</div>
            {isAuthenticated && (
              <GlassButton onClick={onCreatePost}>
                Create the first post
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
