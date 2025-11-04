/**
 * MessagingContext Component
 * 
 * Global state management for the messaging system.
 * Provides:
 * - Message popup visibility state
 * - Current conversation selection
 * - Unread message count
 * - Methods to open/close messaging interface
 * 
 * Usage:
 * - Wrap your app with MessagingProvider
 * - Use useMessaging() hook to access messaging state
 * - Call openMessaging() to show the message popup
 * - Call closeMessaging() to hide the message popup
 */

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

/**
 * MessagingContextType - Interface for messaging context state and methods
 */
interface MessagingContextType {
  // Whether the messaging popup is currently open
  isOpen: boolean
  // Currently selected conversation ID (null if viewing conversation list)
  selectedConversationId: string | null
  // Total count of unread messages across all conversations
  unreadCount: number
  // Open the messaging popup
  openMessaging: () => void
  // Close the messaging popup
  closeMessaging: () => void
  // Select a conversation to view (opens chat window)
  selectConversation: (conversationId: string | null) => void
  // Update the unread message count
  setUnreadCount: (count: number) => void
}

/**
 * Create the messaging context with undefined default
 * This ensures we get proper TypeScript errors if context is used outside provider
 */
const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

/**
 * MessagingProvider Component
 * 
 * Provides messaging state and methods to child components.
 * Should be placed in the root layout to be accessible throughout the app.
 * 
 * @param children - Child components that need access to messaging context
 */
export function MessagingProvider({ children }: { children: ReactNode }) {
  // State for popup visibility
  const [isOpen, setIsOpen] = useState(false)
  
  // State for currently selected conversation
  // null means viewing the conversation list, string means viewing that conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  
  // State for unread message count
  const [unreadCount, setUnreadCount] = useState(0)

  /**
   * Open the messaging popup
   * Resets to conversation list view when opening
   */
  const openMessaging = () => {
    setIsOpen(true)
    setSelectedConversationId(null) // Reset to conversation list
  }

  /**
   * Close the messaging popup
   * Also resets selected conversation
   */
  const closeMessaging = () => {
    setIsOpen(false)
    setSelectedConversationId(null)
  }

  /**
   * Select a conversation to view
   * @param conversationId - The ID of the conversation to view, or null to show list
   */
  const selectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId)
  }

  return (
    <MessagingContext.Provider
      value={{
        isOpen,
        selectedConversationId,
        unreadCount,
        openMessaging,
        closeMessaging,
        selectConversation,
        setUnreadCount,
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

/**
 * useMessaging Hook
 * 
 * Custom hook to access messaging context.
 * Throws error if used outside MessagingProvider.
 * 
 * @returns MessagingContextType - The messaging context value
 * @throws Error if used outside MessagingProvider
 */
export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

