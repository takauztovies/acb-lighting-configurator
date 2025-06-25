"use client"

import { useCallback, useEffect } from "react"
import { useConfigurator } from "./configurator-context"
import Scene3D from "./scene-3d"
import { TransformControls } from "./transform-controls"
import { Button } from "@/components/ui/button"
import { Grid3X3, CircleDot, Trash2, X, Target } from "lucide-react"

export function ConfiguratorViewer() {
  const { state, dispatch } = useConfigurator()

  // Handle component selection
  const handleComponentClick = useCallback(
    (componentId: string) => {
      console.log(`🎯 COMPONENT CLICKED:`, {
        componentId,
        currentSelected: state.selectedComponentId
      })
      dispatch({ type: "SET_SELECTED_COMPONENT", componentId })
      console.log(`✅ Component selection dispatched`)
    },
    [dispatch, state.selectedComponentId],
  )

  // Handle snap point selection - this starts the placement mode
  const handleSnapPointClick = useCallback(
    (componentId: string, snapPointId: string) => {
      console.log(`�� SNAP POINT CLICKED - ULTRA DEBUG:`, {
        componentId,
        snapPointId,
        currentSelectedSnapPoint: state.selectedSnapPoint,
        componentName: state.currentConfig.components.find(c => c.id === componentId)?.name,
        snapPointDetails: state.currentConfig.components.find(c => c.id === componentId)?.snapPoints?.find(sp => sp.id === snapPointId)
      })
      
      // Add visual notification
      console.log(`🟢 SNAP POINT SELECTION SUCCESSFUL!`)
      console.log(`📋 NEXT STEP: Click a component in the sidebar to connect it to this snap point`)
      
      dispatch({ type: "SET_SELECTED_SNAP_POINT", componentId, snapPointId })
      console.log(`✅ Snap point selection dispatched`)
      
      // Add alert for testing
      alert(`🎯 SNAP POINT SELECTED!\n\nComponent: ${state.currentConfig.components.find(c => c.id === componentId)?.name}\nSnap Point: ${state.currentConfig.components.find(c => c.id === componentId)?.snapPoints?.find(sp => sp.id === snapPointId)?.name}\n\nNow click a track component from the sidebar to connect it!`)
    },
    [dispatch, state.selectedSnapPoint, state.currentConfig.components],
  )

  // Delete selected components
  const deleteSelectedComponents = useCallback(() => {
    if (state.selectedComponentIds.length > 0) {
      state.selectedComponentIds.forEach((componentId) => {
        dispatch({ type: "REMOVE_COMPONENT", componentId })
      })
      dispatch({ type: "CLEAR_SELECTION" })
    }
  }, [state.selectedComponentIds, dispatch])

  // Clear snap point selection
  const clearSnapPointSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTED_SNAP_POINT" })
  }, [dispatch])

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    dispatch({ type: "TOGGLE_GRID" })
  }, [dispatch])

  // Toggle snap points visibility
  const toggleSnapPoints = useCallback(() => {
    dispatch({ type: "TOGGLE_LABELS" })
  }, [dispatch])

  // Handle transform updates from transform controls with boundary checking
  const handleTransformUpdate = useCallback(async (componentId: string, transform: {
    rotation?: [number, number, number]
    scale?: [number, number, number]
    position?: [number, number, number]
  }) => {
    console.log(`🎯 MANUAL TRANSFORM UPDATE:`, {
      componentId,
      transform,
      isManualTransform: true
    })

    // Import boundary system for validation
    const { boundarySystem } = await import("@/lib/boundary-system")
    
    // Get the component being transformed
    const component = state.currentConfig.components.find(c => c.id === componentId)
    if (!component) return

    // For manual transforms, we only apply basic position constraints, NOT rotation overrides
    let finalTransform = transform
    
    if (transform.position) {
      const roomDims = { 
        width: state.roomDimensions?.width || 8, 
        height: state.roomDimensions?.height || 3, 
        depth: state.roomDimensions?.length || 6  // Use length from roomDimensions
      }
      
      // Create updated component with new transform, preserving all required LightComponent properties
      const updatedComponent: any = {
        ...component,
        position: transform.position,
        rotation: transform.rotation || component.rotation,
        scale: transform.scale || component.scale
      }
      
      // Use smartPositioning with manual transform context to prevent rotation override
      const constrainedComponent = boundarySystem.smartPositioning(
        updatedComponent,
        roomDims,
        { isManualTransform: true, source: 'manual-transform' }
      )
      
      // Only use position constraints from smartPositioning, preserve manual rotation
      finalTransform = {
        position: constrainedComponent.position,
        rotation: transform.rotation || component.rotation, // PRESERVE manual rotation
        scale: transform.scale || component.scale
      }
      
      console.log(`🔧 MANUAL TRANSFORM FINAL:`, {
        originalRotation: transform.rotation,
        finalRotation: finalTransform.rotation,
        preservedManualRotation: true
      })
    }

    dispatch({ 
      type: "UPDATE_COMPONENT", 
      componentId, 
      updates: finalTransform 
    })
  }, [dispatch, state.currentConfig.components, state.roomDimensions])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key to remove selected components
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        deleteSelectedComponents()
      }

      // Escape key to clear selections
      if (event.key === "Escape") {
        event.preventDefault()
        dispatch({ type: "CLEAR_SELECTION" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteSelectedComponents, dispatch])

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <div className="w-full h-full">
        <Scene3D
          components={state.currentConfig.components}
          selectedComponentIds={state.selectedComponentIds}
          selectedSnapPoint={state.selectedSnapPoint}
          onComponentClick={handleComponentClick}
          onSnapPointClick={handleSnapPointClick}
          showLabels={false}
          showSnapPoints={true}
          gridVisible={state.gridVisible}
          transformMode={state.transformMode}
          sceneImageSettings={state.sceneImageSettings}
          roomDimensions={state.roomDimensions}
          socketPosition={
            state.guidedSetupData?.socketPosition
              ? {
                  x: state.guidedSetupData.socketPosition.x || 0,
                  y: state.guidedSetupData.socketPosition.y || 1.2,
                  z: state.guidedSetupData.socketPosition.z || -3,
                  wall: state.guidedSetupData.socketPosition.wall || "back",
                }
              : null
          }
          cableCalculations={state.cableCalculations || []}
        />
      </div>

      {/* Transform Controls Panel */}
      {state.selectedComponentIds.length === 1 && (
        <div className="absolute top-4 left-4 z-20">
          <TransformControls
            selectedComponentId={state.selectedComponentIds[0]}
            onTransform={handleTransformUpdate}
            currentTransform={{
              position: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.position,
              rotation: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.rotation,
              scale: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.scale || [1, 1, 1],
              initialPosition: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.initialPosition,
              initialRotation: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.initialRotation,
              initialScale: state.currentConfig.components.find(c => c.id === state.selectedComponentIds[0])?.initialScale
            }}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant={state.gridVisible ? "default" : "outline"}
          size="icon"
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={state.showLabels ? "default" : "outline"}
          size="icon"
          onClick={toggleSnapPoints}
          title="Toggle Snap Points"
        >
          <CircleDot className="h-4 w-4" />
        </Button>
        {state.selectedComponentIds.length > 0 && (
          <Button
            variant="destructive"
            size="icon"
            onClick={deleteSelectedComponents}
            title="Delete Selected Components"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Snap Point Selection Indicator */}
      {state.selectedSnapPoint && (
        <div className="absolute top-4 left-96 bg-green-500 text-white p-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <div className="flex-1">
              <div className="font-medium">Snap Point Selected</div>
              <div className="text-sm opacity-90">Ready to place component</div>
              <div className="text-xs opacity-75 mt-1">
                Click a component in the sidebar to attach it to this snap point
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSnapPointSelection}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-2 text-xs flex justify-between border-t">
        <div className="flex items-center gap-4">
          <span>
            {state.selectedComponentIds.length > 0
              ? `Selected: ${state.selectedComponentIds.length} component(s)`
              : "No component selected"}
          </span>
          {state.selectedSnapPoint && (
            <span className="text-green-600 font-medium">• Snap point ready for connection</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{state.currentConfig.components.length} components</span>
          <span className="font-medium">€{state.currentConfig.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-8 left-4 bg-gray-800 text-white p-2 rounded text-xs opacity-75">
        <div>Click: Select component • Click snap point: Ready to connect</div>
        <div>Delete/Backspace: Remove selected • Escape: Clear selection</div>
      </div>
    </div>
  )
}
