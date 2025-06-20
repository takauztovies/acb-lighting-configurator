"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, RefreshCw, Move3D } from "lucide-react"

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
  }
}

export function TransformControls({ 
  selectedComponentId, 
  onTransform, 
  currentTransform 
}: TransformControlsProps) {
  const [rotationX, setRotationX] = useState(currentTransform?.rotation?.[0] ?? 0)
  const [rotationY, setRotationY] = useState(currentTransform?.rotation?.[1] ?? 0)
  const [rotationZ, setRotationZ] = useState(currentTransform?.rotation?.[2] ?? 0)
  const [scale, setScale] = useState(1)

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

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation: [number, number, number] = [rotationX, rotationY, rotationZ]
    const radians = (value * Math.PI) / 180 // Convert degrees to radians
    
    switch (axis) {
      case 'x':
        newRotation[0] = radians
        setRotationX(value)
        break
      case 'y':
        newRotation[1] = radians
        setRotationY(value)
        break
      case 'z':
        newRotation[2] = radians
        setRotationZ(value)
        break
    }
    
    onTransform(selectedComponentId, { rotation: newRotation })
  }

  const handleQuickRotation = (axis: 'x' | 'y' | 'z', degrees: number) => {
    const currentDegrees = {
      x: (rotationX * 180) / Math.PI,
      y: (rotationY * 180) / Math.PI,
      z: (rotationZ * 180) / Math.PI,
    }
    
    const newDegrees = currentDegrees[axis] + degrees
    handleRotationChange(axis, newDegrees)
  }

  const handleFlip = (axis: 'x' | 'y' | 'z') => {
    const currentDegrees = {
      x: (rotationX * 180) / Math.PI,
      y: (rotationY * 180) / Math.PI,
      z: (rotationZ * 180) / Math.PI,
    }
    
    const newDegrees = currentDegrees[axis] + 180
    handleRotationChange(axis, newDegrees)
  }

  const handleReset = () => {
    setRotationX(0)
    setRotationY(0)
    setRotationZ(0)
    setScale(1)
    onTransform(selectedComponentId, { 
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    })
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
        {/* Quick Rotation Buttons */}
        <div>
          <h4 className="text-sm font-medium mb-3">Quick Rotations</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickRotation('y', 90)}
              className="flex items-center gap-1"
            >
              <RotateCw className="w-4 h-4" />
              Rotate 90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickRotation('y', -90)}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Rotate -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlip('y')}
              className="flex items-center gap-1"
            >
              <FlipHorizontal className="w-4 h-4" />
              Flip H
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlip('x')}
              className="flex items-center gap-1"
            >
              <FlipVertical className="w-4 h-4" />
              Flip V
            </Button>
          </div>
        </div>

        {/* Precise Rotation Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Precise Rotation</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-600">X-Axis: {Math.round((rotationX * 180) / Math.PI)}°</label>
              <Slider
                value={[(rotationX * 180) / Math.PI]}
                onValueChange={([value]) => handleRotationChange('x', value)}
                max={360}
                min={-360}
                step={5}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Y-Axis: {Math.round((rotationY * 180) / Math.PI)}°</label>
              <Slider
                value={[(rotationY * 180) / Math.PI]}
                onValueChange={([value]) => handleRotationChange('y', value)}
                max={360}
                min={-360}
                step={5}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Z-Axis: {Math.round((rotationZ * 180) / Math.PI)}°</label>
              <Slider
                value={[(rotationZ * 180) / Math.PI]}
                onValueChange={([value]) => handleRotationChange('z', value)}
                max={360}
                min={-360}
                step={5}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Scale Control */}
        <div>
          <h4 className="text-sm font-medium mb-3">Scale</h4>
          <div>
            <label className="text-xs text-gray-600">Size: {scale.toFixed(2)}x</label>
            <Slider
              value={[scale]}
              onValueChange={([value]) => {
                setScale(value)
                onTransform(selectedComponentId, { scale: [value, value, value] })
              }}
              max={3}
              min={0.1}
              step={0.1}
              className="mt-1"
            />
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Transform
        </Button>
      </CardContent>
    </Card>
  )
}
