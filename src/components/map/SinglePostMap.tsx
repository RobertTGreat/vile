'use client'

/**
 * SinglePostMap Component
 * 
 * Displays a map showing the location of a single post.
 * Used on the post detail page to show where the item is located.
 * 
 * Features:
 * - Interactive map centered on post location
 * - Single marker for the post
 * - Popup with post details
 * - Responsive design matching glassmorphism theme
 */

import { useEffect, useState } from 'react'
import { geocodeLocation } from '@/lib/geocoding'
import { MapPin, Calendar } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface SinglePostMapProps {
  location: string | null
  title: string
  price: number | null
  imageUrl: string | null
  createdAt: string
  isSold: boolean
}

/**
 * Component to update map view when location changes
 * Must be a child of MapContainer to use useMap hook
 */
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const [UseMapComponent, setUseMapComponent] = useState<React.ComponentType<{ lat: number; lng: number }> | null>(null)
  
  useEffect(() => {
    // Dynamically import and create component that uses useMap
    if (typeof window === 'undefined') return
    
    import('react-leaflet').then(mod => {
      const useMap = mod.useMap
      
      const Updater = () => {
        const map = useMap()
        
        useEffect(() => {
          if (map) {
            map.setView([lat, lng], 13)
          }
        }, [lat, lng, map])

        return null
      }
      
      setUseMapComponent(() => Updater)
    })
  }, [lat, lng])
  
  if (!UseMapComponent) return null
  
  return <UseMapComponent lat={lat} lng={lng} />
}

/**
 * Format price as GBP currency
 */
const formatPrice = (price: number | null) => {
  if (!price) return 'Price not specified'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
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
 * Only works on client side
 */
const createMarkerIcon = (isSold: boolean) => {
  // Only create icon on client side
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const { Icon } = require('leaflet')
    return new Icon({
      iconUrl: isSold 
        ? 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="#ef4444"></circle>
          </svg>
        `)
        : 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="#3b82f6"></circle>
          </svg>
        `),
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  } catch (error) {
    console.error('Error creating marker icon:', error)
    return null
  }
}

export default function SinglePostMap({ location, title, price, imageUrl, createdAt, isSold }: SinglePostMapProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Geocode location on mount
  useEffect(() => {
    const geocode = async () => {
      if (!location || location.trim() === '') {
        setLoading(false)
        setError('No location provided')
        return
      }

      try {
        setLoading(true)
        setError(null)
        const coords = await geocodeLocation(location)
        
        if (coords) {
          setCoordinates(coords)
        } else {
          setError('Could not find location')
        }
      } catch (err) {
        console.error('Geocoding error:', err)
        setError('Error geocoding location')
      } finally {
        setLoading(false)
      }
    }

    geocode()
  }, [location])

  if (!mounted) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading map...</p>
        </div>
      </div>
    )
  }

  if (error || !coordinates) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center glass-card rounded-xl">
        <div className="text-center">
          <MapPin size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {error || 'Location not available'}
          </p>
          {location && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {location}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden glass-card border-2" style={{ borderColor: 'var(--border-glass)' }}>
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater lat={coordinates.lat} lng={coordinates.lng} />

        <Marker
          position={[coordinates.lat, coordinates.lng]}
          icon={mounted ? createMarkerIcon(isSold) : undefined}
        >
          <Popup className="custom-popup" maxWidth={300}>
            <div className="p-2" style={{ color: 'var(--text-primary)' }}>
              {/* Post Image */}
              {imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="font-bold text-lg mb-2">{title}</h3>

              {/* Price */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold" style={{ color: price ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {formatPrice(price)}
                </span>
                {isSold && (
                  <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                    Sold
                  </span>
                )}
              </div>

              {/* Location */}
              {location && (
                <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={14} />
                  <span>{location}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={14} />
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </Popup>
        </Marker>
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

