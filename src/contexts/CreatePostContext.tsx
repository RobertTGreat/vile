'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CreatePostContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const CreatePostContext = createContext<CreatePostContextType | undefined>(undefined)

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <CreatePostContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal
      }}
    >
      {children}
    </CreatePostContext.Provider>
  )
}

export function useCreatePost() {
  const context = useContext(CreatePostContext)
  if (context === undefined) {
    throw new Error('useCreatePost must be used within a CreatePostProvider')
  }
  return context
}

