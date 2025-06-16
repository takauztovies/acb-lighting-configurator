"use client"

import { useRef } from "react"
import { Html } from "@react-three/drei"

export function SnapPoint3D({ position = [0, 0, 0], name = "Snap Point" }) {
  const meshRef = useRef(null)

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#ff5555" />
      </mesh>
      <Html position={[0, 0.05, 0]} center>
        <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs whitespace-nowrap">{name}</div>
      </Html>
    </group>
  )
}
