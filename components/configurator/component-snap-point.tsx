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
  const baseSize = 0.03  // Minimal size as requested
  const size = isActive ? baseSize * 2.0 : hovered ? baseSize * 1.5 : baseSize

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

  // Handle click with ultra debugging
  const handleClick = (e: any) => {
    e.stopPropagation()
    console.log(`🎯 SNAP POINT CLICKED - ULTRA DEBUG:`, {
      snapPointId: snapPoint.id,
      snapPointName: snapPoint.name,
      snapPointType: snapPoint.type,
      snapPointPosition: snapPoint.position,
      isActive,
      hovered,
      worldPosition: position,
      hasOnClick: !!onClick,
      event: e.type,
      userData: e.object?.userData
    })
    
    if (onClick) {
      console.log(`📞 CALLING onClick handler for snap point: ${snapPoint.id}`)
      onClick(e)
      console.log(`✅ Snap point onClick handler completed`)
    } else {
      console.error(`❌ CRITICAL: No onClick handler for snap point: ${snapPoint.id}`)
      console.error(`🔍 This means snap point selection is broken!`)
    }
  }

  return (
    <group position={position}>
      {/* Main clickable snap point sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        userData={{ snapPointId: snapPoint.id, type: "snapPoint" }}
        renderOrder={1000}
      >
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isActive || hovered ? color : "#000000"}
          emissiveIntensity={isActive ? 0.6 : hovered ? 0.4 : 0}
          transparent
          opacity={isActive ? 0.9 : hovered ? 0.8 : 0.7}
          depthTest={false}
        />
      </mesh>

      {/* Outer ring for better visibility */}
      <mesh
        ref={ringRef}
        renderOrder={999}
        userData={{ snapPointId: snapPoint.id, type: "snapPoint" }}
      >
        <ringGeometry args={[size * 1.8, size * 2.2, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.5 : hovered ? 0.3 : 0.2}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </group>
  )
}
