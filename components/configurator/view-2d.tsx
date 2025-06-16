"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { useConfigurator, type LightComponent } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import { X, Move } from "lucide-react"

interface View2DProps {
  snapToGrid?: boolean
  gridSize?: number
  mode?: string
}

interface ConnectionPoint {
  id: string
  position: [number, number, number]
  type: "input" | "output" | "bidirectional"
  connected: boolean
}

interface InteractionState {
  isDragging: boolean
  isRotating: boolean
  isSelecting: boolean
  dragStartPos: { x: number; y: number }
  componentStartPos: [number, number, number]
  dragOffset: { x: number; y: number }
  hasMoved: boolean
  selectionStart: { x: number; y: number }
  selectionEnd: { x: number; y: number }
}

interface Measurement {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  distance: number
}

interface DraggableWindowProps {
  title: string
  children: React.ReactNode
  initialPosition: { x: number; y: number }
  onClose?: () => void
  className?: string
}

function DraggableWindow({ title, children, initialPosition, onClose, className = "" }: DraggableWindowProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Store the initial mouse position and window position
      setDragStart({ x: e.clientX, y: e.clientY })
      setInitialPos({ x: position.x, y: position.y })
      setIsDragging(true)
    },
    [position],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      e.preventDefault()

      // Calculate the difference from where we started dragging
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      // Update position based on initial position + delta
      setPosition({
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY,
      })
    },
    [isDragging, dragStart, initialPos],
  )

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Add global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false })
      document.addEventListener("mouseup", handleMouseUp, { passive: false })

      // Prevent text selection while dragging
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Constrain position to viewport
  useEffect(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newX = position.x
      let newY = position.y

      // Keep window within viewport bounds
      if (newX < 0) newX = 0
      if (newY < 0) newY = 0
      if (newX + rect.width > viewportWidth) newX = viewportWidth - rect.width
      if (newY + rect.height > viewportHeight) newY = viewportHeight - rect.height

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY })
      }
    }
  }, [position])

  return (
    <div
      ref={windowRef}
      className={`absolute bg-white rounded-lg shadow-lg border border-gray-200 z-20 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: "200px",
        transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
      }}
    >
      <div
        className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg cursor-grab border-b border-gray-200 select-none"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

export function View2D({ snapToGrid = false, gridSize = 0.5, mode = "select" }: View2DProps) {
  const { state, dispatch } = useConfigurator()
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(50) // pixels per unit
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<{ componentId: string; pointId: string } | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [selectedComponentsStartPos, setSelectedComponentsStartPos] = useState<
    Record<string, [number, number, number]>
  >({})

  // Measurement state
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [measurementPoints, setMeasurementPoints] = useState<{ x: number; y: number }[]>([])
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null)

  // UI state
  const [showInstructions, setShowInstructions] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)

  // Interaction state
  const [interaction, setInteraction] = useState<InteractionState>({
    isDragging: false,
    isRotating: false,
    isSelecting: false,
    dragStartPos: { x: 0, y: 0 },
    componentStartPos: [0, 0, 0],
    dragOffset: { x: 0, y: 0 },
    hasMoved: false,
    selectionStart: { x: 0, y: 0 },
    selectionEnd: { x: 0, y: 0 },
  })

  // Cache for component images
  const [componentImages, setComponentImages] = useState<Record<string, HTMLImageElement>>({})

  // Ensure mode is always a valid string
  const currentMode = mode || "select"

  // Show measurements panel when in measure mode
  useEffect(() => {
    if (currentMode === "measure") {
      setShowMeasurements(true)
    }
  }, [currentMode])

  // Clear measurements when switching modes
  useEffect(() => {
    if (currentMode !== "measure") {
      setMeasurementPoints([])
      setHoverPoint(null)
    }
  }, [currentMode])

  // Load component images
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {}

      for (const component of state.currentConfig.components) {
        if (!images[component.type]) {
          const img = new Image()
          img.crossOrigin = "anonymous"

          // Use different images based on component type
          switch (component.type) {
            case "track":
              img.src = "/placeholder.svg?height=100&width=100&text=Track"
              break
            case "spotlight":
              img.src = "/placeholder.svg?height=100&width=100&text=Spotlight"
              break
            case "connector":
              img.src = "/placeholder.svg?height=100&width=100&text=Connector"
              break
            case "power-supply":
              img.src = "/placeholder.svg?height=100&width=100&text=Power+Supply"
              break
            default:
              img.src = "/placeholder.svg?height=100&width=100&text=Component"
          }

          await new Promise((resolve) => {
            img.onload = resolve
          })

          images[component.type] = img
        }
      }

      setComponentImages((prev) => ({ ...prev, ...images }))
    }

    loadImages()
  }, [state.currentConfig.components])

  // Convert 3D world coordinates to 2D canvas coordinates
  const worldToCanvas = useCallback(
    (x: number, z: number): [number, number] => {
      const canvasX = x * scale + (canvasRef.current?.width || 0) / 2 + pan.x
      const canvasY = z * scale + (canvasRef.current?.height || 0) / 2 + pan.y
      return [canvasX, canvasY]
    },
    [scale, pan],
  )

  // Convert 2D canvas coordinates to 3D world coordinates
  const canvasToWorld = useCallback(
    (canvasX: number, canvasY: number): [number, number] => {
      const x = (canvasX - (canvasRef.current?.width || 0) / 2 - pan.x) / scale
      const z = (canvasY - (canvasRef.current?.height || 0) / 2 - pan.y) / scale
      return [x, z]
    },
    [scale, pan],
  )

  // Get component bounds for better hit detection
  const getComponentBounds = useCallback((component: LightComponent) => {
    let width = 40,
      height = 40 // Increased default size for easier selection
    switch (component.type) {
      case "track":
        width = 120
        height = 30
        break
      case "spotlight":
        width = 40
        height = 40
        break
      case "connector":
        width = 30
        height = 30
        break
      case "power-supply":
        width = 50
        height = 40
        break
    }
    return { width, height }
  }, [])

  // Find component under mouse with improved hit detection
  const findComponentAtPosition = useCallback(
    (canvasX: number, canvasY: number): LightComponent | null => {
      // Check in reverse order to select the top-most component
      for (let i = state.currentConfig.components.length - 1; i >= 0; i--) {
        const component = state.currentConfig.components[i]
        const [cx, cy] = worldToCanvas(component.position[0], component.position[2])
        const { width, height } = getComponentBounds(component)

        // Add generous padding for easier selection
        const padding = 15
        const expandedWidth = width + padding * 2
        const expandedHeight = height + padding * 2

        // Apply rotation
        const angle = component.rotation[1]
        const dx = canvasX - cx
        const dy = canvasY - cy

        // Rotate the mouse position relative to component center
        const rotatedX = Math.cos(-angle) * dx - Math.sin(-angle) * dy
        const rotatedY = Math.sin(-angle) * dx + Math.cos(-angle) * dy

        // Check if point is inside expanded rectangle
        const halfWidth = expandedWidth / 2
        const halfHeight = expandedHeight / 2

        if (rotatedX >= -halfWidth && rotatedX <= halfWidth && rotatedY >= -halfHeight && rotatedY <= halfHeight) {
          return component
        }
      }

      return null
    },
    [state.currentConfig.components, worldToCanvas, getComponentBounds],
  )

  // Find connection point under mouse
  const findConnectionPointAtPosition = useCallback(
    (canvasX: number, canvasY: number): { componentId: string; pointId: string } | null => {
      for (const component of state.currentConfig.components) {
        const [cx, cy] = worldToCanvas(component.position[0], component.position[2])
        const connectionPoints = getConnectionPoints(component)

        for (const point of connectionPoints) {
          const angle = component.rotation[1]
          const pointX = point.position[0]
          const pointZ = point.position[2]

          const rotatedPointX = cx + (Math.cos(angle) * pointX - Math.sin(angle) * pointZ) * scale
          const rotatedPointY = cy + (Math.sin(angle) * pointX + Math.cos(angle) * pointZ) * scale

          const distance = Math.sqrt(Math.pow(rotatedPointX - canvasX, 2) + Math.pow(rotatedPointY - canvasY, 2))

          if (distance <= 15) {
            // Increased radius for easier clicking
            return { componentId: component.id, pointId: point.id }
          }
        }
      }

      return null
    },
    [state.currentConfig.components, worldToCanvas, scale],
  )

  // Get connection points for a component
  const getConnectionPoints = useCallback((component: LightComponent): ConnectionPoint[] => {
    switch (component.type) {
      case "track":
        return [
          { id: "left", position: [-1, 0, 0], type: "bidirectional", connected: false },
          { id: "right", position: [1, 0, 0], type: "bidirectional", connected: false },
          { id: "top1", position: [-0.5, 0.1, 0], type: "output", connected: false },
          { id: "top2", position: [0, 0.1, 0], type: "output", connected: false },
          { id: "top3", position: [0.5, 0.1, 0], type: "output", connected: false },
        ]
      case "spotlight":
        return [{ id: "mount", position: [0, 0.25, 0], type: "input", connected: false }]
      case "connector":
        return [
          { id: "in1", position: [-0.1, 0, 0], type: "input", connected: false },
          { id: "in2", position: [0, 0, -0.1], type: "input", connected: false },
          { id: "out", position: [0.1, 0, 0], type: "output", connected: false },
        ]
      case "power-supply":
        return [{ id: "output", position: [0.4, 0, 0], type: "output", connected: false }]
      default:
        return []
    }
  }, [])

  // Check if point is inside selection box
  const isPointInSelectionBox = useCallback(
    (x: number, y: number): boolean => {
      const minX = Math.min(interaction.selectionStart.x, interaction.selectionEnd.x)
      const maxX = Math.max(interaction.selectionStart.x, interaction.selectionEnd.x)
      const minY = Math.min(interaction.selectionStart.y, interaction.selectionEnd.y)
      const maxY = Math.max(interaction.selectionStart.y, interaction.selectionEnd.y)

      return x >= minX && x <= maxX && y >= minY && y <= maxY
    },
    [interaction.selectionStart, interaction.selectionEnd],
  )

  // Add measurement
  const addMeasurement = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) / scale
      const measurement: Measurement = {
        id: `measurement-${Date.now()}`,
        start,
        end,
        distance,
      }
      setMeasurements((prev) => [...prev, measurement])
    },
    [scale],
  )

  // Remove measurement
  const removeMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // Clear all measurements
  const clearAllMeasurements = useCallback(() => {
    setMeasurements([])
    setMeasurementPoints([])
    setHoverPoint(null)
  }, [])

  // Handle mouse down with improved interaction
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Handle measurement mode
      if (currentMode === "measure") {
        if (measurementPoints.length === 0) {
          // First point
          setMeasurementPoints([{ x, y }])
        } else if (measurementPoints.length === 1) {
          // Second point - complete measurement
          addMeasurement(measurementPoints[0], { x, y })
          setMeasurementPoints([])
        }
        return
      }

      // Check for connection points first (highest priority)
      const connectionPoint = findConnectionPointAtPosition(x, y)
      if (connectionPoint) {
        if (!connectingFrom) {
          setConnectingFrom(connectionPoint)
        } else {
          if (connectingFrom.componentId !== connectionPoint.componentId) {
            const newConnection = {
              id: `conn-${Date.now()}`,
              from: connectingFrom,
              to: connectionPoint,
            }
            dispatch({ type: "ADD_CONNECTION", connection: newConnection })
          }
          setConnectingFrom(null)
        }
        return
      }

      // Check for component selection
      const component = findComponentAtPosition(x, y)
      if (component) {
        // Store starting positions of all selected components for group movement
        const startPositions: Record<string, [number, number, number]> = {}

        // Select the component
        if (e.ctrlKey || e.metaKey) {
          // Multi-select mode (Ctrl on Windows/Linux, Cmd on Mac)
          dispatch({ type: "TOGGLE_COMPONENT_SELECTION", componentId: component.id })

          // After toggling, get the updated selection
          const updatedSelection = state.selectedComponentIds.includes(component.id)
            ? [...state.selectedComponentIds, component.id]
            : state.selectedComponentIds.filter((id) => id !== component.id)

          // Store positions of all selected components
          updatedSelection.forEach((id) => {
            const comp = state.currentConfig.components.find((c) => c.id === id)
            if (comp) {
              startPositions[id] = [...comp.position]
            }
          })
        } else {
          // Single select mode
          dispatch({ type: "SET_SELECTED_COMPONENT", componentId: component.id })
          startPositions[component.id] = [...component.position]
        }

        setSelectedComponentsStartPos(startPositions)

        // Set up interaction state
        setInteraction({
          ...interaction,
          isDragging: !e.shiftKey,
          isRotating: e.shiftKey,
          isSelecting: false,
          dragStartPos: { x, y },
          componentStartPos: [...component.position],
          dragOffset: { x: 0, y: 0 },
          hasMoved: false,
        })

        // Change cursor
        if (canvasRef.current) {
          canvasRef.current.style.cursor = e.shiftKey ? "grab" : "grabbing"
        }
      } else {
        // Start selection box if clicking on empty space
        if (!e.ctrlKey && !e.metaKey) {
          dispatch({ type: "CLEAR_SELECTION" })
        }

        setInteraction({
          ...interaction,
          isSelecting: true,
          isDragging: false,
          isRotating: false,
          selectionStart: { x, y },
          selectionEnd: { x, y },
          hasMoved: false,
        })

        setConnectingFrom(null)
      }
    },
    [
      currentMode,
      measurementPoints,
      addMeasurement,
      findConnectionPointAtPosition,
      findComponentAtPosition,
      connectingFrom,
      dispatch,
      interaction,
      state.selectedComponentIds,
      state.currentConfig.components,
    ],
  )

  // Handle mouse move with smooth interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Update hover point for measurement mode
      if (currentMode === "measure" && measurementPoints.length === 0) {
        setHoverPoint({ x, y })
      }

      // Update hover state
      const hoveredComp = findComponentAtPosition(x, y)
      setHoveredComponent(hoveredComp?.id || null)

      // Handle cursor changes
      if (!interaction.isDragging && !interaction.isRotating && !interaction.isSelecting) {
        const connectionPoint = findConnectionPointAtPosition(x, y)
        if (connectionPoint || connectingFrom) {
          canvasRef.current.style.cursor = "crosshair"
        } else if (hoveredComp) {
          canvasRef.current.style.cursor = "pointer"
        } else if (currentMode === "measure") {
          canvasRef.current.style.cursor = "crosshair"
        } else {
          canvasRef.current.style.cursor = "default"
        }
      }

      // Handle selection box
      if (interaction.isSelecting) {
        setInteraction((prev) => ({
          ...prev,
          selectionEnd: { x, y },
          hasMoved: true,
        }))
      }

      // Handle dragging
      if (interaction.isDragging) {
        const deltaX = x - interaction.dragStartPos.x
        const deltaY = y - interaction.dragStartPos.y

        // Mark as moved if significant movement
        if (!interaction.hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
          setInteraction((prev) => ({ ...prev, hasMoved: true }))
        }

        // Convert delta to world coordinates
        const [worldDeltaX, worldDeltaZ] = canvasToWorld(deltaX, deltaY)
        const [originX, originZ] = canvasToWorld(0, 0)

        const actualDeltaX = worldDeltaX - originX
        const actualDeltaZ = worldDeltaZ - originZ

        // Move all selected components
        if (state.selectedComponentIds.length > 0) {
          state.selectedComponentIds.forEach((componentId) => {
            const startPos = selectedComponentsStartPos[componentId]
            if (startPos) {
              let newX = startPos[0] + actualDeltaX
              let newZ = startPos[2] + actualDeltaZ

              // Apply snap to grid if enabled
              if (snapToGrid) {
                newX = Math.round(newX / gridSize) * gridSize
                newZ = Math.round(newZ / gridSize) * gridSize
              }

              dispatch({
                type: "UPDATE_COMPONENT",
                componentId,
                updates: { position: [newX, startPos[1], newZ] },
              })
            }
          })
        }
      }

      // Handle rotation
      if (interaction.isRotating && state.selectedComponentId) {
        const component = state.currentConfig.components.find((c) => c.id === state.selectedComponentId)
        if (component) {
          const [cx, cy] = worldToCanvas(component.position[0], component.position[2])

          // Calculate angle from component center to mouse position
          const dx = x - cx
          const dy = y - cy
          const angle = Math.atan2(dy, dx)

          // Mark as moved
          if (!interaction.hasMoved) {
            setInteraction((prev) => ({ ...prev, hasMoved: true }))
          }

          // Update rotation
          dispatch({
            type: "UPDATE_COMPONENT",
            componentId: state.selectedComponentId,
            updates: { rotation: [component.rotation[0], angle, component.rotation[2]] },
          })
        }
      }
    },
    [
      currentMode,
      measurementPoints,
      findComponentAtPosition,
      findConnectionPointAtPosition,
      connectingFrom,
      interaction,
      state.selectedComponentId,
      state.selectedComponentIds,
      state.currentConfig.components,
      canvasToWorld,
      worldToCanvas,
      snapToGrid,
      gridSize,
      dispatch,
      selectedComponentsStartPos,
    ],
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Handle selection box completion
    if (interaction.isSelecting && interaction.hasMoved) {
      const minX = Math.min(interaction.selectionStart.x, interaction.selectionEnd.x)
      const maxX = Math.max(interaction.selectionStart.x, interaction.selectionEnd.x)
      const minY = Math.min(interaction.selectionStart.y, interaction.selectionEnd.y)
      const maxY = Math.max(interaction.selectionStart.y, interaction.selectionEnd.y)

      // Only process if we have a meaningful selection area
      if (maxX - minX > 5 && maxY - minY > 5) {
        const selectedIds: string[] = []

        // Check each component if it's within the selection box
        state.currentConfig.components.forEach((component) => {
          const [cx, cy] = worldToCanvas(component.position[0], component.position[2])
          if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
            selectedIds.push(component.id)
          }
        })

        if (selectedIds.length > 0) {
          dispatch({ type: "SET_SELECTED_COMPONENTS", componentIds: selectedIds })
        }
      }
    }

    // Reset interaction state
    setInteraction({
      isDragging: false,
      isRotating: false,
      isSelecting: false,
      dragStartPos: { x: 0, y: 0 },
      componentStartPos: [0, 0, 0],
      dragOffset: { x: 0, y: 0 },
      hasMoved: false,
      selectionStart: { x: 0, y: 0 },
      selectionEnd: { x: 0, y: 0 },
    })

    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default"
    }
  }, [interaction, state.currentConfig.components, worldToCanvas, dispatch])

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()

      const zoomFactor = 1.1
      const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor

      // Limit zoom
      if (newScale > 10 && newScale < 200) {
        setScale(newScale)
      }
    },
    [scale],
  )

  // Draw the 2D view
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match container
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid if enabled
    if (snapToGrid) {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1

      const gridPixelSize = gridSize * scale
      const startX = ((pan.x % gridPixelSize) + canvas.width / 2) % gridPixelSize
      const startY = ((pan.y % gridPixelSize) + canvas.height / 2) % gridPixelSize

      // Draw vertical grid lines
      for (let x = startX; x < canvas.width; x += gridPixelSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Draw horizontal grid lines
      for (let y = startY; y < canvas.height; y += gridPixelSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw center axes
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 2

    // X axis
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2 + pan.y)
    ctx.lineTo(canvas.width, canvas.height / 2 + pan.y)
    ctx.stroke()

    // Z axis
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2 + pan.x, 0)
    ctx.lineTo(canvas.width / 2 + pan.x, canvas.height)
    ctx.stroke()

    // Draw selection box
    if (interaction.isSelecting && interaction.hasMoved) {
      const minX = Math.min(interaction.selectionStart.x, interaction.selectionEnd.x)
      const maxX = Math.max(interaction.selectionStart.x, interaction.selectionEnd.x)
      const minY = Math.min(interaction.selectionStart.y, interaction.selectionEnd.y)
      const maxY = Math.max(interaction.selectionStart.y, interaction.selectionEnd.y)

      ctx.strokeStyle = "#3b82f6"
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      ctx.setLineDash([])
    }

    // Draw measurements
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 2

    measurements.forEach((measurement) => {
      ctx.beginPath()
      ctx.moveTo(measurement.start.x, measurement.start.y)
      ctx.lineTo(measurement.end.x, measurement.end.y)
      ctx.stroke()

      // Draw measurement points
      ctx.fillStyle = "#333333"
      ctx.beginPath()
      ctx.arc(measurement.start.x, measurement.start.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(measurement.end.x, measurement.end.y, 4, 0, Math.PI * 2)
      ctx.fill()

      // Draw distance label
      const midX = (measurement.start.x + measurement.end.x) / 2
      const midY = (measurement.start.y + measurement.end.y) / 2

      ctx.fillStyle = "#333333"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${measurement.distance.toFixed(2)}m`, midX, midY - 10)
    })

    // Draw current measurement in progress
    if (currentMode === "measure" && measurementPoints.length === 1 && hoverPoint) {
      ctx.strokeStyle = "#666666"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(measurementPoints[0].x, measurementPoints[0].y)
      ctx.lineTo(hoverPoint.x, hoverPoint.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw preview distance
      const distance =
        Math.sqrt(
          Math.pow(hoverPoint.x - measurementPoints[0].x, 2) + Math.pow(hoverPoint.y - measurementPoints[0].y, 2),
        ) / scale
      const midX = (measurementPoints[0].x + hoverPoint.x) / 2
      const midY = (measurementPoints[0].y + hoverPoint.y) / 2

      ctx.fillStyle = "#666666"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${distance.toFixed(2)}m`, midX, midY - 5)
    }

    // Draw first measurement point
    if (currentMode === "measure" && measurementPoints.length === 1) {
      ctx.fillStyle = "#333333"
      ctx.beginPath()
      ctx.arc(measurementPoints[0].x, measurementPoints[0].y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw hover point for measurement
    if (currentMode === "measure" && measurementPoints.length === 0 && hoverPoint) {
      ctx.fillStyle = "rgba(51, 51, 51, 0.5)"
      ctx.beginPath()
      ctx.arc(hoverPoint.x, hoverPoint.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw connections
    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 3

    for (const connection of state.currentConfig.connections) {
      const fromComponent = state.currentConfig.components.find((c) => c.id === connection.sourceId)
      const toComponent = state.currentConfig.components.find((c) => c.id === connection.targetId)

      if (fromComponent && toComponent) {
        const [fromCanvasX, fromCanvasY] = worldToCanvas(fromComponent.position[0], fromComponent.position[2])
        const [toCanvasX, toCanvasY] = worldToCanvas(toComponent.position[0], toComponent.position[2])

        ctx.beginPath()
        ctx.moveTo(fromCanvasX, fromCanvasY)

        const midX = (fromCanvasX + toCanvasX) / 2
        const midY = (fromCanvasY + toCanvasY) / 2

        ctx.quadraticCurveTo(midX, midY, toCanvasX, toCanvasY)
        ctx.stroke()
      }
    }

    // Draw components
    for (const component of state.currentConfig.components) {
      const [x, y] = worldToCanvas(component.position[0], component.position[2])

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(component.rotation[1])

      const isSelected = state.selectedComponentIds.includes(component.id)
      const isPrimary = component.id === state.selectedComponentId
      const isHovered = component.id === hoveredComponent

      if (componentImages[component.type]) {
        const { width, height } = getComponentBounds(component)

        // Draw hover highlight
        if (isHovered && !isSelected) {
          ctx.fillStyle = "#3b82f6"
          ctx.globalAlpha = 0.2
          ctx.fillRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4)
          ctx.globalAlpha = 1.0
        }

        // Draw selection highlight
        if (isSelected) {
          ctx.fillStyle = isPrimary ? "#3b82f6" : "#8b5cf6"
          ctx.globalAlpha = 0.3
          ctx.fillRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8)
          ctx.globalAlpha = 1.0
        }

        // Draw component image
        ctx.drawImage(componentImages[component.type], -width / 2, -height / 2, width, height)
      } else {
        // Fallback shape
        ctx.fillStyle = isSelected ? "#3b82f6" : isHovered ? "#6366f1" : "#6b7280"
        ctx.fillRect(-20, -20, 40, 40)
      }

      // Draw component name (only if labels are enabled)
      if (state.showLabels) {
        ctx.fillStyle = isSelected ? "#ffffff" : "#000000"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText(component.name, 0, -30)
      }

      // Draw connection points if selected
      if (isSelected) {
        const connectionPoints = getConnectionPoints(component)

        for (const point of connectionPoints) {
          const pointX = point.position[0] * scale
          const pointZ = point.position[2] * scale

          ctx.fillStyle = point.connected ? "#10b981" : "#ef4444"
          ctx.beginPath()
          ctx.arc(pointX, pointZ, 8, 0, Math.PI * 2)
          ctx.fill()

          // Add white border for better visibility
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      ctx.restore()
    }

    // Add room boundary visualization in the draw effect
    // Draw room boundaries
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 3

    const roomWidth = state.roomDimensions.width * scale
    const roomLength = state.roomDimensions.length * scale
    const centerX = canvas.width / 2 + pan.x
    const centerY = canvas.height / 2 + pan.y

    // Draw room rectangle
    ctx.strokeRect(centerX - roomWidth / 2, centerY - roomLength / 2, roomWidth, roomLength)

    // Add room dimension labels
    ctx.fillStyle = "#333333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"

    // Width label (top)
    ctx.fillText(`${state.roomDimensions.width}m`, centerX, centerY - roomLength / 2 - 10)

    // Length label (right)
    ctx.save()
    ctx.translate(centerX + roomWidth / 2 + 20, centerY)
    ctx.rotate(Math.PI / 2)
    ctx.fillText(`${state.roomDimensions.length}m`, 0, 0)
    ctx.restore()
  }, [
    state.currentConfig.components,
    state.currentConfig.connections,
    state.selectedComponentId,
    state.selectedComponentIds,
    state.showLabels,
    componentImages,
    scale,
    pan,
    snapToGrid,
    gridSize,
    connectingFrom,
    hoveredComponent,
    interaction,
    measurements,
    measurementPoints,
    hoverPoint,
    currentMode,
    worldToCanvas,
    getConnectionPoints,
    getComponentBounds,
    state.roomDimensions,
  ])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.clientWidth
        canvasRef.current.height = canvasRef.current.clientHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Get mode display name safely
  const getModeDisplayName = (mode: string) => {
    if (!mode) return "Select"
    return mode.charAt(0).toUpperCase() + mode.slice(1)
  }

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={() => setScale(scale * 1.2)}
        >
          +
        </button>
        <div className="text-sm">{Math.round((scale / 50) * 100)}%</div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={() => setScale(scale / 1.2)}
        >
          -
        </button>
      </div>

      {/* Draggable Instructions Window */}
      {showInstructions && (
        <DraggableWindow
          title="Instructions"
          initialPosition={{ x: 20, y: 20 }}
          onClose={() => setShowInstructions(false)}
        >
          <div className="text-sm text-gray-700">
            <div className="font-medium mb-2">{getModeDisplayName(currentMode)} Mode Active</div>
            {currentMode === "select" && (
              <>
                <div>• Click: Select components</div>
                <div>• Ctrl+Click: Multi-select</div>
                <div>• Drag empty space: Selection box</div>
              </>
            )}
            {currentMode === "move" && (
              <>
                <div>• Select a component first</div>
                <div>• Drag to move components</div>
                <div>• Use arrow keys for precision</div>
              </>
            )}
            {currentMode === "rotate" && (
              <>
                <div>• Select a component first</div>
                <div>• Shift+Drag to rotate</div>
                <div>• Use Q/E keys for quick rotation</div>
              </>
            )}
            {currentMode === "measure" && (
              <>
                <div>• Click first point to start</div>
                <div>• Click second point to measure</div>
                <div>• Distance shown in meters</div>
              </>
            )}
          </div>
        </DraggableWindow>
      )}

      {/* Draggable Measurements Window */}
      {showMeasurements && measurements.length > 0 && (
        <DraggableWindow
          title="Measurements"
          initialPosition={{ x: 20, y: 200 }}
          onClose={() => setShowMeasurements(false)}
          className="max-w-sm"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">Total: {measurements.length} measurements</span>
              <button
                onClick={clearAllMeasurements}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    Measurement {index + 1}: <strong>{measurement.distance.toFixed(2)}m</strong>
                  </span>
                  <button
                    onClick={() => removeMeasurement(measurement.id)}
                    className="text-gray-500 hover:text-red-500 p-1"
                    title="Remove measurement"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DraggableWindow>
      )}

      {/* Connection in progress indicator */}
      {connectingFrom && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 px-3 py-1 rounded text-sm">
          {t("clickConnectionPoint")}
        </div>
      )}
    </div>
  )
}
