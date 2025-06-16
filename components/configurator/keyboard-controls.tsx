"use client"

import { useEffect } from "react"
import { useConfigurator } from "./configurator-context"

export function KeyboardControls() {
  const { state, dispatch } = useConfigurator()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard events if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const moveAmount = event.shiftKey ? 1.0 : event.ctrlKey ? 0.1 : 0.25

      // Handle multi-selection or single selection
      const hasSelection = state.selectedComponentIds.length > 0
      const hasMultiSelection = state.selectedComponentIds.length > 1

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          if (hasSelection) {
            if (hasMultiSelection) {
              dispatch({
                type: "MOVE_SELECTED_COMPONENTS",
                direction: "left",
                amount: moveAmount,
              })
            } else if (state.selectedComponentId) {
              dispatch({
                type: "MOVE_COMPONENT",
                componentId: state.selectedComponentId,
                direction: "left",
                amount: moveAmount,
              })
            }
          }
          break

        case "ArrowRight":
          event.preventDefault()
          if (hasSelection) {
            if (hasMultiSelection) {
              dispatch({
                type: "MOVE_SELECTED_COMPONENTS",
                direction: "right",
                amount: moveAmount,
              })
            } else if (state.selectedComponentId) {
              dispatch({
                type: "MOVE_COMPONENT",
                componentId: state.selectedComponentId,
                direction: "right",
                amount: moveAmount,
              })
            }
          }
          break

        case "ArrowUp":
          event.preventDefault()
          if (hasSelection) {
            if (event.altKey) {
              // Alt + Up = move up in Y axis
              if (hasMultiSelection) {
                dispatch({
                  type: "MOVE_SELECTED_COMPONENTS",
                  direction: "up",
                  amount: moveAmount,
                })
              } else if (state.selectedComponentId) {
                dispatch({
                  type: "MOVE_COMPONENT",
                  componentId: state.selectedComponentId,
                  direction: "up",
                  amount: moveAmount,
                })
              }
            } else {
              // Regular Up = move forward in Z axis
              if (hasMultiSelection) {
                dispatch({
                  type: "MOVE_SELECTED_COMPONENTS",
                  direction: "forward",
                  amount: moveAmount,
                })
              } else if (state.selectedComponentId) {
                dispatch({
                  type: "MOVE_COMPONENT",
                  componentId: state.selectedComponentId,
                  direction: "forward",
                  amount: moveAmount,
                })
              }
            }
          }
          break

        case "ArrowDown":
          event.preventDefault()
          if (hasSelection) {
            if (event.altKey) {
              // Alt + Down = move down in Y axis
              if (hasMultiSelection) {
                dispatch({
                  type: "MOVE_SELECTED_COMPONENTS",
                  direction: "down",
                  amount: moveAmount,
                })
              } else if (state.selectedComponentId) {
                dispatch({
                  type: "MOVE_COMPONENT",
                  componentId: state.selectedComponentId,
                  direction: "down",
                  amount: moveAmount,
                })
              }
            } else {
              // Regular Down = move backward in Z axis
              if (hasMultiSelection) {
                dispatch({
                  type: "MOVE_SELECTED_COMPONENTS",
                  direction: "backward",
                  amount: moveAmount,
                })
              } else if (state.selectedComponentId) {
                dispatch({
                  type: "MOVE_COMPONENT",
                  componentId: state.selectedComponentId,
                  direction: "backward",
                  amount: moveAmount,
                })
              }
            }
          }
          break

        case "Delete":
        case "Backspace":
          event.preventDefault()
          if (hasSelection) {
            // Delete all selected components
            state.selectedComponentIds.forEach((componentId) => {
              dispatch({ type: "REMOVE_COMPONENT", componentId })
            })
            dispatch({ type: "CLEAR_SELECTION" })
          }
          break

        case "Escape":
          event.preventDefault()
          dispatch({ type: "CLEAR_SELECTION" })
          break

        case "c":
          if ((event.ctrlKey || event.metaKey) && state.selectedComponentId) {
            event.preventDefault()
            dispatch({ type: "COPY_COMPONENT", componentId: state.selectedComponentId })
          }
          break

        case "v":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            dispatch({ type: "PASTE_COMPONENT" })
          }
          break

        case "l":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            dispatch({ type: "TOGGLE_LABELS" })
          }
          break

        case "a":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Select all components
            const allComponentIds = state.currentConfig.components.map((comp) => comp.id)
            dispatch({ type: "SET_SELECTED_COMPONENTS", componentIds: allComponentIds })
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.selectedComponentId, state.selectedComponentIds, dispatch])

  return null
}
