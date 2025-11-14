/**
 * Geocoding Utility
 * 
 * Converts location strings (e.g., "New York, NY") to latitude/longitude coordinates
 * using OpenStreetMap's Nominatim geocoding service (free, no API key required)
 * 
 * Features:
 * - Rate limiting to respect Nominatim usage policy
 * - Caching to reduce API calls
 * - Error handling for invalid locations
 */

interface GeocodeResult {
  lat: number
  lng: number
  display_name: string
}

// Cache for geocoding results to reduce API calls
const geocodeCache = new Map<string, GeocodeResult>()

// Rate limiting: Nominatim allows 1 request per second
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second

/**
 * Geocode a location string to coordinates
 * 
 * @param location - Location string (e.g., "New York, NY" or "San Francisco, CA")
 * @returns Promise resolving to lat/lng coordinates or null if geocoding fails
 */
export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!location || location.trim() === '') {
    return null
  }

  const normalizedLocation = location.trim()

  // Check cache first
  if (geocodeCache.has(normalizedLocation)) {
    const cached = geocodeCache.get(normalizedLocation)!
    return { lat: cached.lat, lng: cached.lng }
  }

  try {
    // Rate limiting: wait if needed
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    // Call Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedLocation)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Repacked Marketplace App' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn(`No geocoding results for location: ${normalizedLocation}`)
      return null
    }

    const result = data[0]
    const geocodeResult: GeocodeResult = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name
    }

    // Cache the result
    geocodeCache.set(normalizedLocation, geocodeResult)

    return { lat: geocodeResult.lat, lng: geocodeResult.lng }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Batch geocode multiple locations
 * Respects rate limiting between requests
 * 
 * @param locations - Array of location strings
 * @returns Promise resolving to array of geocoded coordinates (null for failed geocodes)
 */
export async function geocodeLocations(
  locations: string[]
): Promise<Array<{ lat: number; lng: number } | null>> {
  const results: Array<{ lat: number; lng: number } | null> = []

  for (const location of locations) {
    const result = await geocodeLocation(location)
    results.push(result)
  }

  return results
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear()
}

