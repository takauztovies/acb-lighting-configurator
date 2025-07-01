"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
  ChevronDown,
  Target,
  Circle
} from "lucide-react"
import { useConfigurator } from "./configurator-context"

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
  const { state, dispatch } = useConfigurator()
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0])
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1])

  // Get the selected component
  const selectedComponent = selectedComponentId 
    ? state.currentConfig.components.find(c => c.id === selectedComponentId)
    : null

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

  // Flip functions (180-degree rotations) - ENHANCED for snap connections
  const flipComponent = async (axis: 'x' | 'y' | 'z') => {
    console.log(`🔄 FLIP COMPONENT - Enhanced for snap connections:`, {
      componentId: selectedComponentId,
      axis,
      currentRotation: rotation,
      currentPosition: position
    })
    
    // Check if component has snap connections that need to be maintained
    if (selectedComponentId && currentTransform) {
      // Import snap logic for recalculation
      const { snapLogic } = await import("@/lib/snap-logic")
      
      // Calculate new rotation after flip
      const newRotation: [number, number, number] = [...rotation]
      const radians = (180 * Math.PI) / 180
      
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
      
      console.log(`🔄 FLIP - New rotation calculated:`, {
        oldRotation: rotation,
        newRotation,
        axis,
        degrees: newRotation.map(r => (r * 180 / Math.PI).toFixed(1))
      })
      
      // For Easy Link End Cap White and other ceiling connectors, 
      // we need to adjust position to maintain ceiling connection
      const isEasyLinkEndCap = currentTransform.position && currentTransform.position[1] > 2.0 // Assume ceiling mounted if Y > 2
      
      if (isEasyLinkEndCap) {
        console.log(`🔧 FLIP - Easy Link End Cap detected, maintaining ceiling position`)
        
        // Keep the component at ceiling level after flip
        const maintainedPosition: [number, number, number] = [
          position[0], // Keep X position
          currentTransform.position?.[1] || position[1], // Maintain exact ceiling Y position
          position[2]  // Keep Z position
        ]
        
        console.log(`🔧 FLIP - Position maintained for ceiling mount:`, {
          originalPosition: position,
          maintainedPosition
        })
        
        // Apply both rotation and position changes together
        setRotation(newRotation)
        setPosition(maintainedPosition)
        onTransform(selectedComponentId, { 
          rotation: newRotation,
          position: maintainedPosition
        })
        
        console.log(`✅ FLIP - Easy Link End Cap flipped with ceiling position maintained`)
        return
      }
    }
    
    // For regular components without special positioning needs
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

  const handleSnapPointSelect = (snapPointId: string) => {
    console.log(`🎯 SNAP POINT SELECTED FROM SIDEBAR:`, {
      componentId: selectedComponentId,
      snapPointId,
      componentName: selectedComponent?.name,
      snapPointName: selectedComponent?.snapPoints?.find(sp => sp.id === snapPointId)?.name
    })
    
    dispatch({ 
      type: "SET_SELECTED_SNAP_POINT", 
      componentId: selectedComponentId, 
      snapPointId 
    })
  }

  return (
    <div className="space-y-4">
      {/* Component Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Selected Component</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="font-medium">{selectedComponent?.name || 'Unknown'}</p>
            <p className="text-gray-500">{selectedComponent?.type || 'Unknown'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Snap Points Selector */}
      {selectedComponent?.snapPoints && selectedComponent.snapPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Snap Points
              <Badge variant="outline" className="text-xs">
                {selectedComponent.snapPoints.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-600 mb-3">
              Click a snap point to select it for connecting other components
            </p>
            
            {selectedComponent.snapPoints.map((snapPoint) => {
              const isSelected = state.selectedSnapPoint?.componentId === selectedComponentId && 
                               state.selectedSnapPoint?.snapPointId === snapPoint.id
              const isConnected = selectedComponent.connections?.includes(snapPoint.id)
              
              return (
                <Button
                  key={snapPoint.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start text-left h-auto p-3 ${
                    isSelected ? 'bg-blue-600 text-white' : ''
                  } ${isConnected ? 'opacity-50' : ''}`}
                  onClick={() => handleSnapPointSelect(snapPoint.id)}
                  disabled={isConnected}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Circle 
                      className={`h-3 w-3 ${
                        isSelected ? 'fill-white' : 
                        snapPoint.type === 'power' ? 'fill-red-500' :
                        snapPoint.type === 'mechanical' ? 'fill-blue-500' :
                        snapPoint.type === 'track' ? 'fill-green-500' :
                        'fill-gray-500'
                      }`} 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-xs">{snapPoint.name}</div>
                      <div className="text-xs opacity-75 capitalize">{snapPoint.type}</div>
                    </div>
                    {isConnected && (
                      <Badge variant="secondary" className="text-xs">Connected</Badge>
                    )}
                  </div>
                </Button>
              )
            })}
            
            {state.selectedSnapPoint?.componentId === selectedComponentId && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium">
                  Snap point selected! Now click a component from the sidebar to connect it.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-xs"
                  onClick={() => dispatch({ type: "CLEAR_SELECTED_SNAP_POINT" })}
                >
                  Cancel Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Transform Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newRotation: [number, number, number] = [
                  rotation[0],
                  (rotation[1] + Math.PI / 2) % (Math.PI * 2),
                  rotation[2]
                ]
                setRotation(newRotation)
                onTransform(selectedComponentId, { rotation: newRotation })
              }}
              className="flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Rotate Y
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Enhanced flip function for Easy Link End Cap White ceiling positioning
                if (selectedComponent?.name?.toLowerCase().includes('easy link end cap white')) {
                  console.log(`🔧 FLIP - Easy Link End Cap detected, maintaining ceiling position`)
                  
                  // Get current position and check if it's ceiling-mounted (Y > 2.0)
                  const currentPos = position
                  const isCeilingMounted = currentPos[1] > 2.0
                  
                  if (isCeilingMounted) {
                    // For ceiling-mounted Easy Link End Cap, maintain exact ceiling position during flip
                    const newRotation: [number, number, number] = [
                      (rotation[0] + Math.PI) % (Math.PI * 2),
                      rotation[1],
                      rotation[2]
                    ]
                    
                    console.log(`✅ FLIP - Easy Link End Cap flipped with ceiling position maintained`)
                    setRotation(newRotation)
                    onTransform(selectedComponentId, { 
                      rotation: newRotation
                      // Don't change position - keep it exactly where it is for ceiling mounting
                    })
                  } else {
                    // Standard flip for non-ceiling mounted
                    const newRotation: [number, number, number] = [
                      (rotation[0] + Math.PI) % (Math.PI * 2),
                      rotation[1],
                      rotation[2]
                    ]
                    setRotation(newRotation)
                    onTransform(selectedComponentId, { rotation: newRotation })
                  }
                } else {
                  // Standard flip for other components
                  const newRotation: [number, number, number] = [
                    (rotation[0] + Math.PI) % (Math.PI * 2),
                    rotation[1],
                    rotation[2]
                  ]
                  setRotation(newRotation)
                  onTransform(selectedComponentId, { rotation: newRotation })
                }
              }}
              className="flex items-center gap-1"
            >
              <FlipHorizontal className="w-3 h-3" />
              Flip
            </Button>
          </div>
          
          {/* Track-specific controls */}
          {selectedComponent?.type === "track" && (
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
          )}
        </CardContent>
      </Card>

      {/* Manual Position Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="pos-x" className="text-xs">X</Label>
              <Input
                id="pos-x"
                type="number"
                step="0.1"
                value={position[0].toFixed(2)}
                onChange={(e) => {
                  const newPos: [number, number, number] = [
                    parseFloat(e.target.value) || 0,
                    position[1],
                    position[2]
                  ]
                  setPosition(newPos)
                  onTransform(selectedComponentId, { position: newPos })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="pos-y" className="text-xs">Y</Label>
              <Input
                id="pos-y"
                type="number"
                step="0.1"
                value={position[1].toFixed(2)}
                onChange={(e) => {
                  const newPos: [number, number, number] = [
                    position[0],
                    parseFloat(e.target.value) || 0,
                    position[2]
                  ]
                  setPosition(newPos)
                  onTransform(selectedComponentId, { position: newPos })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="pos-z" className="text-xs">Z</Label>
              <Input
                id="pos-z"
                type="number"
                step="0.1"
                value={position[2].toFixed(2)}
                onChange={(e) => {
                  const newPos: [number, number, number] = [
                    position[0],
                    position[1],
                    parseFloat(e.target.value) || 0
                  ]
                  setPosition(newPos)
                  onTransform(selectedComponentId, { position: newPos })
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Rotation Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Rotation (degrees)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="rot-x" className="text-xs">X</Label>
              <Input
                id="rot-x"
                type="number"
                step="5"
                value={Math.round((rotation[0] * 180) / Math.PI)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value) || 0
                  const newRot: [number, number, number] = [
                    (degrees * Math.PI) / 180,
                    rotation[1],
                    rotation[2]
                  ]
                  setRotation(newRot)
                  onTransform(selectedComponentId, { rotation: newRot })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="rot-y" className="text-xs">Y</Label>
              <Input
                id="rot-y"
                type="number"
                step="5"
                value={Math.round((rotation[1] * 180) / Math.PI)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value) || 0
                  const newRot: [number, number, number] = [
                    rotation[0],
                    (degrees * Math.PI) / 180,
                    rotation[2]
                  ]
                  setRotation(newRot)
                  onTransform(selectedComponentId, { rotation: newRot })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="rot-z" className="text-xs">Z</Label>
              <Input
                id="rot-z"
                type="number"
                step="5"
                value={Math.round((rotation[2] * 180) / Math.PI)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value) || 0
                  const newRot: [number, number, number] = [
                    rotation[0],
                    rotation[1],
                    (degrees * Math.PI) / 180
                  ]
                  setRotation(newRot)
                  onTransform(selectedComponentId, { rotation: newRot })
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scale Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="scale-x" className="text-xs">X</Label>
              <Input
                id="scale-x"
                type="number"
                step="0.1"
                value={scale[0].toFixed(2)}
                onChange={(e) => {
                  const newScale: [number, number, number] = [
                    parseFloat(e.target.value) || 1,
                    scale[1],
                    scale[2]
                  ]
                  setScale(newScale)
                  onTransform(selectedComponentId, { scale: newScale })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="scale-y" className="text-xs">Y</Label>
              <Input
                id="scale-y"
                type="number"
                step="0.1"
                value={scale[1].toFixed(2)}
                onChange={(e) => {
                  const newScale: [number, number, number] = [
                    scale[0],
                    parseFloat(e.target.value) || 1,
                    scale[2]
                  ]
                  setScale(newScale)
                  onTransform(selectedComponentId, { scale: newScale })
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="scale-z" className="text-xs">Z</Label>
              <Input
                id="scale-z"
                type="number"
                step="0.1"
                value={scale[2].toFixed(2)}
                onChange={(e) => {
                  const newScale: [number, number, number] = [
                    scale[0],
                    scale[1],
                    parseFloat(e.target.value) || 1
                  ]
                  setScale(newScale)
                  onTransform(selectedComponentId, { scale: newScale })
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={resetTransform}
        className="w-full flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Reset Transform
      </Button>
    </div>
  )
}
