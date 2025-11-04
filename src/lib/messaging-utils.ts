/**
 * Messaging Utilities
 * 
 * Helper functions for managing conversations and messages.
 * Provides utilities for:
 * - Starting new conversations between users
 * - Finding existing conversations
 * - Getting or creating a conversation
 * 
 * Usage:
 * import { getOrCreateConversation } from '@/lib/messaging-utils'
 * const conversationId = await getOrCreateConversation(currentUserId, otherUserId)
 */

import { createClient } from '@/lib/supabase-client'

/**
 * Get or create a conversation between two users
 * 
 * If a conversation already exists, returns its ID.
 * If no conversation exists, creates a new one and returns its ID.
 * 
 * Ensures user1_id < user2_id to prevent duplicate conversations.
 * 
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @param postId - Optional post ID that started this conversation
 * @returns Promise<string> - The conversation ID
 * @throws Error if conversation cannot be created or found
 */
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  postId?: string
): Promise<string> {
  const supabase = createClient()

  // Ensure user1_id < user2_id to match schema constraint
  const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]

  // Check if conversation already exists
  const { data: existingConv, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user1_id', user1Id)
    .eq('user2_id', user2Id)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - not an error in this case
    throw new Error(`Failed to check for existing conversation: ${findError.message}`)
  }

  // If conversation exists, update it with post_id if provided and not already set
  if (existingConv) {
    if (postId) {
      // Try to update existing conversation with post_id if it doesn't have one
      // Silently fail if column doesn't exist (for older schemas)
      try {
        await supabase
          .from('conversations')
          .update({ post_id: postId })
          .eq('id', existingConv.id)
          .is('post_id', null)
      } catch (error) {
        // Column might not exist, ignore error
        console.warn('Could not update post_id (column may not exist):', error)
      }
    }
    return existingConv.id
  }

  // Create new conversation
  // Try with post_id first, fall back to without if column doesn't exist
  let insertData: any = {
    user1_id: user1Id,
    user2_id: user2Id,
  }
  
  // Only include post_id if provided (column may not exist in older schemas)
  if (postId) {
    insertData.post_id = postId
  }

  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert(insertData)
    .select('id')
    .single()

  if (createError) {
    // If error is about post_id column not existing, try without it
    if (createError.message.includes('post_id') && postId) {
      const { data: retryConv, error: retryError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
        })
        .select('id')
        .single()

      if (retryError) {
        throw new Error(`Failed to create conversation: ${retryError.message}`)
      }

      if (!retryConv) {
        throw new Error('Conversation was created but no ID was returned')
      }

      return retryConv.id
    }

    throw new Error(`Failed to create conversation: ${createError.message}`)
  }

  if (!newConv) {
    throw new Error('Conversation was created but no ID was returned')
  }

  return newConv.id
}

/**
 * Find an existing conversation between two users
 * 
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @returns Promise<string | null> - The conversation ID if found, null otherwise
 */
export async function findConversation(
  userId1: string,
  userId2: string
): Promise<string | null> {
  const supabase = createClient()

  // Ensure user1_id < user2_id to match schema constraint
  const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]

  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('user1_id', user1Id)
    .eq('user2_id', user2Id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - not an error in this case
    throw new Error(`Failed to find conversation: ${error.message}`)
  }

  return data?.id || null
}

