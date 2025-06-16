"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Move3D, ZoomIn, Eye, RotateCw } from "lucide-react"

interface CameraControlsHelperProps {
  orbitControlsRef: React.RefObject<any>
}

export function CameraControlsHelper({ orbitControlsRef }: CameraControlsHelperProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const resetCamera = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.reset()
    }
  }

  const rotateLeft = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.rotateLeft(Math.PI / 4)
    }
  }

  const rotateRight = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.rotateRight(Math.PI / 4)
    }
  }

  if (!isVisible) {
    return (
      <div className="absolute top-4 right-4 z-10">
        <Button size="sm" variant="outline" onClick={() => setIsVisible(true)} className="bg-white/90 backdrop-blur-sm">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="text-xs font-medium mb-2 text-gray-700">Camera Controls</div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button size="sm" variant="outline" onClick={rotateLeft} title="Rotate Left">
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={rotateRight} title="Rotate Right">
          <RotateCw className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={resetCamera} title="Reset View" className="col-span-2">
          <Eye className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex items-center">
          <Move3D className="w-3 h-3 mr-1" />
          <span>Right-click + drag: Pan</span>
        </div>
        <div className="flex items-center">
          <RotateCcw className="w-3 h-3 mr-1" />
          <span>Left-click + drag: Rotate</span>
        </div>
        <div className="flex items-center">
          <ZoomIn className="w-3 h-3 mr-1" />
          <span>Scroll: Zoom</span>
        </div>
      </div>

      <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)} className="w-full mt-2 text-xs">
        Hide
      </Button>
    </div>
  )
}
