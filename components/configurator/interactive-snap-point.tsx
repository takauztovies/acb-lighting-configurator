"use client"

import { useState, useRef } from "react"
import { Html } from "@react-three/drei"
import { useConfigurator } from "./configurator-context"
import type * as THREE from "three"
import { Plus, Zap, Link, Settings } from "lucide-react"

interface InteractiveSnapPointProps {
  position: [number, number, number]
  snapPoint: {
    id: string
    name: string
    type: "power" | "mechanical" | "data" | "track" | "mounting" | "accessory"
    compatibleComponents?: string[]
  }
  componentId: string
  onComponentAdd: (componentType: string, snapPointId: string) => void
  isActive?: boolean
  showCompatibleComponents?: boolean
}

export function InteractiveSnapPoint({
  position,
  snapPoint,
  componentId,
  onComponentAdd,
  isActive = false,
  showCompatibleComponents = false,
}: InteractiveSnapPointProps) {
  const { state } = useConfigurator()
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  // Get compatible components for this snap point
  const getCompatibleComponents = () => {
    if (!snapPoint.compatibleComponents) return []

    return state.availableComponents.filter((component) => snapPoint.compatibleComponents?.includes(component.type))
  }

  const compatibleComponents = getCompatibleComponents()

  // Get color based on snap point type
  const getSnapPointColor = () => {
    switch (snapPoint.type) {
      case "power":
        return "#ff6b35" // Orange for power
      case "mechanical":
        return "#3b82f6" // Blue for mechanical
      case "data":
        return "#10b981" // Green for data
      case "track":
        return "#8b5cf6" // Purple for track
      case "mounting":
        return "#f59e0b" // Yellow for mounting
      case "accessory":
        return "#ef4444" // Red for accessory
      default:
        return "#6b7280" // Gray for unknown
    }
  }

  // Get icon based on snap point type
  const getSnapPointIcon = () => {
    switch (snapPoint.type) {
      case "power":
        return <Zap className="h-3 w-3" />
      case "mechanical":
      case "track":
        return <Link className="h-3 w-3" />
      case "mounting":
      case "accessory":
        return <Settings className="h-3 w-3" />
      default:
        return <Plus className="h-3 w-3" />
    }
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (compatibleComponents.length === 1) {
      // If only one compatible component, add it directly
      onComponentAdd(compatibleComponents[0].type, snapPoint.id)
    } else if (compatibleComponents.length > 1) {
      // If multiple compatible components, show menu
      setShowMenu(true)
    }
  }

  const handleComponentSelect = (componentType: string) => {
    onComponentAdd(componentType, snapPoint.id)
    setShowMenu(false)
  }

  return (
    <group position={position}>
      {/* Snap point visual */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[isActive || isHovered ? 0.08 : 0.06, 16, 16]} />
        <meshBasicMaterial color={getSnapPointColor()} transparent opacity={isActive ? 1.0 : isHovered ? 0.9 : 0.7} />
      </mesh>

      {/* Glow effect for active snap points */}
      {(isActive || isHovered) && (
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={getSnapPointColor()} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Pulse animation for available snap points */}
      {compatibleComponents.length > 0 && !isActive && (
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={getSnapPointColor()} transparent opacity={0.2} />
        </mesh>
      )}

      {/* Snap point label and info */}
      {(isHovered || showCompatibleComponents) && (
        <Html position={[0, 0.2, 0]} center>
          <div className="bg-white rounded-lg shadow-lg border p-2 text-xs min-w-max">
            <div className="flex items-center gap-2 mb-1">
              {getSnapPointIcon()}
              <span className="font-medium">{snapPoint.name}</span>
            </div>
            <div className="text-gray-600 mb-2">Type: {snapPoint.type}</div>

            {compatibleComponents.length > 0 && <div className="text-gray-900 text-xs">Click to add component</div>}

            {compatibleComponents.length === 0 && <div className="text-gray-500 text-xs">No compatible components</div>}
          </div>
        </Html>
      )}

      {/* Component selection menu */}
      {showMenu && compatibleComponents.length > 1 && (
        <Html position={[0, 0.3, 0]} center>
          <div className="bg-white rounded-lg shadow-lg border p-3 min-w-max max-w-xs">
            <div className="font-medium mb-2 text-sm">Add Component</div>
            <div className="space-y-2">
              {compatibleComponents.map((component) => (
                <button
                  key={component.id}
                  onClick={() => handleComponentSelect(component.type)}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img src={component.image || "/placeholder.svg"} alt={component.name} className="w-8 h-8 rounded" />
                    <div>
                      <div className="font-medium text-sm">{component.name}</div>
                      <div className="text-xs text-gray-500">€{component.price}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
