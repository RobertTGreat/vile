'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import GlassButton from './GlassButton'

export default function ThemeSelector() {
  const { theme, toggleTheme } = useTheme()

  return (
    <GlassButton
      variant="ghost"
      onClick={toggleTheme}
      className="p-2"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon size={20} style={{ color: 'var(--text-primary)' }} />
      ) : (
        <Sun size={20} style={{ color: 'var(--text-primary)' }} />
      )}
    </GlassButton>
  )
}
