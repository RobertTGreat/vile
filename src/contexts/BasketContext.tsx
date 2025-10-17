'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface BasketItem {
  id: string
  title: string
  price: number
  image_url: string
  seller: string
}

interface BasketContextType {
  items: BasketItem[]
  addToBasket: (item: BasketItem) => void
  removeFromBasket: (id: string) => void
  clearBasket: () => void
  getTotalPrice: () => number
  getItemCount: () => number
}

const BasketContext = createContext<BasketContextType | undefined>(undefined)

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([])

  // Load basket from localStorage on mount
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

  // Save basket to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('repacked-basket', JSON.stringify(items))
  }, [items])

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

  const removeFromBasket = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const clearBasket = () => {
    setItems([])
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0)
  }

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

export function useBasket() {
  const context = useContext(BasketContext)
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider')
  }
  return context
}
