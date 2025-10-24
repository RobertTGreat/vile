'use client'

/**
 * PostCard Component
 * 
 * Displays a single post/marketplace listing in a card format.
 * This is the main visual representation of items users can browse and purchase.
 * 
 * Features:
 * - Clickable card that navigates to post detail page
 * - Displays post image, title, price, condition, location
 * - Shows seller information
 * - Tag display with custom colors
 * - "Add to Cart" button (appears on hover)
 * - Sold status indicator
 * - Responsive glassmorphism design
 * 
 * Behavior:
 * - Entire card is clickable and links to post detail page
 * - "Add to Cart" button only shows on hover to avoid accidental clicks
 * - Prevents adding sold items to basket
 */

import { useState } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import { useBasket } from '@/contexts/BasketContext'
import { MapPin, Calendar, Tag, DollarSign, ShoppingCart, Plus } from 'lucide-react'

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

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  // Track if post image fails to load
  const [imageError, setImageError] = useState(false)
  
  // Basket context hook to add items to cart
  const { addToBasket } = useBasket()

  /**
   * Format price as USD currency
   * Returns "Price not specified" if price is null
   */
  const formatPrice = (price: number | null) => {
    if (!price) return 'Price not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  /**
   * Format date string to readable format (e.g., "Jan 15, 2024")
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  /**
   * Get color class based on item condition
   * Maps condition values to Tailwind color classes
   */
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

  /**
   * Handle adding item to shopping basket
   * Prevents navigation to post page and stops event propagation
   * Won't add sold items to basket
   */
  const handleAddToBasket = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to post page
    e.stopPropagation()
    
    if (post.is_sold) return // Don't add sold items
    
    addToBasket({
      id: post.id,
      title: post.title,
      price: post.price || 0,
      image_url: post.image_urls?.[0] || '',
      seller: post.profiles.username || post.profiles.full_name
    })
  }

  return (
    <Link href={`/post/${post.id}`}>
      {/* Main card container with hover scale effect */}
      <GlassCard className="p-6 hover:scale-105 transition-transform duration-300 cursor-pointer relative group">
        {/* Post Image - Shows first image if available */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4">
            <img
              src={post.image_urls[0]}
              alt={post.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Header section with title, seller, and sold badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* Post title - limited to 2 lines with line-clamp */}
            <h3 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {post.title}
            </h3>
            {/* Seller username */}
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              by {post.profiles.username || post.profiles.full_name}
            </p>
          </div>
          {/* Sold badge - only shows if item is sold */}
          {post.is_sold && (
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
              Sold
            </span>
          )}
        </div>

        {/* Description - limited to 1 line */}
        {post.description && (
          <p className="mb-4 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
            {post.description}
          </p>
        )}

        {/* Price, condition, and location metadata */}
        <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          {/* Price display */}
          <div className="flex items-center gap-1">
            <DollarSign size={16} />
            <span className={post.price ? 'font-medium' : ''} style={{ color: post.price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {formatPrice(post.price)}
            </span>
          </div>
          
          {/* Condition badge with color coding */}
          {post.condition && (
            <div className="flex items-center gap-1">
              <span className={getConditionColor(post.condition)}>
                {post.condition.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Location display */}
          {post.location && (
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{post.location}</span>
            </div>
          )}
        </div>

        {/* Tags and category section */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Custom colored tags */}
          {post.post_tags && post.post_tags.length > 0 && (
            <>
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
            </>
          )}
          
          {/* Category badge */}
          {post.category && (
            <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
              {post.category}
            </span>
          )}
        </div>

        {/* Footer with date and add to cart button */}
        <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {/* Creation date */}
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(post.created_at)}</span>
          </div>
          
          {/* Add to Basket Button - Only shows on hover and when not sold */}
          {!post.is_sold && (
            <button
              onClick={handleAddToBasket}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}
        </div>
      </GlassCard>
    </Link>
  )
}
