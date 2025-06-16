"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface PowerCable3DProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  color?: string
  thickness?: number
  animated?: boolean
}

export function PowerCable3D({
  startPosition,
  endPosition,
  color = "#1f2937",
  thickness = 0.02,
  animated = false,
}: PowerCable3DProps) {
  const cableRef = useRef<THREE.Mesh>(null)

  // Create cable geometry
  const { geometry, length } = useMemo(() => {
    const start = new THREE.Vector3(...startPosition)
    const end = new THREE.Vector3(...endPosition)
    const distance = start.distanceTo(end)

    // Create a curved path for the cable
    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, -Math.min(distance * 0.2, 0.5), 0)) // Sag effect

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end)
    const points = curve.getPoints(50)
    const cableGeometry = new THREE.TubeGeometry(curve, 50, thickness, 8, false)

    return { geometry: cableGeometry, length: distance }
  }, [startPosition, endPosition, thickness])

  // Animation for cable
  useFrame((state) => {
    if (cableRef.current && animated) {
      // Subtle swaying animation
      const time = state.clock.elapsedTime
      cableRef.current.rotation.z = Math.sin(time * 0.5) * 0.02
    }
  })

  return (
    <group>
      {/* Main cable */}
      <mesh ref={cableRef} geometry={geometry}>
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Cable connectors at both ends */}
      <mesh position={startPosition}>
        <cylinderGeometry args={[thickness * 1.5, thickness * 1.5, thickness * 2, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
      </mesh>

      <mesh position={endPosition}>
        <cylinderGeometry args={[thickness * 1.5, thickness * 1.5, thickness * 2, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Cable length indicator (optional) */}
      {/* <Html position={[
        (startPosition[0] + endPosition[0]) / 2,
        (startPosition[1] + endPosition[1]) / 2 + 0.2,
        (startPosition[2] + endPosition[2]) / 2
      ]} center>
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
          {length.toFixed(2)}m cable
        </div>
      </Html> */}
    </group>
  )
}
