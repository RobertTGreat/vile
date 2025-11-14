'use client'

/**
 * MapViewer Component
 * 
 * Displays posts on an interactive map using Leaflet.js and OpenStreetMap.
 * Similar to Facebook Marketplace's map view functionality.
 * 
 * Features:
 * - Interactive map with OpenStreetMap tiles
 * - Post markers with custom icons
 * - Popup windows showing post details
 * - Click to navigate to post detail page
 * - Responsive design matching glassmorphism theme
 * - Loading states and error handling
 * - Geocoding of location strings to coordinates
 */

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import Link from 'next/link'
import { geocodeLocation } from '@/lib/geocoding'
import { MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

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

interface PostWithCoordinates extends Post {
  coordinates: { lat: number; lng: number } | null
}

interface MapViewerProps {
  posts: Post[]
  center?: [number, number]
  zoom?: number
}

/**
 * Component to handle map bounds updates when posts change
 */
function MapBoundsUpdater({ posts }: { posts: PostWithCoordinates[] }) {
  const map = useMap()
  
  useEffect(() => {
    const validPosts = posts.filter(p => p.coordinates !== null)
    if (validPosts.length === 0) return

    const bounds = validPosts.map(p => [p.coordinates!.lat, p.coordinates!.lng] as [number, number])
    
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [posts, map])

  return null
}

/**
 * Format price as USD currency
 */
const formatPrice = (price: number | null) => {
  if (!price) return 'Price not specified'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

/**
 * Format date string to readable format
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Create custom marker icon
 */
const createMarkerIcon = (isSold: boolean) => {
  return new Icon({
    iconUrl: isSold 
      ? 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#ef4444"></circle>
        </svg>
      `)
      : 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#3b82f6"></circle>
        </svg>
      `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

export default function MapViewer({ posts, center = [40.7128, -74.0060], zoom = 10 }: MapViewerProps) {
  const [postsWithCoords, setPostsWithCoords] = useState<PostWithCoordinates[]>([])
  const [loading, setLoading] = useState(true)
  const [geocodingErrors, setGeocodingErrors] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Geocode all posts on mount
  useEffect(() => {
    const geocodePosts = async () => {
      setLoading(true)
      setGeocodingErrors([])
      
      const postsToGeocode = posts.filter(p => p.location && p.location.trim() !== '')
      
      if (postsToGeocode.length === 0) {
        setLoading(false)
        return
      }

      const geocodedPosts: PostWithCoordinates[] = []
      const errors: string[] = []

      for (const post of postsToGeocode) {
        try {
          const coords = await geocodeLocation(post.location!)
          if (coords) {
            geocodedPosts.push({ ...post, coordinates: coords })
          } else {
            errors.push(post.location!)
          }
        } catch (error) {
          console.error(`Error geocoding ${post.location}:`, error)
          errors.push(post.location!)
        }
      }

      setPostsWithCoords(geocodedPosts)
      setGeocodingErrors(errors)
      setLoading(false)
    }

    geocodePosts()
  }, [posts])

  // Default center based on geocoded posts
  const mapCenter = useMemo(() => {
    if (postsWithCoords.length > 0) {
      const validPosts = postsWithCoords.filter(p => p.coordinates !== null)
      if (validPosts.length > 0) {
        const avgLat = validPosts.reduce((sum, p) => sum + p.coordinates!.lat, 0) / validPosts.length
        const avgLng = validPosts.reduce((sum, p) => sum + p.coordinates!.lng, 0) / validPosts.length
        return [avgLat, avgLng] as [number, number]
      }
    }
    return center
  }, [postsWithCoords, center])

  if (!mounted) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading map and geocoding locations...</p>
        </div>
      </div>
    )
  }

  if (postsWithCoords.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <MapPin size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {posts.length === 0 
              ? 'No posts available to display on map'
              : 'No posts with valid locations found'}
          </p>
          {geocodingErrors.length > 0 && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Could not geocode {geocodingErrors.length} location(s)
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden glass-card border-2" style={{ borderColor: 'var(--border-glass)' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater posts={postsWithCoords} />

        {postsWithCoords.map((post) => {
          if (!post.coordinates) return null

          return (
            <Marker
              key={post.id}
              position={[post.coordinates.lat, post.coordinates.lng]}
              icon={createMarkerIcon(post.is_sold)}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2" style={{ color: 'var(--text-primary)' }}>
                  {/* Post Image */}
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img
                        src={post.image_urls[0]}
                        alt={post.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} style={{ color: 'var(--text-muted)' }} />
                    <span className="font-semibold" style={{ color: post.price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {formatPrice(post.price)}
                    </span>
                    {post.is_sold && (
                      <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                        Sold
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {post.location && (
                    <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={14} />
                      <span>{post.location}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>{formatDate(post.created_at)}</span>
                  </div>

                  {/* Description */}
                  {post.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {post.description}
                    </p>
                  )}

                  {/* Link to post */}
                  <Link
                    href={`/post/${post.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Custom popup styles */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: var(--bg-glass) !important;
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid var(--border-glass) !important;
          border-radius: 12px !important;
          color: var(--text-primary) !important;
        }
        
        .leaflet-popup-tip {
          background: var(--bg-glass) !important;
          border: 1px solid var(--border-glass) !important;
        }
        
        .leaflet-popup-close-button {
          color: var(--text-muted) !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  )
}

