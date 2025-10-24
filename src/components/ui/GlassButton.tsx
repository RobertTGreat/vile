/**
 * GlassButton Component
 * 
 * A reusable button component with glassmorphism styling.
 * Used throughout the application for consistent button appearance.
 * 
 * Features:
 * - Multiple variants (primary, secondary, ghost)
 * - Three size options (sm, md, lg)
 * - Hover and active animations
 * - Glassmorphism effect matching app theme
 * - Fully typed with TypeScript
 * 
 * Usage:
 * <GlassButton variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </GlassButton>
 */

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode           // Button content
  variant?: 'primary' | 'secondary' | 'ghost'  // Visual style variant
  size?: 'sm' | 'md' | 'lg'    // Button size
}

export default function GlassButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  ...props 
}: GlassButtonProps) {
  // Base styles applied to all buttons
  const baseClasses = 'glass-button rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95'
  
  // Variant-specific styles
  const variantClasses = {
    primary: 'bg-purple-500/20 border-purple-400/30 hover:bg-purple-500/30',
    secondary: 'hover:bg-white/20',
    ghost: 'bg-transparent border-transparent hover:bg-white/10'
  }
  
  // Size-specific styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
