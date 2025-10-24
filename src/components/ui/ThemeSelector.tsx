'use client'

/**
 * ThemeSelector Component
 * 
 * A button component that allows users to toggle between light and dark themes.
 * Displays an icon representing the opposite theme (shows moon when light, sun when dark).
 * 
 * Features:
 * - Icon changes based on current theme
 * - Tooltip shows next theme
 * - Uses ThemeContext for state management
 * - Ghost variant for subtle appearance
 * 
 * Usage:
 * <ThemeSelector />
 */

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import GlassButton from './GlassButton'

export default function ThemeSelector() {
  // Get theme state and toggle function from context
  const { theme, toggleTheme } = useTheme()

  return (
    <GlassButton
      variant="ghost"
      onClick={toggleTheme}
      className="p-2"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Show moon icon when light theme (indicating switch to dark) */}
      {theme === 'light' ? (
        <Moon size={20} style={{ color: 'var(--text-primary)' }} />
      ) : (
        /* Show sun icon when dark theme (indicating switch to light) */
        <Sun size={20} style={{ color: 'var(--text-primary)' }} />
      )}
    </GlassButton>
  )
}
