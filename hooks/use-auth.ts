"use client"

import { useState, useEffect } from "react"

interface AuthState {
  isAuthenticated: boolean
  isAdmin: boolean
  user: null | { id: string; name: string; email: string }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: true, // For demo purposes, always admin
    user: null,
  })

  useEffect(() => {
    // Mock authentication check
    setAuthState({
      isAuthenticated: true,
      isAdmin: true,
      user: {
        id: "admin-1",
        name: "Admin User",
        email: "admin@acblighting.com",
      },
    })
  }, [])

  return authState
}
