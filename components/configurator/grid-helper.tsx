"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"

interface GridHelperProps {
  visible: boolean
  size?: number
  divisions?: number
}

export function GridHelper({ visible, size = 20, divisions = 20 }: GridHelperProps) {
  const gridRef = useRef<THREE.GridHelper>(null)

  // Update visibility immediately when prop changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = visible
    }
  }, [visible])

  // Also update in frame loop for reliability
  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.visible = visible
    }
  })

  return <gridHelper ref={gridRef} args={[size, divisions, "#888888", "#cccccc"]} position={[0, 0, 0]} />
}
