"use client"

import { useState } from "react"
import { useConfigurator, type Component, type LightComponent, type SetupData } from "./configurator-context"
import { db } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Plus, Check, X, Target, Zap } from "lucide-react"

interface ComponentDimensions {
  width: number
  height: number
  depth: number
}

interface GuidedComponentPlacementProps {
  setupData: SetupData
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
    if (setupData.trackLayout?.type === "track") {
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
    // Default to upside down for ceiling mounts
    return [Math.PI, 0, 0]
  }

  // Calculate initial component position based on setup data and room boundaries
  const calculateInitialPosition = (componentType: string): [number, number, number] => {
    const room = state.roomDimensions || { width: 8, length: 6, height: 3 }
    
    // Default position near ceiling
    let position: [number, number, number] = [0, room.height - 0.1, 0]
    
    // Adjust position based on component type and setup data
    if (setupData?.mountingWall) {
      switch (setupData.mountingWall) {
        case "left":
          position = [-room.width / 2 + 0.1, room.height - 0.1, 0]
          break
        case "right":
          position = [room.width / 2 - 0.1, room.height - 0.1, 0]
          break
        case "back":
          position = [0, room.height - 0.1, -room.length / 2 + 0.1]
          break
        case "front":
          position = [0, room.height - 0.1, room.length / 2 - 0.1]
          break
      }
    }
    
    // Use socket position if available
    if (setupData?.socketPosition) {
      position = [
        setupData.socketPosition.x,
        setupData.socketPosition.y,
        setupData.socketPosition.z
      ]
    }
    
    return position
  }

  // Handle direct component placement (when no snap point is selected)
  const handleDirectComponentPlacement = (componentType: string, componentTemplate: LightComponent) => {
    // Calculate position near ceiling
    const position = calculateInitialPosition(componentType)

    // Calculate initial rotation based on component type and placement location
    let rotation: [number, number, number] = [0, 0, 0]
    if (componentType === "connector") {
      // For connectors, rotate 180° around X-axis to point downward
      rotation = [Math.PI, 0, 0]
    } else if (componentType === "track") {
      // For tracks, ensure horizontal alignment
      rotation = [0, 0, 0]
    }

    // Create new component with proper scale
    const newComponent: Component = {
      id: `${componentType}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position,
      rotation,
      scale: [
        componentTemplate.specifications?.scale || 1,
        componentTemplate.specifications?.scale || 1,
        componentTemplate.specifications?.scale || 1
      ] as [number, number, number],
      connections: [],
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {}
    }

    dispatch({ type: "ADD_COMPONENT", component: newComponent })
  }

  // Handle snap point placement (when a snap point is selected)
  const handleSnapPointPlacement = (component: any) => {
    if (!state.selectedSnapPoint) return
    
    // Find source component and snap point
    const sourceComponent = state.currentConfig.components.find(
      (c) => c.id === state.selectedSnapPoint!.componentId
    )
    const sourceSnapPoint = sourceComponent?.snapPoints?.find(
      (sp) => sp.id === state.selectedSnapPoint!.snapPointId
    )
    
    if (!sourceComponent || !sourceSnapPoint) return
    
    // Find compatible snap point on target component
    const targetSnapPoint = component.snapPoints?.find((sp: any) => 
      sp.type === sourceSnapPoint.type || 
      (sourceSnapPoint.compatibleTypes || []).includes(sp.type)
    )
    
    if (!targetSnapPoint) {
      console.warn("No compatible snap point found on target component")
      return
    }
    
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
      handleDirectComponentPlacement(componentType, componentTemplate as LightComponent)
    }
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
    const room = state.roomDimensions || { width: 8, length: 6, height: 3 }
    let x = 0, y = 0, z = 0

    // Use socket position from setup data if available
    if (setupData.socketPosition) {
      x = setupData.socketPosition.x
      y = setupData.socketPosition.y
      z = setupData.socketPosition.z
    } else {
      // Fallback to wall-based positioning
      switch (setupData.mountingWall) {
        case "left":
          x = -room.width / 2
          y = room.height - 0.1 // Place near ceiling
          z = 0
          break
        case "right":
          x = room.width / 2
          y = room.height - 0.1 // Place near ceiling
          z = 0
          break
        case "back":
          x = 0
          y = room.height - 0.1 // Place near ceiling
          z = -room.length / 2
          break
        case "front":
          x = 0
          y = room.height - 0.1 // Place near ceiling
          z = room.length / 2
          break
        default:
          x = 0
          y = room.height - 0.1 // Place near ceiling
          z = 0
      }
    }

    // Adjust position based on snap point offset
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
