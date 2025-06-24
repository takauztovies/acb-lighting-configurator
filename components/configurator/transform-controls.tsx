"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Move3D, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from "lucide-react"

interface TransformControlsProps {
  selectedComponentId: string | null
  onTransform: (componentId: string, transform: {
    rotation?: [number, number, number]
    scale?: [number, number, number]
    position?: [number, number, number]
  }) => void
  currentTransform?: {
    rotation?: [number, number, number]
    scale?: [number, number, number]
    position?: [number, number, number]
    initialPosition?: [number, number, number]
    initialRotation?: [number, number, number]
    initialScale?: [number, number, number]
  }
}

export function TransformControls({ 
  selectedComponentId, 
  onTransform, 
  currentTransform 
}: TransformControlsProps) {
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0])
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1])

  // Update local state when currentTransform changes
  useEffect(() => {
    if (currentTransform) {
      setPosition(currentTransform.position || [0, 0, 0])
      setRotation(currentTransform.rotation || [0, 0, 0])
      setScale(currentTransform.scale || [1, 1, 1])
    }
  }, [currentTransform])

  if (!selectedComponentId) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move3D className="w-5 h-5" />
            Transform Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a component to transform</p>
        </CardContent>
      </Card>
    )
  }

  // Movement functions
  const moveComponent = (direction: 'left' | 'right' | 'forward' | 'backward' | 'up' | 'down', amount = 0.1) => {
    const newPosition: [number, number, number] = [...position]
    
    switch (direction) {
      case 'left':
        newPosition[0] -= amount
        break
      case 'right':
        newPosition[0] += amount
        break
      case 'forward':
        newPosition[2] -= amount
        break
      case 'backward':
        newPosition[2] += amount
        break
      case 'up':
        newPosition[1] += amount
        break
      case 'down':
        newPosition[1] -= amount
        break
    }
    
    setPosition(newPosition)
    onTransform(selectedComponentId, { position: newPosition })
  }

  // Rotation functions
  const rotateComponent = (axis: 'x' | 'y' | 'z', degrees: number) => {
    const newRotation: [number, number, number] = [...rotation]
    const radians = (degrees * Math.PI) / 180
    
    console.log(`🔄 TRANSFORM CONTROLS - ROTATION CHANGE:`, {
      componentId: selectedComponentId,
      axis,
      degrees,
      radians,
      oldRotation: rotation,
      newRotation: newRotation
    })
    
    switch (axis) {
      case 'x':
        newRotation[0] += radians
        break
      case 'y':
        newRotation[1] += radians
        break
      case 'z':
        newRotation[2] += radians
        break
    }
    
    console.log(`🔄 FINAL ROTATION AFTER CHANGE:`, newRotation)
    
    setRotation(newRotation)
    onTransform(selectedComponentId, { rotation: newRotation })
    
    console.log(`✅ Transform dispatched for component: ${selectedComponentId}`)
  }

  // Flip functions (180-degree rotations)
  const flipComponent = (axis: 'x' | 'y' | 'z') => {
    rotateComponent(axis, 180)
  }

  // Reset function - reset to initial position
  const resetTransform = () => {
    // Use initial values from currentTransform if available, otherwise defaults
    const resetPos: [number, number, number] = currentTransform?.initialPosition || currentTransform?.position || [0, 1, 0]
    const resetRot: [number, number, number] = currentTransform?.initialRotation || [0, 0, 0]
    const resetScale: [number, number, number] = currentTransform?.initialScale || [1, 1, 1]
    
    setPosition(resetPos)
    setRotation(resetRot)
    setScale(resetScale)
    
    onTransform(selectedComponentId, { 
      position: resetPos,
      rotation: resetRot,
      scale: resetScale
    })
  }

  // Handle direct input changes
  const handlePositionChange = (axis: number, value: number) => {
    const newPosition: [number, number, number] = [...position]
    newPosition[axis] = value
    setPosition(newPosition)
    onTransform(selectedComponentId, { position: newPosition })
  }

  const handleRotationChange = (axis: number, degrees: number) => {
    const newRotation: [number, number, number] = [...rotation]
    newRotation[axis] = (degrees * Math.PI) / 180
    setRotation(newRotation)
    onTransform(selectedComponentId, { rotation: newRotation })
  }

  const handleScaleChange = (value: number) => {
    const newScale: [number, number, number] = [value, value, value]
    setScale(newScale)
    onTransform(selectedComponentId, { scale: newScale })
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move3D className="w-5 h-5" />
          Transform Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Movement Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Movement</h4>
          
          {/* Directional buttons */}
          <div className="grid grid-cols-3 gap-1 mb-3">
            <div></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveComponent('forward')}
              className="h-8"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <div></div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveComponent('left')}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveComponent('up')}
                className="h-6 text-xs"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveComponent('down')}
                className="h-6 text-xs"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveComponent('right')}
              className="h-8"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <div></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveComponent('backward')}
              className="h-8"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <div></div>
          </div>

          {/* Position inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                step="0.1"
                value={position[0].toFixed(1)}
                onChange={(e) => handlePositionChange(0, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                step="0.1"
                value={position[1].toFixed(1)}
                onChange={(e) => handlePositionChange(1, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Z</Label>
              <Input
                type="number"
                step="0.1"
                value={position[2].toFixed(1)}
                onChange={(e) => handlePositionChange(2, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rotation Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Rotation</h4>
          
          {/* Quick rotation buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateComponent('y', 90)}
              className="flex items-center gap-1"
            >
              <RotateCw className="w-4 h-4" />
              90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateComponent('y', -90)}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateComponent('y', 45)}
              className="text-xs"
            >
              45°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateComponent('y', -45)}
              className="text-xs"
            >
              -45°
            </Button>
          </div>

          {/* Flip buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => flipComponent('y')}
              className="flex items-center gap-1"
            >
              <FlipHorizontal className="w-4 h-4" />
              Flip H
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => flipComponent('x')}
              className="flex items-center gap-1"
            >
              <FlipVertical className="w-4 h-4" />
              Flip V
            </Button>
          </div>

          {/* Track orientation toggle */}
          <div className="grid grid-cols-1 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Toggle between horizontal (0°) and vertical (90°) for tracks
                const currentY = (rotation[1] * 180) / Math.PI
                const isHorizontal = Math.abs(currentY % 180) < 45
                const newRotation: [number, number, number] = [
                  rotation[0],
                  isHorizontal ? Math.PI / 2 : 0, // 90° or 0°
                  rotation[2]
                ]
                setRotation(newRotation)
                onTransform(selectedComponentId, { rotation: newRotation })
              }}
              className="flex items-center gap-1"
            >
              <RotateCw className="w-4 h-4" />
              {Math.abs(((rotation[1] * 180) / Math.PI) % 180) < 45 ? 'Make Vertical' : 'Make Horizontal'}
            </Button>
          </div>

          {/* Rotation inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">X-Axis</Label>
              <Input
                type="number"
                step="15"
                value={Math.round((rotation[0] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(0, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Y-Axis</Label>
              <Input
                type="number"
                step="15"
                value={Math.round((rotation[1] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(1, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Z-Axis</Label>
              <Input
                type="number"
                step="15"
                value={Math.round((rotation[2] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(2, parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Scale Control */}
        <div>
          <h4 className="text-sm font-medium mb-3">Scale</h4>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScaleChange(0.5)}
                className="flex-1"
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScaleChange(1)}
                className="flex-1"
              >
                100%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScaleChange(1.5)}
                className="flex-1"
              >
                150%
              </Button>
            </div>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="3"
              value={scale[0].toFixed(1)}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value) || 1)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetTransform}
          className="w-full flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Transform
        </Button>
      </CardContent>
    </Card>
  )
}
