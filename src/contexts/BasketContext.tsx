'use client'

/**
 * BasketContext
 * 
 * Global state management for the shopping basket/cart functionality.
 * 
 * Features:
 * - Persistent storage using localStorage
 * - Add/remove items from basket
 * - Calculate total price
 * - Get item count
 * - Clear entire basket
 * 
 * Usage:
 * Wrap your app with <BasketProvider> and use the useBasket() hook
 * in any component to access basket state and methods.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * Interface for items in the shopping basket
 */
export interface BasketItem {
  id: string            // Post ID
  title: string         // Item title
  price: number         // Item price in USD
  image_url: string     // Primary image URL
  seller: string        // Seller username
}

/**
 * Context type definition - defines all available basket methods and state
 */
interface BasketContextType {
  items: BasketItem[]                              // Array of items in basket
  addToBasket: (item: BasketItem) => void         // Add item to basket
  removeFromBasket: (id: string) => void          // Remove item by ID
  clearBasket: () => void                          // Clear all items
  getTotalPrice: () => number                      // Calculate total price
  getItemCount: () => number                       // Get number of items
}

const BasketContext = createContext<BasketContextType | undefined>(undefined)

/**
 * BasketProvider Component
 * 
 * Provides basket state and methods to all child components.
 * Persists basket data to localStorage for persistence across sessions.
 */
export function BasketProvider({ children }: { children: ReactNode }) {
  // State to hold basket items
  const [items, setItems] = useState<BasketItem[]>([])

  /**
   * Load basket from localStorage on component mount
   * Retrieves saved basket data from previous session
   */
  useEffect(() => {
    const savedBasket = localStorage.getItem('repacked-basket')
    if (savedBasket) {
      try {
        setItems(JSON.parse(savedBasket))
      } catch (error) {
        console.error('Error loading basket from localStorage:', error)
      }
    }
  }, [])

  /**
   * Save basket to localStorage whenever items change
   * Auto-saves basket state for persistence
   */
  useEffect(() => {
    localStorage.setItem('repacked-basket', JSON.stringify(items))
  }, [items])

  /**
   * Add item to basket
   * Prevents duplicate items from being added
   */
  const addToBasket = (item: BasketItem) => {
    setItems(prevItems => {
      // Check if item already exists in basket
      const existingItem = prevItems.find(i => i.id === item.id)
      if (existingItem) {
        // Item already in basket, don't add duplicate
        return prevItems
      }
      return [...prevItems, item]
    })
  }

  /**
   * Remove item from basket by ID
   */
  const removeFromBasket = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  /**
   * Clear all items from basket
   */
  const clearBasket = () => {
    setItems([])
  }

  /**
   * Calculate total price of all items in basket
   * Returns sum of all item prices
   */
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0)
  }

  /**
   * Get count of items in basket
   * Returns number of items in basket
   */
  const getItemCount = () => {
    return items.length
  }

  return (
    <BasketContext.Provider
      value={{
        items,
        addToBasket,
        removeFromBasket,
        clearBasket,
        getTotalPrice,
        getItemCount
      }}
    >
      {children}
    </BasketContext.Provider>
  )
}

/**
 * useBasket Hook
 * 
 * Custom hook to access basket context.
 * Must be used within a BasketProvider component.
 * 
 * @throws Error if used outside BasketProvider
 * @returns BasketContextType with basket state and methods
 */
export function useBasket() {
  const context = useContext(BasketContext)
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider')
  }
  return context
}
