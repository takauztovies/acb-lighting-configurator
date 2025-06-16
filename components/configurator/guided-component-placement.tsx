"use client"

import { useState } from "react"
import { useConfigurator } from "./configurator-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Plus, Check, X, Target, Zap } from "lucide-react"

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

  // Handle direct component placement (when no snap point is selected)
  const handleDirectComponentPlacement = (componentType: string) => {
    const position = calculateInitialPosition(componentType)
    const componentTemplate = availableComponents.find((c) => c.type === componentType)
    if (!componentTemplate) return

    const newComponent = {
      ...componentTemplate,
      id: `${componentType}-${Date.now()}`,
      position,
      rotation: [0, 0, 0] as [number, number, number],
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

  // Calculate initial component position based on setup data
  const calculateInitialPosition = (componentType: string): [number, number, number] => {
    const hangingHeight = setupData.hangingHeight || setupData.componentHeight || 2.5

    let baseX = 0
    let baseZ = 0

    if (setupData.socketPosition) {
      baseX = setupData.socketPosition.x
      baseZ = setupData.socketPosition.z
    }

    // Add some offset for multiple components of the same type
    const existingComponents = state.currentConfig.components.filter((c) => c.type === componentType)
    const offset = existingComponents.length * 0.5

    return [baseX + offset, hangingHeight, baseZ + offset]
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
