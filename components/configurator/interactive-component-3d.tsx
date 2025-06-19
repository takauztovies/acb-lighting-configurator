"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { db } from "@/lib/database"
import * as THREE from "three"
import { ComponentSnapPoint } from "./component-snap-point"

interface InteractiveComponent3DProps {
  component: {
    id: string
    name: string
    type: string
    position?: number[]
    rotation?: number[]
    model3d?: string
    snapPoints?: {
      id: string
      position?: number[]
      type?: string
      name?: string
    }[]
  }
  isSelected: boolean
  isPrimary?: boolean
  isMultiSelected?: boolean
  showLabels: boolean
  showSnapPoints?: boolean
  selectedSnapPoint?: { componentId: string; snapPointId: string } | null
  onClick?: (componentId: string) => void
  onSnapPointClick?: (componentId: string, snapPointId: string) => void
}

export function InteractiveComponent3D({
  component,
  isSelected,
  isPrimary = false,
  isMultiSelected = false,
  showLabels,
  showSnapPoints = true,
  selectedSnapPoint,
  onClick,
  onSnapPointClick,
}: InteractiveComponent3DProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [material, setMaterial] = useState<THREE.Material | null>(null)
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [isLoadingModel, setIsLoadingModel] = useState(false)

  if (!component) {
    console.warn("InteractiveComponent3D: No component provided")
    return null
  }

  // Safe position and rotation with defaults
  const posX = component.position?.[0] ?? 0
  const posY = component.position?.[1] ?? 0
  const posZ = component.position?.[2] ?? 0

  const rotX = component.rotation?.[0] ?? 0
  const rotY = component.rotation?.[1] ?? 0
  const rotZ = component.rotation?.[2] ?? 0

  // Resolve model URL if it's a database reference
  const resolveModelUrl = useCallback(async () => {
    if (!component.model3d) {
      setModelUrl(null)
      setModelLoadError(null)
      return
    }

    try {
      if (component.model3d === "undefined" || component.model3d === "null" || !component.model3d.trim()) {
        setModelUrl(null)
        setModelLoadError("Invalid model reference")
        return
      }

      if (component.model3d.startsWith("db://")) {
        const fileId = component.model3d.replace("db://", "")

        if (!fileId) {
          setModelUrl(null)
          setModelLoadError("Empty file reference")
          return
        }

        const file = await db.getFile(fileId)

        if (file && file.data) {
          if (!file.data || file.data === "undefined" || file.data === "null") {
            setModelUrl(null)
            setModelLoadError("Invalid file data")
            return
          }

          if (file.data.startsWith("data:")) {
            try {
              const response = await fetch(file.data)
              const blob = await response.blob()
              const blobUrl = URL.createObjectURL(blob)
              setModelUrl(blobUrl)
              setModelLoadError(null)
            } catch (error) {
              setModelUrl(null)
              setModelLoadError(`Failed to process file: ${error}`)
            }
          } else {
            setModelUrl(null)
            setModelLoadError("Invalid file format")
          }
        } else {
          setModelUrl(null)
          setModelLoadError("File not found in database")
        }
      } else {
        try {
          new URL(component.model3d)
          setModelUrl(component.model3d)
          setModelLoadError(null)
        } catch (error) {
          setModelUrl(null)
          setModelLoadError("Invalid URL format")
        }
      }
    } catch (error) {
      setModelUrl(null)
      setModelLoadError(`Failed to resolve model: ${error}`)
    }
  }, [component.model3d])

  useEffect(() => {
    resolveModelUrl()
  }, [resolveModelUrl])

  // Load 3D model if available
  useEffect(() => {
    if (!modelUrl) {
      setLoadedModel(null)
      setIsLoadingModel(false)
      return
    }

    setIsLoadingModel(true)
    setModelLoadError(null)

    const loader = new OBJLoader()

    loader.load(
      modelUrl,
      (object) => {
        // Scale and center the model
        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3())
        const maxDimension = Math.max(size.x, size.y, size.z)

        if (maxDimension > 0) {
          const scale = 1 / maxDimension
          object.scale.setScalar(scale)
          const center = box.getCenter(new THREE.Vector3())
          object.position.sub(center.multiplyScalar(scale))
        }

        // Apply material to all meshes and set userData for selection
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.metalness = 0.3
              child.material.roughness = 0.7
            } else {
              child.material = new THREE.MeshStandardMaterial({
                color: "#ffffff",
                metalness: 0.3,
                roughness: 0.7,
              })
            }
            child.castShadow = true
            child.receiveShadow = true
            child.userData.componentId = component.id
          }
        })

        object.userData.componentId = component.id
        setLoadedModel(object)
        setIsLoadingModel(false)
        setModelLoadError(null)
      },
      undefined,
      (error) => {
        console.error(`Error loading 3D model for ${component.name}:`, error)
        setLoadedModel(null)
        setIsLoadingModel(false)
        setModelLoadError(`Failed to load 3D model: ${error.message || error}`)

        if (modelUrl && modelUrl.startsWith("blob:")) {
          URL.revokeObjectURL(modelUrl)
        }
      },
    )

    return () => {
      if (modelUrl && modelUrl.startsWith("blob:")) {
        URL.revokeObjectURL(modelUrl)
      }
    }
  }, [modelUrl, component.id])

  // Create fallback geometry if no 3D model is available
  useEffect(() => {
    if (loadedModel || isLoadingModel) {
      setGeometry(null)
      setMaterial(null)
      return
    }

    let geo: THREE.BufferGeometry
    let mat: THREE.Material

    switch (component.type) {
      case "track":
        geo = new THREE.BoxGeometry(2, 0.1, 0.2)
        mat = new THREE.MeshStandardMaterial({ color: "#666666" })
        break
      case "spotlight":
        geo = new THREE.CylinderGeometry(0.1, 0.2, 0.3, 32)
        mat = new THREE.MeshStandardMaterial({ color: "#ffcc00" })
        break
      case "connector":
        geo = new THREE.SphereGeometry(0.15, 32, 32)
        mat = new THREE.MeshStandardMaterial({ color: "#3366cc" })
        break
      case "power-supply":
        geo = new THREE.BoxGeometry(0.4, 0.2, 0.3)
        mat = new THREE.MeshStandardMaterial({ color: "#333333" })
        break
      default:
        geo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
        mat = new THREE.MeshStandardMaterial({ color: "#999999" })
    }

    setGeometry(geo)
    setMaterial(mat)
  }, [component.type, loadedModel, isLoadingModel])

  // Handle hover state
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

  // Handle click
  const handleClick = (e: any) => {
    e.stopPropagation()
    if (onClick) {
      onClick(component.id)
    }
  }

  // Handle snap point click
  const handleSnapPointClick = (snapPointId: string) => (e: any) => {
    e.stopPropagation()
    if (onSnapPointClick) {
      onSnapPointClick(component.id, snapPointId)
    }
  }

  // Highlight effect for selected components
  useFrame(() => {
    if (meshRef.current) {
      // Apply highlight to loaded model
      if (loadedModel) {
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (isSelected) {
              child.material.emissive.set(new THREE.Color("#3b82f6").multiplyScalar(0.5))
            } else if (hovered) {
              child.material.emissive.set(new THREE.Color("#60a5fa").multiplyScalar(0.3))
            } else {
              child.material.emissive.set(new THREE.Color("#000000"))
            }
          }
        })
      }
      // Apply highlight to fallback geometry
      else if (material && material instanceof THREE.MeshStandardMaterial) {
        if (isSelected) {
          material.emissive.set(new THREE.Color("#3b82f6").multiplyScalar(0.5))
        } else if (hovered) {
          material.emissive.set(new THREE.Color("#60a5fa").multiplyScalar(0.3))
        } else {
          material.emissive.set(new THREE.Color("#000000"))
        }
      }
    }
  })

  // Check if we should show snap points
  const shouldShowSnapPoints = showSnapPoints || isSelected
  const hasSnapPoints = component.snapPoints && component.snapPoints.length > 0

  return (
    <group ref={meshRef} position={[posX, posY, posZ]} rotation={[rotX, rotY, rotZ]}>
      {/* Render loaded 3D model or fallback geometry */}
      {loadedModel ? (
        <primitive
          object={loadedModel.clone()}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
          userData={{ componentId: component.id }}
        />
      ) : geometry && material ? (
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
          userData={{ componentId: component.id }}
        />
      ) : isLoadingModel ? (
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
          userData={{ componentId: component.id }}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={0.5} />
        </mesh>
      ) : (
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
          userData={{ componentId: component.id }}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={isSelected ? "#3b82f6" : hovered ? "#60a5fa" : "#999999"} />
        </mesh>
      )}

      {/* Component snap points - only show if component has defined snap points */}
      {shouldShowSnapPoints &&
        hasSnapPoints &&
        component.snapPoints?.map((snapPoint) => {
          if (!snapPoint || !snapPoint.id) return null

          // Use the exact position defined in the snap point data
          const snapPosX = snapPoint.position?.[0] ?? 0
          const snapPosY = snapPoint.position?.[1] ?? 0
          const snapPosZ = snapPoint.position?.[2] ?? 0

          // Check if this snap point is currently selected
          const isSnapPointSelected =
            selectedSnapPoint?.componentId === component.id && selectedSnapPoint?.snapPointId === snapPoint.id

          return (
            <ComponentSnapPoint
              key={snapPoint.id}
              position={[snapPosX, snapPosY, snapPosZ]}
              snapPoint={{
                id: snapPoint.id,
                type: snapPoint.type || "accessory",
                name: snapPoint.name || "Snap Point",
                position: [snapPosX, snapPosY, snapPosZ],
              }}
              isActive={isSnapPointSelected}
              onClick={handleSnapPointClick(snapPoint.id)}
            />
          )
        })}
    </group>
  )
}
