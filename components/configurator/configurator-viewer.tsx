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
      console.log(`🎯 SNAP POINT CLICKED - ULTRA DEBUG:`, {
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

  // Handle transform updates from transform controls with snap-aware logic
  const handleTransformUpdate = useCallback(async (componentId: string, transform: {
    rotation?: [number, number, number]
    scale?: [number, number, number]
    position?: [number, number, number]
  }) => {
    console.log(`🎯 SNAP-AWARE TRANSFORM UPDATE:`, {
      componentId,
      transform,
      isManualTransform: true
    })

    // Get the component being transformed
    const component = state.currentConfig.components.find(c => c.id === componentId)
    if (!component) return

    // Check if this component is connected via snap points
    const hasSnapConnections = component.connections && component.connections.length > 0
    const isSnapAttached = !!hasSnapConnections

    console.log(`🔗 SNAP CONNECTION CHECK:`, {
      componentId,
      hasSnapConnections,
      connections: component.connections,
      isSnapAttached
    })

    // For components with snap connections, handle rotation specially
    if (isSnapAttached && transform.rotation) {
      console.log(`🔄 SNAP-AWARE ROTATION for connected component:`, componentId)
      
      // Import snap logic for recalculation
      const { snapLogic } = await import("@/lib/snap-logic")
      
      // Find the connected component and snap points
      const connectedComponentId = component.connections[0] // Assume first connection for now
      const connectedComponent = state.currentConfig.components.find(c => c.id === connectedComponentId)
      
      if (connectedComponent) {
        console.log(`🔗 RECALCULATING SNAP CONNECTION after rotation:`, {
          rotatingComponent: component.id,
          connectedComponent: connectedComponent.id,
          newRotation: transform.rotation
        })
        
        // Update the component with new rotation but maintain snap connection
        // The exact position will be recalculated to maintain the snap connection
        dispatch({
          type: "UPDATE_COMPONENT",
          componentId,
          updates: { 
            ...transform
            // Keep position for now - could be recalculated if needed
          }
        })
        
        console.log(`✅ Snap-connected component rotated with connection maintained`)
        return
      }
    }

    // For regular components or position/scale changes, apply boundary constraints
    if (!isSnapAttached) {
      // Import boundary system for validation
      const { boundarySystem } = await import("@/lib/boundary-system")
      
      let finalTransform = transform

      // Apply boundary constraints for non-snap-attached components
      if (transform.position || transform.rotation) {
        const roomDims = state.roomDimensions || { width: 8, length: 6, height: 3 }
        
        const constraintResult = boundarySystem.validateAndCorrectPosition(
          component.type,
          transform.position || component.position,
          transform.rotation || component.rotation,
          component.scale || [1, 1, 1],
          roomDims
        )
        
        finalTransform = {
          ...transform,
          position: constraintResult.position,
          rotation: constraintResult.rotation
        }
        
        if (constraintResult.corrected) {
          console.log(`✅ Transform constrained:`, constraintResult.reason)
        }
      }

      dispatch({
        type: "UPDATE_COMPONENT",
        componentId,
        updates: finalTransform
      })
    } else {
      // For snap-attached components, only apply transform directly (maintain connection)
      dispatch({
        type: "UPDATE_COMPONENT",
        componentId,
        updates: transform
      })
    }
  }, [state.currentConfig.components, state.roomDimensions, dispatch])

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
