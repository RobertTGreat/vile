import { ReactNode, ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function GlassButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  ...props 
}: GlassButtonProps) {
  const baseClasses = 'glass-button rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95'
  
  const variantClasses = {
    primary: 'bg-purple-500/20 border-purple-400/30 hover:bg-purple-500/30',
    secondary: 'hover:bg-white/20',
    ghost: 'bg-transparent border-transparent hover:bg-white/10'
  }
  
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
