"use client"

import { Html } from "@react-three/drei"

export function SimpleSnapPoint(props) {
  const position = props.position || [0, 0, 0]
  const name = props.name || "Snap"

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <Html position={[0, 0.1, 0]} center>
        <div className="bg-black text-white px-1 py-0.5 rounded text-xs">{name}</div>
      </Html>
    </group>
  )
}
