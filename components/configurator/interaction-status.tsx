"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"

interface InteractionStatusProps {
  orbitControlsRef: React.RefObject<any>
}

export function InteractionStatus({ orbitControlsRef }: InteractionStatusProps) {
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const checkControlsStatus = () => {
      if (orbitControlsRef.current) {
        setIsLocked(!orbitControlsRef.current.enabled)
      }
    }

    // Check status periodically
    const interval = setInterval(checkControlsStatus, 100)

    return () => clearInterval(interval)
  }, [orbitControlsRef])

  if (!isLocked) return null

  return (
    <div className="absolute top-16 left-4 z-10 bg-orange-100 border border-orange-400 text-orange-800 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <Lock className="w-4 h-4" />
      <span className="text-sm font-medium">Camera locked - manipulating component</span>
    </div>
  )
}
