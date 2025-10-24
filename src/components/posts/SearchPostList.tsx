'use client'

/**
 * SearchPostList Component
 * 
 * Displays search results with filtering and sorting.
 * Used on the search page to show filtered marketplace items.
 * 
 * Features:
 * - Integrates with SearchContext for search term
 * - Category and condition filters
 * - Multiple sort options
 * - Collapsible filters on mobile
 * - Responsive grid layout
 * - Real-time search updates
 * 
 * Mobile features:
 * - Collapsible filter menu with toggle button
 * - Collapsible sort menu with current selection display
 * - Optimized for small screens
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useSearch } from '@/contexts/SearchContext'
import PostCard from './PostCard'
import GlassButton from '@/components/ui/GlassButton'
import { Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react'

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

interface SearchPostListProps {
  onCreatePost: () => void        // Callback for create post action
  isAuthenticated: boolean        // Whether user is logged in
}

export default function SearchPostList({ onCreatePost, isAuthenticated }: SearchPostListProps) {
  // Data state
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  // Mobile UI state
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  
  // Get search term from global context
  const { searchTerm } = useSearch()

  const supabase = createClient()

  /**
   * Fetch posts on component mount
   */
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!user_id (username, full_name),
          post_tags (
            tags (name, color)
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
        console.error('Database error:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        setPosts([])
        return
      }
      console.log('Fetched posts in SearchPostList:', data)
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
          {/* Mobile Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter size={20} style={{ color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-primary)' }}>Filters</span>
            </div>
            {showFilters ? <ChevronUp size={20} style={{ color: 'var(--text-primary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-primary)' }} />}
          </button>

          {/* Filters Container */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
            {/* Category Filters */}
            <div className="p-4 glass-card rounded-xl">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    selectedCategory === '' 
                      ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400' 
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
                        ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400' 
                        : 'glass-button hover:bg-white/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filters */}
            <div className="p-4 glass-card rounded-xl">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Condition
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCondition('')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    selectedCondition === '' 
                      ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400' 
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
                        ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400' 
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Sort Options and Create Post Button */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-3">
            {/* Mobile Sort Toggle */}
            <button
              onClick={() => setShowSort(!showSort)}
              className="lg:hidden w-full flex items-center justify-between p-4 glass-card rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-primary)' }}>Sort By</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
              </div>
              {showSort ? <ChevronUp size={20} style={{ color: 'var(--text-primary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-primary)' }} />}
            </button>

            {/* Sort Options */}
            <div className={`${showSort ? 'block' : 'hidden'} lg:block`}>
              <label className="hidden lg:block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSort(false)
                    }}
                    className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      sortBy === option.value 
                        ? 'bg-purple-500/20 border border-purple-400/30 text-purple-400' 
                        : 'glass-button hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Create Post Button - Only show if authenticated */}
          {isAuthenticated && (
            <div className="flex items-end">
              <GlassButton onClick={onCreatePost} className="p-3">
                <Plus size={24} />
              </GlassButton>
            </div>
          )}
        </div>

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
