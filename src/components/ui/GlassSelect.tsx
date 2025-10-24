'use client'

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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
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
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="absolute z-50 w-full mt-2 rounded-xl shadow-lg border overflow-hidden transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-glass)', 
              borderColor: 'var(--border-glass)',
              backdropFilter: 'blur(12px)'
            }}
          >
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
                  backgroundColor: value === option.value ? 'var(--bg-glass-hover)' : 'transparent'
                }}
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

