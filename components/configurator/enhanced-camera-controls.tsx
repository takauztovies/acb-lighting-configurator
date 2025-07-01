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
  Camera
} from "lucide-react"

interface EnhancedCameraControlsProps {
  orbitControlsRef: React.RefObject<any>
}

export function EnhancedCameraControls({ orbitControlsRef }: EnhancedCameraControlsProps) {
  const [isVisible, setIsVisible] = useState(true)

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
      <div className="absolute top-4 right-4 z-10">
        <Button size="sm" variant="outline" onClick={() => setIsVisible(true)} className="bg-white/90 backdrop-blur-sm">
          <Camera className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Camera Controls</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Pan Controls */}
          <div>
            <div className="text-xs font-medium mb-2 text-gray-700">Movement</div>
            <div className="grid grid-cols-3 gap-1">
              <div></div>
              <Button size="sm" variant="outline" onClick={panUp} title="Move Up (W)">
                <ArrowUp className="w-3 h-3" />
              </Button>
              <div></div>
              
              <Button size="sm" variant="outline" onClick={panLeft} title="Move Left (A)">
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetCamera} title="Reset View (R)">
                <Home className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={panRight} title="Move Right (D)">
                <ArrowRight className="w-3 h-3" />
              </Button>
              
              <div></div>
              <Button size="sm" variant="outline" onClick={panDown} title="Move Down (S)">
                <ArrowDown className="w-3 h-3" />
              </Button>
              <div></div>
            </div>
          </div>

          {/* Rotation Controls */}
          <div>
            <div className="text-xs font-medium mb-2 text-gray-700">Rotation</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={rotateLeft} title="Rotate Left (Q)">
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={rotateRight} title="Rotate Right (E)">
                <RotateCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div>
            <div className="text-xs font-medium mb-2 text-gray-700">Zoom</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={zoomIn} title="Zoom In (+)">
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={zoomOut} title="Zoom Out (-)">
                <ZoomOut className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 pt-2 border-t">
            <div className="font-medium mb-1">Keyboard:</div>
            <div>WASD: Move • QE: Rotate</div>
            <div>+/- : Zoom • R: Reset</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 