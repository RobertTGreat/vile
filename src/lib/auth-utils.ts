/**
 * Authentication Utilities
 * 
 * Helper functions for handling Supabase authentication with proper error handling.
 * Prevents "Invalid Refresh Token" errors from breaking the app.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

/**
 * Safely get the current user, handling refresh token errors gracefully
 * 
 * @param supabase - Supabase client instance
 * @returns User object or null if not authenticated or error occurred
 */
export async function safeGetUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Handle refresh token errors specifically
      if (error.message.includes('refresh') || 
          error.message.includes('token') || 
          error.message.includes('Invalid Refresh Token')) {
        console.warn('Auth token error detected, clearing session:', error.message)
        // Clear invalid session
        await supabase.auth.signOut()
        return null
      }
      
      // Handle missing session errors gracefully (not logged in)
      if (error.message.includes('session') || error.message.includes('missing')) {
        // This is normal when user is not logged in, don't log as error
        return null
      }
      
      // For other errors, log but don't clear session
      console.error('Error getting user:', error.message)
      return null
    }
    
    return user
  } catch (error: any) {
    console.error('Unexpected error getting user:', error)
    return null
  }
}

/**
 * Check if an error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false
  
  const message = error.message || error.toString() || ''
  return message.includes('refresh') || 
         message.includes('token') || 
         message.includes('Invalid Refresh Token') ||
         message.includes('Refresh Token Not Found')
}

