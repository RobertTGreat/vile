'use client'

/**
 * GlassSelect Component
 * 
 * A custom dropdown/select component with glassmorphism styling.
 * Replaces native HTML select elements to provide better UX and consistent styling.
 * 
 * Features:
 * - Custom glassmorphism design matching the app's theme
 * - Click outside to close functionality
 * - Hover effects on options
 * - Smooth animations and transitions
 * - Fully themed using CSS variables
 * 
 * @param label - The label text displayed above the select button
 * @param value - The currently selected value
 * @param onChange - Callback function called when an option is selected
 * @param options - Array of {value, label} objects for the dropdown options
 * @param placeholder - Placeholder text shown when no option is selected
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface GlassSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export default function GlassSelect({ label, value, onChange, options, placeholder = 'Select option' }: GlassSelectProps) {
  // State to track if the dropdown is open or closed
  const [isOpen, setIsOpen] = useState(false)
  
  // Ref to the dropdown container for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null)

  /**
   * Effect hook to handle clicking outside the dropdown
   * Closes the dropdown when user clicks anywhere outside of it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Only add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup: remove event listener on unmount or when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Find the currently selected option to display its label
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label above the select button */}
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      
      {/* Main trigger button - displays selected value or placeholder */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full px-4 py-3 rounded-xl focus:outline-none flex items-center justify-between transition-all duration-200 hover:opacity-80"
        style={{ 
          backgroundColor: 'var(--bg-glass)', 
          borderColor: 'var(--border-glass)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Display selected option label or placeholder */}
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {/* Chevron icon that rotates when dropdown is open */}
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {/* Dropdown overlay - only rendered when isOpen is true */}
      {isOpen && (
        <>
          {/* Semi-transparent backdrop to darken background and capture outside clicks */}
          <div 
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu container with glassmorphism styling */}
          <div 
            className="absolute z-50 w-full mt-2 rounded-xl shadow-lg border overflow-hidden transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-glass)', 
              borderColor: 'var(--border-glass)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {/* Map through options and render each as a clickable button */}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
                style={{ 
                  color: 'var(--text-primary)',
                  // Highlight the currently selected option
                  backgroundColor: value === option.value ? 'var(--bg-glass-hover)' : 'transparent'
                }}
                // Custom hover effect for non-selected options
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--bg-glass-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent'
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

