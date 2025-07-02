"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  RotateCcw, 
  Move3D, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Home,
  Camera,
  Grid3X3,
  CircleDot,
  Trash2
} from "lucide-react"

interface EnhancedCameraControlsProps {
  orbitControlsRef: React.RefObject<any>
  onToggleGrid?: () => void
  onToggleSnapPoints?: () => void
  onDeleteSelected?: () => void
  gridVisible?: boolean
  showLabels?: boolean
  selectedComponentsCount?: number
}

export function EnhancedCameraControls({ 
  orbitControlsRef, 
  onToggleGrid, 
  onToggleSnapPoints, 
  onDeleteSelected, 
  gridVisible = false, 
  showLabels = false, 
  selectedComponentsCount = 0 
}: EnhancedCameraControlsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState({ x: 900, y: 80 }) // Start aligned with right-side buttons
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Camera movement functions using direct camera manipulation
  const panLeft = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Calculate right vector (perpendicular to camera direction)
      const rightVector = new THREE.Vector3()
      rightVector.crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize()
      
      // Move camera and target
      const moveDistance = 1
      camera.position.addScaledVector(rightVector, -moveDistance)
      target.addScaledVector(rightVector, -moveDistance)
      
      orbitControlsRef.current.update()
    }
  }

  const panRight = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Calculate right vector
      const rightVector = new THREE.Vector3()
      rightVector.crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).normalize()
      
      // Move camera and target
      const moveDistance = 1
      camera.position.addScaledVector(rightVector, moveDistance)
      target.addScaledVector(rightVector, moveDistance)
      
      orbitControlsRef.current.update()
    }
  }

  const panUp = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Move camera and target up
      const moveDistance = 1
      camera.position.y += moveDistance
      target.y += moveDistance
      
      orbitControlsRef.current.update()
    }
  }

  const panDown = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Move camera and target down
      const moveDistance = 1
      camera.position.y -= moveDistance
      target.y -= moveDistance
      
      orbitControlsRef.current.update()
    }
  }

  const zoomIn = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Move camera closer to target
      const direction = new THREE.Vector3().subVectors(target, camera.position).normalize()
      camera.position.addScaledVector(direction, 1)
      
      orbitControlsRef.current.update()
    }
  }

  const zoomOut = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Move camera away from target
      const direction = new THREE.Vector3().subVectors(target, camera.position).normalize()
      camera.position.addScaledVector(direction, -1)
      
      orbitControlsRef.current.update()
    }
  }

  const resetCamera = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.reset()
    }
  }

  const rotateLeft = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Rotate around the target
      const offset = new THREE.Vector3().subVectors(camera.position, target)
      const spherical = new THREE.Spherical().setFromVector3(offset)
      
      spherical.theta -= Math.PI / 8 // 22.5 degrees
      
      offset.setFromSpherical(spherical)
      camera.position.copy(target).add(offset)
      camera.lookAt(target)
      
      orbitControlsRef.current.update()
    }
  }

  const rotateRight = () => {
    if (orbitControlsRef.current?.object) {
      const camera = orbitControlsRef.current.object
      const target = orbitControlsRef.current.target
      
      // Rotate around the target
      const offset = new THREE.Vector3().subVectors(camera.position, target)
      const spherical = new THREE.Spherical().setFromVector3(offset)
      
      spherical.theta += Math.PI / 8 // 22.5 degrees
      
      offset.setFromSpherical(spherical)
      camera.position.copy(target).add(offset)
      camera.lookAt(target)
      
      orbitControlsRef.current.update()
    }
  }

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging when clicking on header area (not on buttons)
    const isButton = (e.target as HTMLElement).closest('button')
    if (cardRef.current && !isButton) {
      e.preventDefault()
      const rect = cardRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with input fields
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          panUp()
          break
        case 's':
          panDown()
          break
        case 'a':
          panLeft()
          break
        case 'd':
          panRight()
          break
        case 'q':
          rotateLeft()
          break
        case 'e':
          rotateRight()
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case 'r':
          resetCamera()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) {
    return (
      <div 
        className="fixed z-30"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <Button size="sm" variant="outline" onClick={() => setIsVisible(true)} className="bg-white/90 backdrop-blur-sm">
          <Camera className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="fixed z-30"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div 
        ref={cardRef}
        className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} flex items-center gap-1 px-3 py-2`}
        onMouseDown={handleMouseDown}
      >
        {/* Camera Icon & Close */}
        <Camera className="w-4 h-4 text-gray-600" />
        
        {/* Movement Controls */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Button size="sm" variant="ghost" onClick={panUp} title="Move Up (W)" className="h-7 w-7 p-0">
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={panDown} title="Move Down (S)" className="h-7 w-7 p-0">
            <ArrowDown className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={panLeft} title="Move Left (A)" className="h-7 w-7 p-0">
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={panRight} title="Move Right (D)" className="h-7 w-7 p-0">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Rotation Controls */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Button size="sm" variant="ghost" onClick={rotateLeft} title="Rotate Left (Q)" className="h-7 w-7 p-0">
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={rotateRight} title="Rotate Right (E)" className="h-7 w-7 p-0">
            <RotateCw className="w-3 h-3" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Button size="sm" variant="ghost" onClick={zoomIn} title="Zoom In (+)" className="h-7 w-7 p-0">
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={zoomOut} title="Zoom Out (-)" className="h-7 w-7 p-0">
            <ZoomOut className="w-3 h-3" />
          </Button>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Button size="sm" variant="ghost" onClick={resetCamera} title="Reset View (R)" className="h-7 w-7 p-0">
            <Home className="w-3 h-3" />
          </Button>
        </div>

        {/* Grid & Snap Points Controls */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <Button 
            size="sm" 
            variant={gridVisible ? "default" : "ghost"} 
            onClick={onToggleGrid} 
            title="Toggle Grid" 
            className="h-7 w-7 p-0"
          >
            <Grid3X3 className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant={showLabels ? "default" : "ghost"} 
            onClick={onToggleSnapPoints} 
            title="Toggle Snap Points" 
            className="h-7 w-7 p-0"
          >
            <CircleDot className="w-3 h-3" />
          </Button>
        </div>

        {/* Delete Selected Components - Only show when components are selected */}
        {selectedComponentsCount > 0 && (
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDeleteSelected} 
              title={`Delete ${selectedComponentsCount} Selected Component${selectedComponentsCount > 1 ? 's' : ''}`} 
              className="h-7 w-7 p-0 hover:bg-gray-100 hover:text-gray-900"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Close Button */}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setIsVisible(false)}
          className="h-7 w-7 p-0 hover:bg-gray-200"
          title="Hide Camera Controls"
        >
          ×
        </Button>
      </div>
    </div>
  )
} 