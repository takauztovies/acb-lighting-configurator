"use client"

import { useMemo } from "react"
import { useConfigurator, type Connection } from "./configurator-context"
import * as THREE from "three"

interface ConnectionLineProps {
  connection: Connection
}

export function ConnectionLine({ connection }: ConnectionLineProps) {
  const { state } = useConfigurator()

  const { points, color } = useMemo(() => {
    const fromComponent = state.currentConfig.components.find((c) => c.id === connection.from.componentId)
    const toComponent = state.currentConfig.components.find((c) => c.id === connection.to.componentId)

    if (!fromComponent || !toComponent) {
      return { points: [], color: "#ff0000" }
    }

    // Calculate actual world positions of connection points
    const fromPoint = new THREE.Vector3(...fromComponent.position)
    const toPoint = new THREE.Vector3(...toComponent.position)

    // Add some curve to the connection line
    const midPoint = new THREE.Vector3()
      .addVectors(fromPoint, toPoint)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0.2, 0)) // Slight upward curve

    const curve = new THREE.QuadraticBezierCurve3(fromPoint, midPoint, toPoint)
    const points = curve.getPoints(20)

    return {
      points,
      color: "#00ff00", // Green for active connections
    }
  }, [connection, state.currentConfig.components])

  if (points.length === 0) return null

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={3} />
    </line>
  )
}
