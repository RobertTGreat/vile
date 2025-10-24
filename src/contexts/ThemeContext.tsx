'use client'

/**
 * ThemeContext
 * 
 * Global state management for application theme (light/dark mode).
 * Provides theme switching functionality across the entire application.
 * 
 * Features:
 * - Persistent theme storage in localStorage
 * - System preference detection
 * - Theme toggle functionality
 * - Theme state accessible throughout app
 * 
 * Usage:
 * Wrap your app with <ThemeProvider> and use the useTheme() hook
 * to access theme state and toggle functions.
 */

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/**
 * Context type definition for theme state
 */
interface ThemeContextType {
  theme: Theme                  // Current theme
  toggleTheme: () => void      // Function to toggle between themes
  setTheme: (theme: Theme) => void  // Function to set specific theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider Component
 * 
 * Provides theme state to all child components.
 * Persists theme preference and applies it to the document.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // State to hold current theme
  const [theme, setThemeState] = useState<Theme>('dark')

  /**
   * Effect to initialize theme on mount
   * Checks localStorage for saved preference or system preference
   */
  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    } else {
      // Check system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setThemeState(prefersDark ? 'dark' : 'light')
    }
  }, [])

  /**
   * Effect to apply theme changes
   * Updates document attribute and saves to localStorage
   */
  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme)
    // Save theme preference
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  /**
   * Set theme to a specific value
   * 
   * @param newTheme - Theme to set ('light' or 'dark')
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 * 
 * Custom hook to access theme context.
 * Must be used within a ThemeProvider component.
 * 
 * @throws Error if used outside ThemeProvider
 * @returns ThemeContextType with theme state and methods
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
