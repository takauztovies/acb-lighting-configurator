"use client"

import { useState } from "react"
import { useConfigurator, type Component, type LightComponent, type SetupData } from "./configurator-context"
import { db } from "@/lib/database"
import { boundarySystem } from "@/lib/boundary-system"
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
    
    // Calculate appropriate height based on component type
    let height = 0;
    switch (componentType) {
      case "power-supply":
        // Power supplies typically mount at mid-height on walls or ceiling
        height = (setupData?.socketPosition as any)?.wall === "ceiling" ? room.height - 0.1 : 1.5;
        break;
      case "track":
        // Tracks typically hang 0.3-0.5m below ceiling
        height = room.height - 0.4;
        break;
      case "spotlight":
        // Spotlights attach to tracks or mount at track level
        height = room.height - 0.4;
        break;
      case "connector":
        // Connectors should be positioned at socket level when connected to socket
        height = (setupData?.socketPosition as any)?.y || room.height - 0.4;
        break;
      default:
        // Default to reasonable hanging height
        height = room.height - 0.5;
    }
    
    let position: [number, number, number] = [0, height, 0]
    
    // Adjust position based on component type and setup data
    if (setupData?.mountingWall) {
      switch (setupData.mountingWall) {
        case "left":
          position = [-room.width / 2 + 0.1, height, 0]
          break
        case "right":
          position = [room.width / 2 - 0.1, height, 0]
          break
        case "back":
          position = [0, height, -room.length / 2 + 0.1]
          break
        case "front":
          position = [0, height, room.length / 2 - 0.1]
          break
      }
    }
    
    // Use socket position if available, but adjust height appropriately
    if (setupData?.socketPosition) {
      if ((setupData.socketPosition as any).wall === "ceiling") {
        // For ceiling sockets, place components hanging below
        position = [
          setupData.socketPosition.x,
          height, // Use calculated height, not socket height
          setupData.socketPosition.z
        ]
      } else {
        // For wall sockets, use socket position but adjust for component type
        position = [
          setupData.socketPosition.x,
          componentType === "connector" || componentType === "power-supply" 
            ? setupData.socketPosition.y 
            : height,
          setupData.socketPosition.z
        ]
      }
    }
    
    return position
  }

  // Handle direct component placement (when no snap point is selected)
  const handleDirectComponentPlacement = (componentType: string, componentTemplate: LightComponent) => {
    // Calculate position near ceiling
    const initialPosition = calculateInitialPosition(componentType)

    // Calculate initial rotation based on component type and placement location
    let initialRotation: [number, number, number] = [0, 0, 0]
    if (componentType === "connector") {
      // For connectors, rotate 180° around X-axis to point downward
      initialRotation = [Math.PI, 0, 0]
    } else if (componentType === "track") {
      // For tracks, ensure horizontal alignment
      initialRotation = [0, 0, 0]
    }

    // Apply boundary constraints and smart positioning
    const roomDims = state.roomDimensions || { width: 8, length: 6, height: 3 }
    const scale: [number, number, number] = [
      componentTemplate.specifications?.scale || 1,
      componentTemplate.specifications?.scale || 1,
      componentTemplate.specifications?.scale || 1
    ]
    
    const constraintResult = boundarySystem.validateAndCorrectPosition(
      componentType,
      initialPosition,
      initialRotation,
      scale,
      roomDims
    )

    // Show user feedback if positioning was corrected
    if (constraintResult.corrected && constraintResult.reason) {
      console.log(`✅ Smart positioning: ${constraintResult.reason}`)
      // You could show a toast notification here
    }

    // Apply default scale for specific components
    let finalScale = scale
    if (componentTemplate.name?.toLowerCase().includes('easy link end cap white') || 
        componentTemplate.name?.toLowerCase().includes('connector')) {
      finalScale = [0.5, 0.5, 0.5] // 50% scale for end caps
    }

    // Create new component with constrained position and rotation
    const newComponent: Component = {
      id: `${componentType}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position: constraintResult.position,
      rotation: constraintResult.rotation,
      scale: finalScale,
      connections: [],
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {},
      initialPosition: constraintResult.position, // Store initial position for reset
      initialRotation: constraintResult.rotation,
      initialScale: finalScale
    }

    dispatch({ type: "ADD_COMPONENT", component: newComponent })
  }

  // Handle snap point placement (when a snap point is selected)
  const handleSnapPointPlacement = async (componentTemplate: LightComponent) => {
    if (!state.selectedSnapPoint) return
    
    // Find source component and snap point
    const sourceComponent = state.currentConfig.components.find(
      (c) => c.id === state.selectedSnapPoint!.componentId
    )
    const sourceSnapPoint = sourceComponent?.snapPoints?.find(
      (sp) => sp.id === state.selectedSnapPoint!.snapPointId
    )
    
    if (!sourceComponent || !sourceSnapPoint) {
      console.warn("Source component or snap point not found")
      return
    }
    
    // Find compatible snap point on target component
    const targetSnapPoint = componentTemplate.snapPoints?.find((sp: any) => {
      // Check direct type compatibility
      if (sp.type === sourceSnapPoint.type) return true
      // Check compatible types
      if (sourceSnapPoint.compatibleTypes?.includes(sp.type)) return true
      if (sp.compatibleTypes?.includes(sourceSnapPoint.type)) return true
      return false
    })
    
    if (!targetSnapPoint) {
      console.warn("No compatible snap point found on target component")
      // Still allow placement but at calculated position
      handleDirectComponentPlacement(componentTemplate.type, componentTemplate)
      return
    }
    
    // Calculate connection position using snap logic
    const { snapLogic } = await import("@/lib/snap-logic")
    
    const connectionData = snapLogic.calculateConnectionPosition(
      sourceComponent,
      sourceSnapPoint,
      { 
        position: [0, 0, 0], 
        rotation: [0, 0, 0], 
        scale: [1, 1, 1],
        snapPoints: componentTemplate.snapPoints || []
      } as any,
      targetSnapPoint
    )
    
    // Apply default scale for specific components
    const defaultScale = componentTemplate.specifications?.scale || 1
    let componentScale: [number, number, number] = [defaultScale, defaultScale, defaultScale]
    
    if (componentTemplate.name?.toLowerCase().includes('easy link end cap white') || 
        componentTemplate.name?.toLowerCase().includes('connector')) {
      componentScale = [0.5, 0.5, 0.5] // 50% scale for end caps
    }

    // Create new component with calculated position and rotation
    const newComponent: Component = {
      id: `${componentTemplate.type}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position: connectionData.position,
      rotation: connectionData.rotation,
      scale: componentScale,
      connections: [sourceComponent.id], // Track connection
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {},
      initialPosition: connectionData.position, // Store initial position for reset
      initialRotation: connectionData.rotation,
      initialScale: componentScale
    }

    // Add connection to source component as well
    const updatedSourceComponent = {
      ...sourceComponent,
      connections: [...(sourceComponent.connections || []), newComponent.id]
    }

    dispatch({ type: "ADD_COMPONENT", component: newComponent })
    dispatch({ type: "UPDATE_COMPONENT", componentId: sourceComponent.id, updates: { connections: updatedSourceComponent.connections } })
    dispatch({ type: "CLEAR_SELECTED_SNAP_POINT" })
    
    console.log("✅ Component connected via snap points:", {
      source: sourceComponent.name,
      target: newComponent.name,
      sourceSnapPoint: sourceSnapPoint.name,
      targetSnapPoint: targetSnapPoint.name,
      position: connectionData.position,
      rotation: connectionData.rotation
    })
  }

  // Handle component selection
  const handleComponentSelect = (componentType: string) => {
    const componentTemplate = availableComponents.find((c) => c.type === componentType)
    if (!componentTemplate) return

    if (state.selectedSnapPoint) {
      // We have a snap point selected - place component there
      handleSnapPointPlacement(componentTemplate as LightComponent)
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
                        <div className="mb-1">
                          <h4 className="font-medium text-sm leading-tight">{component.name}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">€{component.price}</p>
                        <p className="text-xs text-gray-500 leading-tight">
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
