"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface SnapPointProps {
  id: string
  type: string
  name: string
  position: [number, number, number]
}

interface ComponentSnapPointProps {
  position: [number, number, number]
  snapPoint: SnapPointProps
  isActive: boolean
  onClick?: (e: any) => void
  onPointerOver?: (e: any) => void
  onPointerOut?: (e: any) => void
}

export function ComponentSnapPoint({
  position,
  snapPoint,
  isActive,
  onClick,
  onPointerOver,
  onPointerOut,
}: ComponentSnapPointProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Get color based on snap point type
  const getSnapPointColor = (type: string) => {
    switch (type) {
      case "power":
        return "#ef4444" // red
      case "mechanical":
        return "#3b82f6" // blue
      case "data":
        return "#10b981" // green
      case "track":
        return "#8b5cf6" // purple
      case "mounting":
        return "#f97316" // orange
      case "accessory":
        return "#6b7280" // gray
      default:
        return "#6b7280" // gray
    }
  }

  const color = getSnapPointColor(snapPoint.type)
  const baseSize = 0.08  // Larger for better visibility and clicking
  const size = isActive ? baseSize * 1.5 : hovered ? baseSize * 1.2 : baseSize

  // Pulse animation for active snap points
  useFrame(({ clock }) => {
    if (meshRef.current && isActive) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.3
      meshRef.current.scale.setScalar(scale)
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1)
    }

    // Subtle rotation for the ring
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.005
    }
  })

  // Handle hover state
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
    if (onPointerOver) {
      onPointerOver(e)
    }
  }

  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "default"
    if (onPointerOut) {
      onPointerOut(e)
    }
  }

  // Handle click
  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <group position={position}>
      {/* Main snap point sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        userData={{ snapPointId: snapPoint.id, type: "snapPoint" }}
        renderOrder={1000} // Ensure snap points render on top
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isActive || hovered ? color : "#000000"}
          emissiveIntensity={isActive ? 0.6 : hovered ? 0.4 : 0}
          transparent
          opacity={0.8}
          depthTest={true} // Enable proper depth testing for better component interaction
        />
      </mesh>

      {/* Outer ring for better visibility */}
      <mesh
        ref={ringRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        userData={{ snapPointId: snapPoint.id, type: "snapPoint" }}
        renderOrder={999} // Just below the main sphere
      >
        <ringGeometry args={[size * 1.2, size * 1.5, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.5 : hovered ? 0.3 : 0.2}
          side={THREE.DoubleSide}
          depthTest={true} // Enable proper depth testing for better component interaction
        />
      </mesh>
    </group>
  )
}
