"use client"

import { useRef, useState, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

interface SelectionBoxProps {
  onSelectionChange: (selectedIds: string[]) => void
  components: Array<{ id: string; position: [number, number, number] }>
  enabled: boolean
}

export function SelectionBox({ onSelectionChange, components, enabled }: SelectionBoxProps) {
  const { camera, gl, scene } = useThree()
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 })

  const selectionBoxRef = useRef<HTMLDivElement>(null)
  const raycaster = new THREE.Raycaster()

  useEffect(() => {
    if (!enabled) return

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey) return // Only left click, not with Ctrl/Cmd

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

    const handleMouseUp = (event: MouseEvent) => {
      if (!isSelecting) return

      setIsSelecting(false)

      // Calculate selection area
      const rect = gl.domElement.getBoundingClientRect()
      const minX = Math.min(startPoint.x, endPoint.x)
      const maxX = Math.max(startPoint.x, endPoint.x)
      const minY = Math.min(startPoint.y, endPoint.y)
      const maxY = Math.max(startPoint.y, endPoint.y)

      // Only proceed if we have a meaningful selection area
      if (Math.abs(maxX - minX) < 5 || Math.abs(maxY - minY) < 5) {
        return
      }

      // Find components within selection box
      const selectedIds: string[] = []

      components.forEach((component) => {
        const vector = new THREE.Vector3(...component.position)
        vector.project(camera)

        // Convert to screen coordinates
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
    <div
      ref={selectionBoxRef}
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
  )
}
