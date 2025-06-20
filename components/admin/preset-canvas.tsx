"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Html, TransformControls } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Move, RotateCw, Trash2, Camera, Grid3X3, Copy, Undo2, Redo2, MousePointer } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ComponentData } from "@/lib/database"
import { db } from "@/lib/database"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import * as THREE from "three"

interface PresetCanvasProps {
  components: ComponentData[]
  roomDimensions: { width: number; length: number; height: number }
  initialComponents?: { componentId: string; position: [number, number, number]; rotation: [number, number, number] }[]
  onUpdate: (
    components: { componentId: string; position: [number, number, number]; rotation: [number, number, number] }[],
    previewImage?: string,
  ) => void
}

interface CanvasComponent {
  id: string
  componentId: string
  position: [number, number, number]
  rotation: [number, number, number]
}

export function PresetCanvas({ components, roomDimensions, initialComponents = [], onUpdate }: PresetCanvasProps) {
  const safeComponents = components || []
  const [canvasComponents, setCanvasComponents] = useState<CanvasComponent[]>(
    initialComponents.map((comp, index) => ({
      id: `canvas-${index}`,
      componentId: comp.componentId,
      position: comp.position,
      rotation: comp.rotation,
    })),
  )
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([])
  const [mode, setMode] = useState<"select" | "move" | "rotate">("select")
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [draggedComponent, setDraggedComponent] = useState<ComponentData | null>(null)
  const [history, setHistory] = useState<CanvasComponent[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isTransforming, setIsTransforming] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const orbitControlsRef = useRef<any>(null)

  // Re-enable orbit controls when not transforming
  useEffect(() => {
    if (orbitControlsRef.current && !isTransforming) {
      orbitControlsRef.current.enabled = true
    }
  }, [isTransforming])

  // Save state to history for undo/redo
  const saveToHistory = useCallback(
    (newComponents: CanvasComponent[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push([...newComponents])
        return newHistory.slice(-20) // Keep last 20 states
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 19))
    },
    [historyIndex],
  )

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setCanvasComponents([...history[historyIndex - 1]])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setCanvasComponents([...history[historyIndex + 1]])
    }
  }, [history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "z":
            event.preventDefault()
            if (event.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case "c":
            if (selectedComponentIds.length > 0) {
              event.preventDefault()
              copySelectedComponents()
            }
            break
          case "v":
            event.preventDefault()
            pasteComponents()
            break
        }
      } else if (event.key === "Delete" && selectedComponentIds.length > 0) {
        removeSelectedComponents()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedComponentIds, undo, redo])

  // Debounced update
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      const componentData = canvasComponents.map((comp) => ({
        componentId: comp.componentId,
        position: comp.position,
        rotation: comp.rotation,
      }))
      onUpdate(componentData)
    }, 300)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [canvasComponents, onUpdate])

  // Add component with better positioning
  const addComponent = useCallback(
    (componentId: string, position?: [number, number, number]) => {
      const newComponent: CanvasComponent = {
        id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId,
        position: position || [0, 0.5, 0],
        rotation: [0, 0, 0],
      }

      setCanvasComponents((prev) => {
        const newComponents = [...prev, newComponent]
        saveToHistory(newComponents)
        return newComponents
      })
      setSelectedComponentIds([newComponent.id])
    },
    [saveToHistory],
  )

  // Remove selected components
  const removeSelectedComponents = useCallback(() => {
    setCanvasComponents((prev) => {
      const newComponents = prev.filter((comp) => !selectedComponentIds.includes(comp.id))
      saveToHistory(newComponents)
      return newComponents
    })
    setSelectedComponentIds([])
  }, [selectedComponentIds, saveToHistory])

  // Copy/Paste functionality
  const [copiedComponents, setCopiedComponents] = useState<CanvasComponent[]>([])

  const copySelectedComponents = useCallback(() => {
    const selected = canvasComponents.filter((comp) => selectedComponentIds.includes(comp.id))
    setCopiedComponents(selected)
  }, [canvasComponents, selectedComponentIds])

  const pasteComponents = useCallback(() => {
    if (copiedComponents.length === 0) return

    const newComponents = copiedComponents.map((comp) => ({
      ...comp,
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: [comp.position[0] + 1, comp.position[1], comp.position[2]] as [number, number, number],
    }))

    setCanvasComponents((prev) => {
      const updated = [...prev, ...newComponents]
      saveToHistory(updated)
      return updated
    })
    setSelectedComponentIds(newComponents.map((comp) => comp.id))
  }, [copiedComponents, saveToHistory])

  // Update component position
  const updateComponentPosition = useCallback((componentId: string, position: [number, number, number]) => {
    setCanvasComponents((prev) => prev.map((comp) => (comp.id === componentId ? { ...comp, position } : comp)))
  }, [])

  // Update component rotation
  const updateComponentRotation = useCallback((componentId: string, rotation: [number, number, number]) => {
    setCanvasComponents((prev) => prev.map((comp) => (comp.id === componentId ? { ...comp, rotation } : comp)))
  }, [])

  // Handle drag and drop
  const handleDragStart = (component: ComponentData) => {
    setDraggedComponent(component)
  }

  const handleDragEnd = () => {
    setDraggedComponent(null)
  }

  const handleCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (!draggedComponent) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const z = ((event.clientY - rect.top) / rect.height) * 2 - 1

    // Convert screen coordinates to world coordinates (simplified)
    const worldX = x * 5
    const worldZ = -z * 5

    addComponent(draggedComponent.id, [worldX, 0.5, worldZ])
    setDraggedComponent(null)
  }

  const capturePreview = useCallback(() => {
    if (canvasRef.current) {
      try {
        const canvas = canvasRef.current
        const dataURL = canvas.toDataURL("image/png", 0.8)
        const componentData = canvasComponents.map((comp) => ({
          componentId: comp.componentId,
          position: comp.position,
          rotation: comp.rotation,
        }))
        onUpdate(componentData, dataURL)
        alert("Preview image captured!")
      } catch (error) {
        console.error("Error capturing preview:", error)
        alert("Error capturing preview image")
      }
    }
  }, [canvasComponents, onUpdate])

  const primarySelected = selectedComponentIds[0]

  return (
    <div className="flex h-96">
      {/* Enhanced Component Library Sidebar */}
      <div className="w-64 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4">
          <h4 className="font-medium mb-3">Component Library</h4>
          <p className="text-xs text-gray-500 mb-3">Drag components to canvas or double-click to add</p>

          <div className="space-y-2">
            {safeComponents.length === 0 ? (
              <p className="text-xs text-gray-500">No components available</p>
            ) : (
              safeComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-3 border rounded bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors group"
                  draggable
                  onDragStart={() => handleDragStart(component)}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => addComponent(component.id)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={component.image || "/placeholder.svg?height=32&width=32&text=" + component.type}
                      alt={component.name}
                      className="w-8 h-8 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{component.name}</p>
                      <p className="text-xs text-gray-500">€{component.price}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addComponent(component.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced 3D Canvas */}
      <div className="flex-1 relative" onDrop={handleCanvasDrop} onDragOver={(e) => e.preventDefault()}>
        {/* Enhanced Toolbar with Tooltips */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-3 mb-3">
            <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as any)}>
              <ToggleGroupItem
                value="select"
                size="sm"
                title="Select Mode - Click to select components"
                aria-label="Select Mode"
              >
                <MousePointer className="w-3 h-3" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="move"
                size="sm"
                title="Move Mode - Drag to move selected components"
                aria-label="Move Mode"
              >
                <Move className="w-3 h-3" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="rotate"
                size="sm"
                title="Rotate Mode - Drag to rotate selected components"
                aria-label="Rotate Mode"
              >
                <RotateCw className="w-3 h-3" />
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="w-px h-6 bg-gray-300" />

            <Button
              size="sm"
              variant={snapToGrid ? "default" : "outline"}
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Toggle snap to grid"
              aria-label="Toggle snap to grid"
            >
              <Grid3X3 className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant={showGrid ? "default" : "outline"}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle grid visibility"
              aria-label="Toggle grid visibility"
            >
              <span className="text-xs">Grid</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo last action"
              aria-label="Undo"
            >
              <Undo2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo last action"
              aria-label="Redo"
            >
              <Redo2 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copySelectedComponents}
              disabled={selectedComponentIds.length === 0}
              title="Copy selected components"
              aria-label="Copy"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={capturePreview}
              title="Capture preview image"
              aria-label="Capture preview"
            >
              <Camera className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={showLabels ? "default" : "outline"}
              onClick={() => setShowLabels(!showLabels)}
              title={showLabels ? "Hide component labels" : "Show component labels"}
              aria-label="Toggle labels"
            >
              <span className="text-xs">Labels</span>
            </Button>
          </div>

          {/* Mode Instructions */}
          {mode === "rotate" && selectedComponentIds.length === 0 && (
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              Select a component first, then drag the rotation rings to rotate it
            </div>
          )}

          {mode === "rotate" && selectedComponentIds.length > 0 && (
            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              Drag the rotation rings around the selected component to rotate it
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedComponentIds.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 rounded-lg shadow-lg p-3 text-sm">
            <div className="font-medium">
              {selectedComponentIds.length} component{selectedComponentIds.length > 1 ? "s" : ""} selected
            </div>
            <div className="text-xs text-gray-500 mt-1">Delete: Del key • Copy: Ctrl+C • Paste: Ctrl+V</div>
            {mode === "rotate" && (
              <div className="text-xs text-blue-600 mt-1">Rotation mode active - drag the rings to rotate</div>
            )}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {draggedComponent && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="text-lg font-medium text-blue-600">Drop to add {draggedComponent.name}</div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <Canvas ref={canvasRef} camera={{ position: [5, 5, 5], fov: 75 }} shadows>
          {/* Enhanced lighting setup matching snap points editor */}
          <Environment preset="city" />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <hemisphereLight intensity={0.3} />

          {/* Room boundaries */}
          <RoomBoundaries dimensions={roomDimensions} />

          {/* Grid with proper visibility control */}
          {showGrid && <gridHelper args={[20, 20, "#888888", "#cccccc"]} position={[0, 0, 0]} />}

          {/* Selection Box */}
          <SelectionBox
            onSelectionChange={setSelectedComponentIds}
            components={canvasComponents}
            enabled={mode === "select" && !isTransforming}
          />

          {/* Components */}
          {canvasComponents.map((component) => (
            <EnhancedCanvasComponent3D
              key={component.id}
              component={component}
              componentData={safeComponents.find((c) => c.id === component.componentId)}
              isSelected={selectedComponentIds.includes(component.id)}
              isPrimary={component.id === primarySelected}
              onSelect={(ctrlKey) => {
                if (ctrlKey) {
                  setSelectedComponentIds((prev) =>
                    prev.includes(component.id) ? prev.filter((id) => id !== component.id) : [...prev, component.id],
                  )
                } else {
                  setSelectedComponentIds([component.id])
                }
              }}
              onPositionChange={updateComponentPosition}
              onRotationChange={updateComponentRotation}
              onTransformStart={() => setIsTransforming(true)}
              onTransformEnd={() => setIsTransforming(false)}
              snapToGrid={snapToGrid}
              mode={mode}
              showLabel={showLabels}
              orbitControlsRef={orbitControlsRef}
            />
          ))}

          <OrbitControls
            ref={orbitControlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Enhanced Properties Panel */}
        {selectedComponentIds.length === 1 && (
          <ComponentPropertiesPanel
            component={canvasComponents.find((c) => c.id === primarySelected)!}
            componentData={safeComponents.find(
              (c) => c.id === canvasComponents.find((comp) => comp.id === primarySelected)?.componentId,
            )}
            onPositionChange={updateComponentPosition}
            onRotationChange={updateComponentRotation}
            onRemove={() => removeSelectedComponents()}
          />
        )}

        {/* Multi-selection Panel */}
        {selectedComponentIds.length > 1 && (
          <div className="absolute bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">{selectedComponentIds.length} Components Selected</h4>
              <Button size="sm" variant="outline" onClick={removeSelectedComponents}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button size="sm" className="w-full" onClick={copySelectedComponents}>
                <Copy className="w-3 h-3 mr-2" />
                Copy Selection
              </Button>
              <div className="text-xs text-gray-500">Use arrow keys to move all selected components together</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Selection Box Component (same as before but with transform check)
function SelectionBox({
  onSelectionChange,
  components,
  enabled,
}: {
  onSelectionChange: (ids: string[]) => void
  components: CanvasComponent[]
  enabled: boolean
}) {
  const { camera, gl } = useThree()
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled) return

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return

      const rect = gl.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setStartPoint({ x, y })
      setEndPoint({ x, y })
      setIsSelecting(true)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isSelecting) return

      const rect = gl.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setEndPoint({ x, y })
    }

    const handleMouseUp = () => {
      if (!isSelecting) return
      setIsSelecting(false)

      const rect = gl.domElement.getBoundingClientRect()
      const minX = Math.min(startPoint.x, endPoint.x)
      const maxX = Math.max(startPoint.x, endPoint.x)
      const minY = Math.min(startPoint.y, endPoint.y)
      const maxY = Math.max(startPoint.y, endPoint.y)

      if (Math.abs(maxX - minX) < 5 || Math.abs(maxY - minY) < 5) {
        return
      }

      const selectedIds: string[] = []
      components.forEach((component) => {
        const vector = new THREE.Vector3(...component.position)
        vector.project(camera)

        const screenX = (vector.x * 0.5 + 0.5) * rect.width
        const screenY = (vector.y * -0.5 + 0.5) * rect.height

        if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
          selectedIds.push(component.id)
        }
      })

      onSelectionChange(selectedIds)
    }

    gl.domElement.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [enabled, isSelecting, startPoint, endPoint, components, camera, gl, onSelectionChange])

  if (!isSelecting) return null

  const left = Math.min(startPoint.x, endPoint.x)
  const top = Math.min(startPoint.y, endPoint.y)
  const width = Math.abs(endPoint.x - startPoint.x)
  const height = Math.abs(endPoint.y - startPoint.y)

  return (
    <Html fullscreen>
      <div
        style={{
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          border: "2px dashed #4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />
    </Html>
  )
}

// Component Properties Panel (same as before)
function ComponentPropertiesPanel({
  component,
  componentData,
  onPositionChange,
  onRotationChange,
  onRemove,
}: {
  component: CanvasComponent
  componentData?: ComponentData
  onPositionChange: (id: string, position: [number, number, number]) => void
  onRotationChange: (id: string, rotation: [number, number, number]) => void
  onRemove: () => void
}) {
  return (
    <div className="absolute bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg p-4 z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">{componentData?.name || "Component"}</h4>
        <Button size="sm" variant="outline" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Position (X, Y, Z)</Label>
          <div className="grid grid-cols-3 gap-1">
            {component.position.map((value, index) => (
              <Input
                key={index}
                type="number"
                step="0.1"
                value={value.toFixed(1)}
                onChange={(e) => {
                  const newPosition = [...component.position] as [number, number, number]
                  newPosition[index] = Number.parseFloat(e.target.value)
                  onPositionChange(component.id, newPosition)
                }}
                className="h-7 text-xs"
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Rotation (degrees)</Label>
          <div className="grid grid-cols-3 gap-1">
            {component.rotation.map((value, index) => (
              <Input
                key={index}
                type="number"
                step="15"
                value={Math.round((value * 180) / Math.PI)}
                onChange={(e) => {
                  const newRotation = [...component.rotation] as [number, number, number]
                  newRotation[index] = (Number.parseFloat(e.target.value) * Math.PI) / 180
                  onRotationChange(component.id, newRotation)
                }}
                className="h-7 text-xs"
              />
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <div className="font-medium mb-1">Quick Controls:</div>
          <div>• Drag to move in 3D space</div>
          <div>• Ctrl+Click for multi-select</div>
          <div>• Arrow keys for precise movement</div>
        </div>
      </div>
    </div>
  )
}

// Room Boundaries Component (unchanged)
function RoomBoundaries({ dimensions }: { dimensions: { width: number; length: number; height: number } }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dimensions.width, dimensions.length]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.length)]}
        />
        <lineBasicMaterial color="#cccccc" />
      </lineSegments>
      <mesh position={[0, dimensions.height / 2, 0]}>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshBasicMaterial color="#e5e7eb" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// Enhanced 3D Component with better interaction (same as before but with transform callbacks)
function EnhancedCanvasComponent3D({
  component,
  componentData,
  isSelected,
  isPrimary,
  onSelect,
  onPositionChange,
  onRotationChange,
  onTransformStart,
  onTransformEnd,
  snapToGrid,
  mode,
  showLabel = true,
  orbitControlsRef,
}: {
  component: CanvasComponent
  componentData?: ComponentData
  isSelected: boolean
  isPrimary: boolean
  onSelect: (ctrlKey: boolean) => void
  onPositionChange: (componentId: string, position: [number, number, number]) => void
  onRotationChange: (componentId: string, rotation: [number, number, number]) => void
  onTransformStart: () => void
  onTransformEnd: () => void
  snapToGrid: boolean
  mode: "select" | "move" | "rotate"
  showLabel?: boolean
  orbitControlsRef: React.RefObject<any>
}) {
  const meshRef = useRef<THREE.Group>(null!)
  const transformRef = useRef<any>(null)
  const [hovered, setHovered] = useState(false)
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [isLoadingModel, setIsLoadingModel] = useState(false)

  const safeComponentData = componentData || {
    type: "track" as const,
    name: "Unknown Component",
  }

  // Model loading logic (same as before)
  useEffect(() => {
    const resolveModelUrl = async () => {
      if (componentData?.model3d) {
        try {
          if (componentData.model3d.startsWith("db://")) {
            const fileId = componentData.model3d.replace("db://", "")
            const file = await db.getFile(fileId)
            if (file && file.data && file.data.startsWith("data:")) {
              const response = await fetch(file.data)
              const blob = await response.blob()
              const blobUrl = URL.createObjectURL(blob)
              setModelUrl(blobUrl)
            }
          } else {
            setModelUrl(componentData.model3d)
          }
        } catch (error) {
          console.error(`Failed to resolve model URL:`, error)
        }
      }
    }
    resolveModelUrl()
  }, [componentData])

  useEffect(() => {
    if (!modelUrl) {
      setLoadedModel(null)
      setIsLoadingModel(false)
      return
    }

    setIsLoadingModel(true)
    const loader = new OBJLoader()

    loader.load(
      modelUrl,
      (object) => {
        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3())
        const maxDimension = Math.max(size.x, size.y, size.z)

        if (maxDimension > 0) {
          const scale = 1 / maxDimension
          object.scale.setScalar(scale)
          const center = box.getCenter(new THREE.Vector3())
          object.position.sub(center.multiplyScalar(scale))
        }

        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: getComponentColor(safeComponentData.type),
              metalness: 0.1,
              roughness: 0.8,
              side: THREE.DoubleSide, // Better visibility from all angles
            })
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        setLoadedModel(object)
        setIsLoadingModel(false)
      },
      undefined,
      (error) => {
        console.error(`Error loading 3D model:`, error)
        setIsLoadingModel(false)
        if (modelUrl && modelUrl.startsWith("blob:")) {
          URL.revokeObjectURL(modelUrl)
        }
      },
    )

    return () => {
      if (modelUrl && modelUrl.startsWith("blob:")) {
        URL.revokeObjectURL(modelUrl)
      }
    }
  }, [modelUrl, safeComponentData.type])

  const getComponentGeometry = () => {
    switch (safeComponentData.type) {
      case "track":
        return <boxGeometry args={[2, 0.1, 0.1]} />
      case "spotlight":
        return <coneGeometry args={[0.2, 0.5, 8]} />
      case "connector":
        return <boxGeometry args={[0.2, 0.2, 0.2]} />
      case "power-supply":
        return <boxGeometry args={[0.8, 0.4, 0.6]} />
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />
    }
  }

  const getComponentColor = (type: string): string => {
    switch (type) {
      case "track":
        return isSelected ? "#4f46e5" : hovered ? "#6366f1" : "#6b7280"
      case "spotlight":
        return isSelected ? "#f59e0b" : hovered ? "#fbbf24" : "#fcd34d"
      case "connector":
        return isSelected ? "#10b981" : hovered ? "#34d399" : "#6ee7b7"
      case "power-supply":
        return isSelected ? "#ef4444" : hovered ? "#f87171" : "#fca5a5"
      default:
        return isSelected ? "#8b5cf6" : hovered ? "#a78bfa" : "#c4b5fd"
    }
  }

  return (
    <group ref={meshRef} position={component.position} rotation={component.rotation}>
      {/* Main component mesh with larger click area */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)
        }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = "pointer"
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = "default"
        }}
        castShadow
        receiveShadow
      >
        {/* Invisible larger geometry for easier clicking */}
        <boxGeometry args={[2.5, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Actual visual component */}
      {loadedModel ? (
        <primitive object={loadedModel.clone()} />
      ) : (
        <mesh castShadow receiveShadow>
          {getComponentGeometry()}
          <meshStandardMaterial
            color={getComponentColor(safeComponentData.type)}
            emissive={isSelected ? "#222222" : hovered ? "#111111" : "#000000"}
          />
        </mesh>
      )}

      {/* Selection outline */}
      {isSelected && (
        <mesh>
          {loadedModel ? <boxGeometry args={[1.2, 1.2, 1.2]} /> : getComponentGeometry()}
          <meshBasicMaterial color="#4f46e5" wireframe transparent opacity={0.8} />
        </mesh>
      )}

      {/* Transform controls for primary selection */}
      {isPrimary && mode === "move" && (
        <TransformControls
          ref={transformRef}
          object={meshRef as any}
          mode="translate"
          onMouseDown={() => {
            onTransformStart()
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = false
            }
          }}
          onMouseUp={() => {
            onTransformEnd()
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true
            }
          }}
          onObjectChange={() => {
            if (meshRef.current) {
              const position = meshRef.current.position.toArray() as [number, number, number]
              if (snapToGrid) {
                position[0] = Math.round(position[0] / 0.5) * 0.5
                position[1] = Math.round(position[1] / 0.25) * 0.25
                position[2] = Math.round(position[2] / 0.5) * 0.5
              }
              onPositionChange(component.id, position)
            }
          }}
        />
      )}

      {isPrimary && mode === "rotate" && (
        <TransformControls
          ref={transformRef}
          object={meshRef as any}
          mode="rotate"
          onMouseDown={() => {
            onTransformStart()
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = false
            }
          }}
          onMouseUp={() => {
            onTransformEnd()
            if (orbitControlsRef.current) {
              orbitControlsRef.current.enabled = true
            }
          }}
          onObjectChange={() => {
            if (meshRef.current) {
              const rotation = meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number]
              onRotationChange(component.id, rotation)
            }
          }}
        />
      )}

      {/* Component label */}
      {showLabel && (
        <Html position={[0, 1, 0]} center distanceFactor={10}>
          <div
            className={`px-2 py-1 rounded shadow text-xs border-2 transition-all pointer-events-none ${
              isSelected
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : hovered
                  ? "border-gray-400 bg-white"
                  : "border-gray-300 bg-white"
            }`}
          >
            {safeComponentData?.name || "Unknown Component"}
            {isLoadingModel && " (Loading...)"}
          </div>
        </Html>
      )}

      {/* Loading indicator */}
      {isLoadingModel && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      )}
    </group>
  )
}
