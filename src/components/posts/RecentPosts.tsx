'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import PostCard from './PostCard'
import GlassButton from '@/components/ui/GlassButton'
import { ArrowRight } from 'lucide-react'
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

export default function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
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
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('Database error:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        setPosts([])
        return
      }
      console.log('Fetched posts:', data)
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching recent posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div style={{ color: 'var(--text-muted)' }}>Loading recent posts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Recent Posts
        </h2>
        <Link href="/search">
          <GlassButton className="flex items-center gap-2">
            View All
            <ArrowRight size={16} />
          </GlassButton>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-lg mb-4" style={{ color: 'var(--text-muted)' }}>
            No posts yet. Be the first to create one!
          </div>
          <Link href="/search">
            <GlassButton>
              Browse Marketplace
            </GlassButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
