"use client"

import { useRef, useState } from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"
import { Zap } from "lucide-react"

interface SocketIndicator3DProps {
  position: [number, number, number]
  wall: string
  isActive?: boolean
  onClick?: () => void
}

export function SocketIndicator3D({ position, wall, isActive = false, onClick }: SocketIndicator3DProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Animation for the socket indicator
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.setScalar(isActive ? scale : 1)
    }
  })

  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
  }

  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "default"
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    }
  }

  // Get wall-specific rotation for the socket
  const getSocketRotation = (): [number, number, number] => {
    switch (wall) {
      case "back":
        return [0, 0, 0]
      case "front":
        return [0, Math.PI, 0]
      case "left":
        return [0, Math.PI / 2, 0]
      case "right":
        return [0, -Math.PI / 2, 0]
      case "ceiling":
        return [-Math.PI / 2, 0, 0]
      default:
        return [0, 0, 0]
    }
  }

  const socketRotation = getSocketRotation()

  return (
    <group ref={meshRef} position={position} rotation={socketRotation}>
      {/* Socket base plate */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshStandardMaterial
          color={isActive ? "#fbbf24" : hovered ? "#f59e0b" : "#ffffff"}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Socket holes */}
      <mesh position={[0, 0, 0.011]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.03, 0, 0.011]}>
        <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.03, 0, 0.011]}>
        <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Power indicator light */}
      {isActive && (
        <mesh position={[0, 0.05, 0.015]}>
          <sphereGeometry args={[0.01, 16, 16]} />
          <meshBasicMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Socket label */}
      <Html position={[0, 0.2, 0]} center distanceFactor={8}>
        <div
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            isActive
              ? "bg-yellow-500 text-white shadow-lg"
              : hovered
                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                : "bg-white text-gray-700 border border-gray-300"
          }`}
          style={{
            pointerEvents: "none",
            userSelect: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Power Socket</span>
          </div>
          <div className="text-xs opacity-75 mt-1">
            {wall} wall • {position[0].toFixed(1)}, {position[1].toFixed(1)}, {position[2].toFixed(1)}
          </div>
        </div>
      </Html>

      {/* Connection point indicator */}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial
          color={isActive ? "#ef4444" : "#6b7280"}
          transparent
          opacity={0.7}
          emissive={isActive ? "#ef4444" : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>

      {/* Glow effect when active */}
      {isActive && (
        <mesh position={[0, 0, 0.03]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  )
}
