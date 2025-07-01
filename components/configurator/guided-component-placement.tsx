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

  // Calculate component height based on type and room dimensions
  const calculateComponentHeight = (componentType: string): number => {
    const room = state.roomDimensions || { width: 8, length: 6, height: 3 }
    const maxSafeHeight = Math.min(room.height - 1.0, 2)
    
    // SIMPLIFIED: All components at the same safe height initially
    const defaultHeight = 2.0  // Fixed at 2 meters for visibility
    
    console.log(`📏 Component height calculation: type=${componentType}, calculated=${defaultHeight}, maxSafe=${maxSafeHeight}, ceiling=${room.height}`)
    
    return Math.min(defaultHeight, maxSafeHeight)
  }

  // Calculate initial position for component placement
  const calculateInitialPosition = (componentType: string): [number, number, number] => {
    const room = state.roomDimensions || { width: 8, length: 6, height: 3 }
    
    // CRITICAL FIX: For connectors (Easy Link End Cap), ensure FLUSH ceiling mounting
    if (componentType === "connector") {
      let socketPosition: [number, number, number] = [0, room.height - 0.01, 0] // FLUSH with ceiling (only 1cm gap)
      
      if (setupData?.socketPosition) {
        // Force ceiling level for Easy Link End Cap White - it MUST be flush with ceiling
        socketPosition = [
          setupData.socketPosition.x,
          room.height - 0.01, // FORCE ceiling level regardless of socket selector Y
          setupData.socketPosition.z
        ]
        
        console.log(`🎯 CONNECTOR FORCED TO CEILING LEVEL:`, socketPosition, {
          originalSocketY: setupData.socketPosition.y,
          forcedCeilingY: room.height - 0.01,
          reason: "Easy Link End Cap must be flush with ceiling"
        })
      } else {
        console.log(`🎯 CONNECTOR USING FLUSH CEILING POSITION:`, socketPosition)
      }
      
      return socketPosition
    } else {
      // All other components at safe center position  
      const position: [number, number, number] = [0, 2.0, 0]
      console.log(`📍 COMPONENT POSITIONED AT CENTER:`, position)
      return position
    }
  }

  // Handle direct component placement (when no snap point is selected)
  const handleDirectComponentPlacement = async (componentType: string, componentTemplate: LightComponent) => {
    console.log(`📍 DIRECT COMPONENT PLACEMENT - ULTRA DEBUG START:`, {
      componentType,
      componentName: componentTemplate.name,
      setupData: setupData,
      roomDimensions: state.roomDimensions,
      socketPosition: setupData?.socketPosition
    })
    
    // Import boundary system
    const { boundarySystem } = await import("@/lib/boundary-system")
    
    // Calculate position well below ceiling
    const initialPosition = calculateInitialPosition(componentType)
    console.log(`📍 CALCULATED INITIAL POSITION:`, {
      componentType,
      initialPosition,
      setupData: {
        socketPosition: setupData?.socketPosition,
        mountingWall: setupData?.mountingWall,
        hangingType: setupData?.hangingType
      }
    })

    // Calculate initial rotation based on component type and placement location
    let initialRotation: [number, number, number] = [0, 0, 0]
    if (componentType === "connector") {
      // CRITICAL FIX: Easy Link End Cap should face downward toward ceiling/wall
      if (componentTemplate.name?.toLowerCase().includes('easy link end cap white')) {
        initialRotation = [0, 0, Math.PI]  // 180° rotation around Z-axis to face downward
        console.log(`🔄 EASY LINK END CAP ROTATION SET TO UPSIDE DOWN:`, initialRotation, {
          degrees: ['0.0', '0.0', (Math.PI * 180 / Math.PI).toFixed(1)]
        })
      } else {
        initialRotation = [0, 0, 0]  // Normal orientation for other connectors
        console.log(`🔄 OTHER CONNECTOR ROTATION SET TO NATURAL:`, initialRotation)
      }
    } else if (componentType === "track") {
      // Track models need 90° X-axis rotation to appear horizontal
      initialRotation = [0, 0, 0]  // FIXED: Horizontal tracks need NO rotation
              console.log(`🔄 TRACK ROTATION SET TO HORIZONTAL:`, initialRotation, {
          degrees: ['0.0', '0.0', '0.0']
        })
    } else if (componentType === "spotlight") {
      // CRITICAL FIX: For pendant lamps, especially Pipe Pendant lamp, should be vertical with snap point on top
      if (componentTemplate.name?.toLowerCase().includes('pipe') && 
          componentTemplate.name?.toLowerCase().includes('pendant')) {
        initialRotation = [Math.PI/2, 0, 0]  // 90° rotation around X-axis to make it vertical
        console.log(`🔄 PIPE PENDANT LAMP ROTATION SET TO VERTICAL:`, initialRotation, {
          degrees: ['90.0', '0.0', '0.0']
        })
      } else {
        initialRotation = [0, 0, 0]  // Natural orientation for other spotlights/pendant lamps
        console.log(`🔄 OTHER SPOTLIGHT/PENDANT ROTATION SET TO NATURAL:`, initialRotation)
      }
    }
    
    console.log(`🎯 ULTRA DEBUG - DIRECT PLACEMENT ROTATION:`, {
      componentType,
      initialRotation,
      degrees: [
        (initialRotation[0] * 180 / Math.PI).toFixed(1),
        (initialRotation[1] * 180 / Math.PI).toFixed(1),
        (initialRotation[2] * 180 / Math.PI).toFixed(1)
      ]
    })

    // Apply boundary constraints and smart positioning
    const roomDims = state.roomDimensions || { width: 8, length: 6, height: 3 }
    const scale: [number, number, number] = [
      componentTemplate.specifications?.scale || 1,
      componentTemplate.specifications?.scale || 1,
      componentTemplate.specifications?.scale || 1
    ]
    
    // CRITICAL FIX: Don't force connectors away from ceiling - they SHOULD be at ceiling level
    let correctedPosition = initialPosition
    let finalConstraintResult: any
    
    if (componentType === "connector") {
      // Connectors (Easy Link End Cap) should stay at ceiling level - BYPASS ALL CONSTRAINTS
      console.log(`🎯 CONNECTOR BYPASSING ALL CONSTRAINTS - STAYING AT CEILING LEVEL:`, initialPosition)
      finalConstraintResult = {
        position: initialPosition, // Use exact calculated ceiling position
        rotation: initialRotation, // Use exact rotation (including 180° for Easy Link End Cap White)
        corrected: false,
        reason: "Connector maintained at exact ceiling level"
      }
    } else {
      // For other components, apply height constraints to keep them below ceiling
      const maxHeight = Math.min(roomDims.height - 1.0, 2.0) // Maximum 2m height, minimum 1m below ceiling
      
      if (initialPosition[1] > maxHeight) {
        correctedPosition = [initialPosition[0], maxHeight, initialPosition[2]]
        console.log(`🔧 Component forced to safe height: y=${maxHeight} (was ${initialPosition[1]}, ceiling at ${roomDims.height})`)
      }
      
      finalConstraintResult = boundarySystem.validateAndCorrectPosition(
        componentType,
        correctedPosition,
        initialRotation,
        scale,
        roomDims
      )
    }

    // Show user feedback if positioning was corrected
    if (finalConstraintResult.corrected && finalConstraintResult.reason) {
      console.log(`✅ Smart positioning: ${finalConstraintResult.reason}`)
      // You could show a toast notification here
    }

    // Apply default scale from component specifications or use fallback
    let finalScale = scale
    if (componentTemplate.specifications?.scale) {
      // Use scale from component database metadata
      const dbScale = componentTemplate.specifications.scale
      finalScale = [dbScale, dbScale, dbScale]
      console.log(`🔧 Using database scale for ${componentTemplate.name}:`, finalScale)
    }

    // Create new component with constrained position and rotation
    const newComponent: Component = {
      id: `${componentType}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position: finalConstraintResult.position,
      rotation: finalConstraintResult.rotation,
      scale: finalScale,
      connections: [],
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {},
      initialPosition: finalConstraintResult.position, // Store initial position for reset
      initialRotation: finalConstraintResult.rotation,
      initialScale: finalScale
    }

    dispatch({ type: "ADD_COMPONENT", component: newComponent })
  }

  // Handle snap point placement (when a snap point is selected)
  const handleSnapPointPlacement = async (componentTemplate: LightComponent) => {
    console.log(`🔗 SNAP POINT PLACEMENT - ULTRA DEBUG START:`, {
      hasSelectedSnapPoint: !!state.selectedSnapPoint,
      selectedSnapPoint: state.selectedSnapPoint,
      componentTemplate: {
        id: componentTemplate.id,
        name: componentTemplate.name,
        type: componentTemplate.type
      }
    })
    
    if (!state.selectedSnapPoint) {
      console.error(`❌ CRITICAL: No selected snap point!`)
      return
    }
    
    // Import dependencies
    const { snapLogic } = await import("@/lib/snap-logic")
    const { boundarySystem } = await import("@/lib/boundary-system")
    
    // Find source component and snap point
    const sourceComponent = state.currentConfig.components.find(
      (c) => c.id === state.selectedSnapPoint!.componentId
    )
    const sourceSnapPoint = sourceComponent?.snapPoints?.find(
      (sp) => sp.id === state.selectedSnapPoint!.snapPointId
    )
    
    console.log(`🔍 SOURCE COMPONENT SEARCH:`, {
      searchingForComponentId: state.selectedSnapPoint.componentId,
      availableComponents: state.currentConfig.components.map(c => ({ id: c.id, name: c.name })),
      foundSourceComponent: !!sourceComponent,
      sourceComponentData: sourceComponent ? {
        id: sourceComponent.id,
        name: sourceComponent.name,
        snapPointsCount: sourceComponent.snapPoints?.length || 0
      } : null
    })
    
    console.log(`🔍 SOURCE SNAP POINT SEARCH:`, {
      searchingForSnapPointId: state.selectedSnapPoint.snapPointId,
      availableSnapPoints: sourceComponent?.snapPoints?.map(sp => ({ id: sp.id, name: sp.name, type: sp.type })) || [],
      foundSourceSnapPoint: !!sourceSnapPoint,
      sourceSnapPointData: sourceSnapPoint
    })
    
    if (!sourceComponent || !sourceSnapPoint) {
      console.error(`❌ CRITICAL: Source component or snap point not found!`, {
        sourceComponent: !!sourceComponent,
        sourceSnapPoint: !!sourceSnapPoint
      })
      return
    }
    
    // Find compatible snap point on target component using the updated snap logic
    const targetSnapPoint = componentTemplate.snapPoints?.find((sp: any) => {
      // Use the new snap logic compatibility check with component context
      return snapLogic.areSnapPointsCompatible(sourceSnapPoint, sp, sourceComponent, {
        ...componentTemplate,
        type: componentTemplate.type,
        snapPoints: componentTemplate.snapPoints
      } as any)
    })
    
    if (!targetSnapPoint) {
      console.warn("No compatible snap point found on target component")
      // Still allow placement but at calculated position
      await handleDirectComponentPlacement(componentTemplate.type, componentTemplate)
      return
    }
    
    // Calculate initial rotation for component type
    let baseRotation: [number, number, number] = [0, 0, 0]
    if (componentTemplate.type === "connector") {
      // CRITICAL FIX: Easy Link End Cap should face downward toward ceiling/wall
      if (componentTemplate.name?.toLowerCase().includes('easy link end cap white')) {
        baseRotation = [0, 0, Math.PI]  // 180° rotation around Z-axis to face downward
        console.log(`🔄 SNAP EASY LINK END CAP ROTATION SET TO UPSIDE DOWN:`, baseRotation, {
          degrees: ['0.0', '0.0', (Math.PI * 180 / Math.PI).toFixed(1)]
        })
      } else {
        baseRotation = [0, 0, 0]  // Normal orientation for other connectors
        console.log(`🔄 SNAP OTHER CONNECTOR ROTATION SET TO NATURAL:`, baseRotation)
      }
    } else if (componentTemplate.type === "track") {
      // LET SNAP LOGIC HANDLE TRACK ROTATION - No override!
      baseRotation = [0, 0, 0] // This will be overridden by snap logic calculation
      console.log(`🔄 SNAP TRACK ROTATION - WILL BE CALCULATED BY SNAP LOGIC:`, baseRotation, {
        degrees: ['0.0', '0.0', '0.0'],
        note: 'This base rotation will be overridden by snap logic calculation'
      })
    } else if (componentTemplate.type === "spotlight") {
      // CRITICAL FIX: For pendant lamps, especially Pipe Pendant lamp, should be vertical with snap point on top
      if (componentTemplate.name?.toLowerCase().includes('pipe') && 
          componentTemplate.name?.toLowerCase().includes('pendant')) {
        baseRotation = [Math.PI/2, 0, 0]  // 90° rotation around X-axis to make it vertical
        console.log(`🔄 SNAP PIPE PENDANT LAMP ROTATION SET TO VERTICAL:`, baseRotation, {
          degrees: ['90.0', '0.0', '0.0']
        })
      } else {
        baseRotation = [0, 0, 0] // Natural orientation for other spotlights/pendant lamps
        console.log(`🔄 SNAP OTHER SPOTLIGHT/PENDANT ROTATION SET TO NATURAL:`, baseRotation)
      }
    }
    
    console.log(`🔗 ULTRA DEBUG - SNAP PLACEMENT ROTATION:`, {
      componentType: componentTemplate.type,
      baseRotation,
      degrees: [
        (baseRotation[0] * 180 / Math.PI).toFixed(1),
        (baseRotation[1] * 180 / Math.PI).toFixed(1),
        (baseRotation[2] * 180 / Math.PI).toFixed(1)
      ]
    })

    // CRITICAL FIX: Calculate the actual scale BEFORE the snap point calculation
    const defaultScale = componentTemplate.specifications?.scale || 1
    let componentScale: [number, number, number] = [defaultScale, defaultScale, defaultScale]
    
    console.log(`🔧 Using component scale from database:`, {
      componentName: componentTemplate.name,
      databaseScale: componentTemplate.specifications?.scale,
      finalScale: componentScale
    })

    console.log(`📏 FINAL COMPONENT SCALE:`, componentScale)

    // Create a temporary target component object with the CORRECT scale for snap calculation
    const tempTargetComponent: Component = {
      id: `temp-${componentTemplate.type}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position: [0, 0, 0], 
      rotation: baseRotation, 
      scale: componentScale, // USE THE ACTUAL SCALE, NOT [1,1,1]!
      connections: [],
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {},
      initialPosition: [0, 0, 0],
      initialRotation: baseRotation,
      initialScale: componentScale
    }
    
    console.log(`🔗 SNAP CALCULATION WITH CORRECT SCALE:`, {
      componentName: tempTargetComponent.name,
      scale: tempTargetComponent.scale,
      targetSnapPoint: targetSnapPoint.name,
      targetSnapPointPosition: targetSnapPoint.position
    })
    
    // CRITICAL FIX: Use the improved snap logic for perfect alignment
    const connectionData = snapLogic.calculateConnectionPosition(
      sourceComponent,
      sourceSnapPoint,
      tempTargetComponent,
      targetSnapPoint
    )

    console.log(`🎯 PERFECT SNAP ALIGNMENT RESULT:`, {
      calculatedPosition: connectionData.position,
      calculatedRotation: connectionData.rotation,
      sourceSnapPointName: sourceSnapPoint.name,
      targetSnapPointName: targetSnapPoint.name,
      sourceComponent: sourceComponent.name,
      targetComponent: tempTargetComponent.name
    })

    // CRITICAL FIX: Do NOT apply boundary constraints for snap point connections!
    // The component MUST be placed at the exact calculated position for perfect alignment
    // Boundary constraints would break the snap point alignment
    
    console.log(`🔒 SKIPPING BOUNDARY CONSTRAINTS for snap point precision`)

    // Create new component with the EXACT calculated position and rotation (no constraints!)
    const newComponent: Component = {
      id: `${componentTemplate.type}-${Date.now()}`,
      name: componentTemplate.name,
      type: componentTemplate.type,
      model3d: componentTemplate.model3d,
      image: componentTemplate.image,
      position: connectionData.position, // Use EXACT calculated position
      rotation: connectionData.rotation, // Use EXACT calculated rotation
      scale: componentScale,
      connections: [sourceComponent.id], // Track connection
      snapPoints: componentTemplate.snapPoints || [],
      price: componentTemplate.price || 0,
      properties: componentTemplate.specifications || {},
      initialPosition: connectionData.position, // Store exact position for reset
      initialRotation: connectionData.rotation,
      initialScale: componentScale
    }

    // Add connection to source component as well
    const updatedSourceComponent = {
      ...sourceComponent,
      connections: [...(sourceComponent.connections || []), newComponent.id]
    }

    dispatch({ type: "ADD_COMPONENT", component: newComponent, fromSnapPoint: true })
    dispatch({ type: "UPDATE_COMPONENT", componentId: sourceComponent.id, updates: { connections: updatedSourceComponent.connections } })
    dispatch({ type: "CLEAR_SELECTED_SNAP_POINT" })
    
    console.log("✅ Component connected via snap points:", {
      source: sourceComponent.name,
      target: newComponent.name,
      sourceSnapPoint: sourceSnapPoint.name,
      targetSnapPoint: targetSnapPoint.name,
      position: connectionData.position,
      rotation: connectionData.rotation,
      constraintApplied: false // No constraints applied for precise snap alignment
    })
  }

  // Handle component selection
  const handleComponentSelect = async (component: LightComponent) => {
    console.log(`🎯 SPECIFIC COMPONENT SELECTED for placement:`, {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      hasSelectedSnapPoint: !!state.selectedSnapPoint,
      selectedSnapPoint: state.selectedSnapPoint,
      existingComponentsCount: state.currentConfig.components.length
    })
    
    // CRITICAL VALIDATION: Check if this is the first component placement
    if (state.currentConfig.components.length === 0 && !state.selectedSnapPoint) {
      if (!component.name?.toLowerCase().includes('easy link end cap white')) {
        console.error(`❌ FIRST COMPONENT RESTRICTION: Only Easy Link End Cap White can be placed first!`)
        alert('Please start with the Easy Link End Cap White component. This is the starting point for your lighting system.')
        return
      }
      
      console.log(`✅ FIRST COMPONENT VALIDATION PASSED: Easy Link End Cap White selected`, {
        componentName: component.name,
        componentType: component.type
      })
    }

    if (state.selectedSnapPoint) {
      // We have a snap point selected - place component there
      console.log(`🔗 Placing component via snap point attachment`)
      await handleSnapPointPlacement(component)
    } else {
      // No snap point selected - place at calculated position
      console.log(`📍 Placing component at calculated position`)
      await handleDirectComponentPlacement(component.type, component)
    }
  }

  // Get compatible components for the selected snap point
  const getCompatibleComponents = () => {
    if (!state.selectedSnapPoint) {
      // CRITICAL FIX: If no components exist, only allow Easy Link End Cap White as first component
      if (state.currentConfig.components.length === 0) {
        console.log(`🚫 NO COMPONENTS EXIST - ONLY ALLOWING EASY LINK END CAP WHITE AS FIRST COMPONENT`)
        return availableComponents.filter(component => 
          component.name?.toLowerCase().includes('easy link end cap white')
        )
      }
      return availableComponents
    }

    // Find the selected snap point
    const sourceComponent = state.currentConfig.components.find((c) => c.id === state.selectedSnapPoint!.componentId)
    const snapPoint = sourceComponent?.snapPoints?.find((sp) => sp.id === state.selectedSnapPoint!.snapPointId)

    if (!snapPoint || !sourceComponent) return availableComponents

    // Filter components by the new strict compatibility rules
    return availableComponents.filter((component) => {
      // Check if any snap point on this component is compatible with the selected snap point
      return component.snapPoints?.some((targetSnapPoint) => {
        const { snapLogic } = require("@/lib/snap-logic")
        return snapLogic.areSnapPointsCompatible(snapPoint, targetSnapPoint, sourceComponent, {
          type: component.type,
          name: component.name,
          snapPoints: component.snapPoints
        })
      }) || false
    })
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
                  onClick={() => isCompatible && handleComponentSelect(component)}
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
