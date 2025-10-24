'use client'

/**
 * SearchContext
 * 
 * Global state management for search functionality across the application.
 * Provides search term state that can be accessed from any component.
 * 
 * Usage:
 * Wrap your app with <SearchProvider> and use the useSearch() hook
 * to access and update the search term.
 */

import { createContext, useContext, useState } from 'react'

/**
 * Context type definition for search state
 */
interface SearchContextType {
  searchTerm: string                    // Current search query
  setSearchTerm: (term: string) => void // Function to update search term
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

/**
 * SearchProvider Component
 * 
 * Provides search state to all child components.
 * Maintains the current search term across the application.
 */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  // State to hold the current search term
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  )
}

/**
 * useSearch Hook
 * 
 * Custom hook to access search context.
 * Must be used within a SearchProvider component.
 * 
 * @throws Error if used outside SearchProvider
 * @returns SearchContextType with search term and setter
 */
export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
