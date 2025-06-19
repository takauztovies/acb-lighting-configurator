"use client"

import { useState } from "react"
import { useConfigurator } from "./configurator-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Plus, Check, X, Target, Zap } from "lucide-react"

interface ComponentDimensions {
  width: number
  height: number
  depth: number
}

interface LightComponent {
  id: string
  type: string
  name: string
  description: string
  price: number
  dimensions: ComponentDimensions
  snapPoints?: any[]
  // ... other properties
}

interface GuidedComponentPlacementProps {
  setupData: any
  onComplete: () => void
}

export function GuidedComponentPlacement({ setupData, onComplete }: GuidedComponentPlacementProps) {
  const { state, dispatch } = useConfigurator()
  const [placementStep, setPlacementStep] = useState(0)

  // Get available components based on hanging type
  const getAvailableComponents = () => {
    if (!setupData.hangingType) return []

    const hangingConfig = {
      track: ["power-supply", "track", "connector", "spotlight"],
      pendant: ["power-supply", "pendant-light", "connector"],
      linear: ["power-supply", "linear-light", "driver"],
    }

    return state.availableComponents.filter((component) =>
      hangingConfig[setupData.hangingType as keyof typeof hangingConfig]?.includes(component.type),
    )
  }

  // Get placement steps based on setup
  const getPlacementSteps = () => {
    if (setupData.trackLayout.type === "preset" && setupData.trackLayout.preset) {
      return [
        {
          title: "Place Power Supply",
          description: "Start with the power supply near your socket",
          componentType: "power-supply",
        },
        { title: "Add Track System", description: "Connect tracks to build your layout", componentType: "track" },
        { title: "Add Connectors", description: "Connect track segments if needed", componentType: "connector" },
        { title: "Add Spotlights", description: "Place spotlights on the track", componentType: "spotlight" },
      ]
    } else {
      return [
        { title: "Start with Power", description: "Place your power supply first", componentType: "power-supply" },
        { title: "Build Your System", description: "Add components as needed", componentType: null },
      ]
    }
  }

  const availableComponents = getAvailableComponents()
  const placementSteps = getPlacementSteps()
  const currentStep = placementSteps[placementStep]

  // Calculate component rotation based on mounting type and wall
  const calculateRotation = (componentType: string): [number, number, number] => {
    if (setupData.mountingType === "wall" && setupData.mountingWall) {
      switch (setupData.mountingWall) {
        case "back":
          return [0, 0, 0] // Facing forward
        case "front":
          return [0, Math.PI, 0] // Facing backward
        case "left":
          return [0, Math.PI / 2, 0] // Facing right
        case "right":
          return [0, -Math.PI / 2, 0] // Facing left
        default:
          return [0, 0, 0]
      }
    }
    return [0, 0, 0] // Default rotation for ceiling mounts
  }

  // Handle direct component placement (when no snap point is selected)
  const handleDirectComponentPlacement = (componentType: string) => {
    const position = calculateInitialPosition(componentType)
    const rotation = calculateRotation(componentType)
    const componentTemplate = availableComponents.find((c) => c.type === componentType)
    if (!componentTemplate) return

    // If this is the first component and it's a connector, snap to wall using 'Wall/Connector Connection'
    if (state.currentConfig.components.length === 0 && componentType === "connector") {
      const wallSnap = componentTemplate.snapPoints?.find(sp => sp.name === "Wall/Connector Connection")
      if (wallSnap) {
        // Calculate wall position from setupData
        const wallPos = calculateWallSnapPosition(setupData, wallSnap.position)
        const newComponent = {
          ...componentTemplate,
          id: `${componentType}-${Date.now()}`,
          position: wallPos,
          rotation,
          scale: [1, 1, 1] as [number, number, number],
          connections: [],
          snapPoints: componentTemplate.snapPoints || [],
          price: componentTemplate.price,
        }
        dispatch({ type: "ADD_COMPONENT", component: newComponent })
        return
      } else {
        console.warn("Connector does not have a 'Wall/Connector Connection' snap point.")
      }
    }
    // Fallback: regular placement
    const newComponent = {
      ...componentTemplate,
      id: `${componentType}-${Date.now()}`,
      position,
      rotation,
      scale: [1, 1, 1] as [number, number, number],
      connections: [],
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price,
    }
    dispatch({ type: "ADD_COMPONENT", component: newComponent })
  }

  // Handle snap point placement (when a snap point is selected)
  const handleSnapPointPlacement = (component: any) => {
    dispatch({ type: "PLACE_COMPONENT_AT_SNAP_POINT", component })
  }

  // Handle component selection
  const handleComponentSelect = (componentType: string) => {
    const componentTemplate = availableComponents.find((c) => c.type === componentType)
    if (!componentTemplate) return

    if (state.selectedSnapPoint) {
      // We have a snap point selected - place component there
      handleSnapPointPlacement(componentTemplate)
    } else {
      // No snap point selected - place at calculated position
      handleDirectComponentPlacement(componentType)
    }
  }

  // Calculate initial component position based on setup data and room boundaries
  const calculateInitialPosition = (componentType: string): [number, number, number] => {
    const roomDimensions = state.roomDimensions || { width: 8, length: 6, height: 3 }
    
    // Get component dimensions to adjust positioning
    const componentTemplate = availableComponents.find(c => c.type === componentType) as LightComponent | undefined
    const componentHeight = componentTemplate?.dimensions?.height || 0.1 // Default to 10cm if not specified
    const componentWidth = componentTemplate?.dimensions?.width || 0.1
    const componentDepth = componentTemplate?.dimensions?.depth || 0.1
    
    // For ceiling-mounted components, place them exactly at ceiling height accounting for component height
    const isCeilingMount = setupData.mountingType === "ceiling" || 
                          (setupData.hangingType === "track" && componentType === "track") ||
                          (setupData.hangingType === "linear" && componentType === "linear-light")
    
    // For wall-mounted components
    const isWallMount = setupData.mountingType === "wall"
    
    // Calculate effective room dimensions accounting for component size
    const effectiveWidth = roomDimensions.width - componentWidth
    const effectiveLength = roomDimensions.length - componentDepth
    const margin = 0.05 // 5cm margin from walls

    // Set height based on mounting type
    let mountHeight = 0
    if (isCeilingMount) {
      // Place component exactly at ceiling, accounting for component height
      mountHeight = roomDimensions.height - (componentHeight / 2)
    } else if (isWallMount) {
      // Place at specified wall height, accounting for component height
      mountHeight = setupData.mountingHeight || roomDimensions.height / 2
    } else {
      // For pendant lights or other hanging components
      mountHeight = setupData.hangingHeight || roomDimensions.height * 0.7
    }

    // Calculate base position
    let baseX = 0
    let baseZ = 0

    if (isWallMount && setupData.mountingWall) {
      // For wall mounting, position exactly against the wall accounting for component depth
      switch (setupData.mountingWall) {
        case "left":
          baseX = -effectiveWidth / 2 + (componentDepth / 2)
          baseZ = Math.random() * (effectiveLength - 2 * margin) - (effectiveLength / 2 - margin)
          break
        case "right":
          baseX = effectiveWidth / 2 - (componentDepth / 2)
          baseZ = Math.random() * (effectiveLength - 2 * margin) - (effectiveLength / 2 - margin)
          break
        case "back":
          baseX = Math.random() * (effectiveWidth - 2 * margin) - (effectiveWidth / 2 - margin)
          baseZ = -effectiveLength / 2 + (componentDepth / 2)
          break
        case "front":
          baseX = Math.random() * (effectiveWidth - 2 * margin) - (effectiveWidth / 2 - margin)
          baseZ = effectiveLength / 2 - (componentDepth / 2)
          break
      }
    } else {
      // For ceiling mounts or pendant lights, ensure they stay within bounds
      baseX = Math.random() * (effectiveWidth - 2 * margin) - (effectiveWidth / 2 - margin)
      baseZ = Math.random() * (effectiveLength - 2 * margin) - (effectiveLength / 2 - margin)
    }

    // Ensure final positions are within room bounds
    baseX = Math.max(-effectiveWidth / 2 + margin, Math.min(effectiveWidth / 2 - margin, baseX))
    baseZ = Math.max(-effectiveLength / 2 + margin, Math.min(effectiveLength / 2 - margin, baseZ))

    return [baseX, mountHeight, baseZ]
  }

  // Get compatible components for the selected snap point
  const getCompatibleComponents = () => {
    if (!state.selectedSnapPoint) return availableComponents

    // Find the selected snap point
    const sourceComponent = state.currentConfig.components.find((c) => c.id === state.selectedSnapPoint!.componentId)
    const snapPoint = sourceComponent?.snapPoints?.find((sp) => sp.id === state.selectedSnapPoint!.snapPointId)

    if (!snapPoint || !snapPoint.compatibleTypes) return availableComponents

    // Filter components by compatibility
    return availableComponents.filter((component) => snapPoint.compatibleTypes?.includes(component.type))
  }

  const compatibleComponents = getCompatibleComponents()

  // Helper to calculate wall snap position
  function calculateWallSnapPosition(setupData: any, snapOffset: [number, number, number]): [number, number, number] {
    // Use setupData.mountingWall and room dimensions to determine wall position
    // For now, assume room is centered at (0,0,0)
    const room = state.roomDimensions || { width: 8, length: 6, height: 3 }
    let x = 0, y = 0, z = 0
    switch (setupData.mountingWall) {
      case "left":
        x = -room.width / 2
        y = setupData.mountingHeight || room.height / 2
        z = 0
        break
      case "right":
        x = room.width / 2
        y = setupData.mountingHeight || room.height / 2
        z = 0
        break
      case "back":
        x = 0
        y = setupData.mountingHeight || room.height / 2
        z = -room.length / 2
        break
      case "front":
        x = 0
        y = setupData.mountingHeight || room.height / 2
        z = room.length / 2
        break
      default:
        x = 0
        y = setupData.mountingHeight || room.height / 2
        z = 0
    }
    // Subtract the snap point offset so the snap aligns with the wall
    return [x - snapOffset[0], y - snapOffset[1], z - snapOffset[2]]
  }

  return (
    <div className="space-y-6">
      {/* Current Step Indicator */}
      {currentStep && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Lightbulb className="h-5 w-5" />
              Step {placementStep + 1}: {currentStep.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-3">{currentStep.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Snap Point Connection Mode */}
      {state.selectedSnapPoint && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Target className="h-5 w-5" />
              Connection Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-800 mb-3">
              Snap point selected! Choose a compatible component below to connect it.
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {compatibleComponents.length} compatible component(s)
              </Badge>
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: "CLEAR_SELECTED_SNAP_POINT" })}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {state.selectedSnapPoint ? "Compatible Components" : "Available Components"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {compatibleComponents.map((component) => {
              const isCompatible = !state.selectedSnapPoint || compatibleComponents.includes(component)

              return (
                <Card
                  key={component.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isCompatible
                      ? state.selectedSnapPoint
                        ? "hover:bg-green-50 border-green-200"
                        : "hover:bg-blue-50"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => isCompatible && handleComponentSelect(component.type)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={component.image || "/placeholder.svg"}
                        alt={component.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{component.name}</h4>
                          {state.selectedSnapPoint ? (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Connect
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-blue-100 text-blue-800">Add</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">€{component.price}</p>
                        <p className="text-xs text-gray-500">
                          {state.selectedSnapPoint
                            ? "Click to connect to selected snap point"
                            : "Click to place in scene"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.selectedSnapPoint && compatibleComponents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No compatible components available for this snap point.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Components placed: {state.currentConfig.components.length}
              </div>
              <div className="text-xs text-gray-600">Total cost: €{state.currentConfig.totalPrice.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              {state.currentConfig.components.length > 0 && (
                <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">How to connect components:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>1. Click on a component in the 3D view to select it</div>
            <div>2. Click on a snap point (colored dot) to select it for connection</div>
            <div>3. Click a compatible component from the list above</div>
            <div>4. The component will be automatically placed and connected</div>
            <div>5. Repeat to build your complete lighting system</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
