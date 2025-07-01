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
    // Auto-generate admin token for development if not exists
    if (typeof window !== 'undefined') {
      const existingToken = localStorage.getItem('admin-token')
      if (!existingToken) {
        // Generate a dummy admin token for development
        // In production, this should come from proper login
        const dummyToken = generateDummyAdminToken()
        localStorage.setItem('admin-token', dummyToken)
      }
    }
    
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

// Generate a dummy JWT token for development purposes
function generateDummyAdminToken(): string {
  // Simple base64 encoded payload for development
  const header = { alg: "HS256", typ: "JWT" }
  const payload = { isAdmin: true, email: "admin@dev.local", exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) } // 24 hours
  
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  
  // For development, we'll use a simple concatenation
  // In production, this should be properly signed
  return `${encodedHeader}.${encodedPayload}.dev-signature`
}
