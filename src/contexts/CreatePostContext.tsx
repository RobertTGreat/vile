'use client'

/**
 * CreatePostContext
 * 
 * Global state management for the create post modal.
 * Provides control over modal visibility from anywhere in the application.
 * 
 * Features:
 * - Open modal from any component
 * - Close modal programmatically
 * - Check if modal is open
 * - Centralized modal state management
 * 
 * Usage:
 * Wrap your app with <CreatePostProvider> and use the useCreatePost() hook
 * to control the create post modal.
 */

import { createContext, useContext, useState, ReactNode } from 'react'

/**
 * Context type definition for create post modal state
 */
interface CreatePostContextType {
  isOpen: boolean           // Whether modal is currently open
  openModal: () => void     // Function to open the modal
  closeModal: () => void    // Function to close the modal
}

const CreatePostContext = createContext<CreatePostContextType | undefined>(undefined)

/**
 * CreatePostProvider Component
 * 
 * Provides create post modal state to all child components.
 * Manages the global state of the create post modal.
 */
export function CreatePostProvider({ children }: { children: ReactNode }) {
  // State to track if modal is open
  const [isOpen, setIsOpen] = useState(false)

  /**
   * Open the create post modal
   */
  const openModal = () => setIsOpen(true)
  
  /**
   * Close the create post modal
   */
  const closeModal = () => setIsOpen(false)

  return (
    <CreatePostContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal
      }}
    >
      {children}
    </CreatePostContext.Provider>
  )
}

/**
 * useCreatePost Hook
 * 
 * Custom hook to access create post context.
 * Must be used within a CreatePostProvider component.
 * 
 * @throws Error if used outside CreatePostProvider
 * @returns CreatePostContextType with modal state and methods
 */
export function useCreatePost() {
  const context = useContext(CreatePostContext)
  if (context === undefined) {
    throw new Error('useCreatePost must be used within a CreatePostProvider')
  }
  return context
}

