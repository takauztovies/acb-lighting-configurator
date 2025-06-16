"use client"

import { useRef, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { TransformControls as DreiTransformControls } from "@react-three/drei"
import type { LightComponent } from "./configurator-context"

interface TransformControlsProps {
  component: LightComponent | null
  mode: "translate" | "rotate" | "scale"
  onPositionChange: (position: [number, number, number]) => void
  onRotationChange: (rotation: [number, number, number]) => void
  enabled: boolean
}

export function TransformControls({
  component,
  mode,
  onPositionChange,
  onRotationChange,
  enabled,
}: TransformControlsProps) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()

  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current

      const handleChange = () => {
        if (!component || !controls.object) return

        const position = controls.object.position
        const rotation = controls.object.rotation

        if (mode === "translate") {
          onPositionChange([position.x, Math.max(0.05, position.y), position.z])
        } else if (mode === "rotate") {
          onRotationChange([rotation.x, rotation.y, rotation.z])
        }
      }

      controls.addEventListener("change", handleChange)
      controls.addEventListener("dragging-changed", (event: any) => {
        // Disable orbit controls when dragging
        if (event.value) {
          gl.domElement.style.cursor = "grabbing"
        } else {
          gl.domElement.style.cursor = "default"
        }
      })

      return () => {
        controls.removeEventListener("change", handleChange)
      }
    }
  }, [component, mode, onPositionChange, onRotationChange, gl])

  if (!component || !enabled) return null

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={undefined} // Will be set by the parent
      mode={mode}
      camera={camera}
      gl={gl}
      size={0.8}
      showX={true}
      showY={mode === "translate"}
      showZ={true}
    />
  )
}
