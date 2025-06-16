"use client"

import { useCallback, useEffect } from "react"
import { useConfigurator } from "./configurator-context"
import Scene3D from "./scene-3d"
import { Button } from "@/components/ui/button"
import { Grid3X3, CircleDot, Trash2, X, Target } from "lucide-react"

export function ConfiguratorViewer() {
  const { state, dispatch } = useConfigurator()

  // Handle component selection
  const handleComponentClick = useCallback(
    (componentId: string) => {
      console.log(`Selecting component: ${componentId}`)
      dispatch({ type: "SET_SELECTED_COMPONENT", componentId })
    },
    [dispatch],
  )

  // Handle snap point selection - this starts the placement mode
  const handleSnapPointClick = useCallback(
    (componentId: string, snapPointId: string) => {
      console.log(`Selected snap point: ${snapPointId} on component ${componentId}`)
      dispatch({ type: "SET_SELECTED_SNAP_POINT", componentId, snapPointId })
    },
    [dispatch],
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
        <div className="absolute top-4 left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg max-w-sm">
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
