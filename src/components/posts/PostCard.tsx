'use client'

import { useState } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import { MapPin, Calendar, Tag, DollarSign } from 'lucide-react'

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
      name: string
      color: string
    }
  }>
}

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const [imageError, setImageError] = useState(false)

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

  const getConditionColor = (condition: string | null) => {
    const colors = {
      new: 'text-green-400',
      like_new: 'text-blue-400',
      good: 'text-yellow-400',
      fair: 'text-orange-400',
      poor: 'text-red-400'
    }
    return colors[condition as keyof typeof colors] || 'text-white/70'
  }

  return (
    <Link href={`/post/${post.id}`}>
      <GlassCard className="p-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
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

        <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {post.title}
          </h3>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            by {post.profiles.username || post.profiles.full_name}
          </p>
        </div>
        {post.is_sold && (
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
            Sold
          </span>
        )}
      </div>

      {post.description && (
        <p className="mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
          {post.description}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <DollarSign size={16} />
          <span className={post.price ? 'font-medium' : ''} style={{ color: post.price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {formatPrice(post.price)}
          </span>
        </div>
        
        {post.condition && (
          <div className="flex items-center gap-1">
            <span className={getConditionColor(post.condition)}>
              {post.condition.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}
        
        {post.location && (
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>{post.location}</span>
          </div>
        )}
      </div>

      {post.post_tags && post.post_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.post_tags.map((tagWrapper, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
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
      )}

      <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{formatDate(post.created_at)}</span>
        </div>
        {post.category && (
          <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
            {post.category}
          </span>
        )}
      </div>
      </GlassCard>
    </Link>
  )
}
