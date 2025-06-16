"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface TranslationContextProps {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined)

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<string>("en")

  // Placeholder translation function
  const t = (key: string) => {
    // In a real app, look up translations by key and language
    return key
  }

  const contextValue: TranslationContextProps = {
    language,
    setLanguage,
    t,
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
