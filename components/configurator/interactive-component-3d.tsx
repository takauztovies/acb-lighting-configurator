"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { db } from "@/lib/database"
import * as THREE from "three"
import { ComponentSnapPoint } from "./component-snap-point"
import { Html } from "@react-three/drei"

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
    specifications?: {
      scale?: number
    }
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
      console.log('No model3d URL provided:', { componentId: component.id });
      setModelUrl(null)
      setModelLoadError(null)
      return
    }

    try {
      if (component.model3d === "undefined" || component.model3d === "null" || !component.model3d.trim()) {
        setModelUrl(null)
        setModelLoadError("Invalid model reference (empty or undefined)")
        return
      }

      if (component.model3d.startsWith("db://")) {
        const fileId = component.model3d.replace("db://", "")
        if (!fileId) {
          setModelUrl(null)
          setModelLoadError("Empty file reference in db:// URI")
          return
        }
        const file = await db.getFile(fileId)
        if (file) {
          if (file.url && typeof file.url === "string" && file.url.trim() && file.url !== "undefined" && file.url !== "null") {
            setModelUrl(file.url)
            setModelLoadError(null)
            return
          }
          if (file.data && typeof file.data === "string" && file.data.trim() && file.data !== "undefined" && file.data !== "null") {
            if (file.data.startsWith("data:")) {
              setModelUrl(file.data)
              setModelLoadError(null)
              return
            } else {
              setModelUrl(null)
              setModelLoadError("File data is not a valid data URL")
              return
            }
          }
          setModelUrl(null)
          setModelLoadError("File found in DB but has no usable url or data")
          return
        } else {
          setModelUrl(null)
          setModelLoadError("File not found in database for db:// reference")
          return
        }
      }
      // If not db://, treat as plain URL
      // Ensure URL starts with / if it's a relative path
      let url = component.model3d;
      if (!url.startsWith('/') && !url.startsWith('http')) {
        url = '/' + url;
      }
      setModelUrl(url)
      setModelLoadError(null)
    } catch (error: any) {
      setModelUrl(null)
      setModelLoadError(`Failed to resolve model: ${error}`)
    }
  }, [component.model3d, component.id])

  useEffect(() => {
    resolveModelUrl()
  }, [resolveModelUrl])

  // Load 3D model if available
  useEffect(() => {
    if (!modelUrl) {
      console.log('No model3d URL provided:', { componentId: component.id });
      setLoadedModel(null)
      setIsLoadingModel(false)
      return
    }

    console.log('Loading 3D model:', {
      url: modelUrl,
      componentId: component.id,
      componentName: component.name
    });

    setIsLoadingModel(true)

    const loader = new OBJLoader()
    
    // Create default material
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    try {
      loader.load(
        modelUrl,
        (object) => {
          console.log('Model loaded successfully:', {
            componentId: component.id,
            objectChildren: object.children.length,
            hasGeometry: object.children.some((child: any) => child.geometry),
            position: object.position,
            scale: object.scale
          });

          // Apply materials and center geometries
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.material = defaultMaterial.clone()
              mesh.geometry.center()
            }
          })

          // Scale and center the model
          const box = new THREE.Box3().setFromObject(object)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())
          
          const maxDim = Math.max(size.x, size.y, size.z)
          if (maxDim > 0) {
            // Apply base normalization scale and then multiply by component's custom scale factor
            const normalizeScale = 1 / maxDim
            const customScale = component.specifications?.scale || 1
            const finalScale = normalizeScale * customScale
            
            object.scale.setScalar(finalScale)
            
            // Center the model
            object.position.sub(center.multiplyScalar(finalScale))
            object.updateMatrixWorld(true)
          }

          // Set the loaded model
          setLoadedModel(object)
          setIsLoadingModel(false)
          setModelLoadError(null)
        },
        (xhr: ProgressEvent) => {
          // Progress callback
          if (xhr.lengthComputable) {
            console.log(`Loading model: ${(xhr.loaded / xhr.total * 100)}% loaded`)
          }
        },
        (err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          console.error('Error loading model:', err)
          setModelLoadError(`Failed to load model: ${errorMessage}`)
          setIsLoadingModel(false)
          setLoadedModel(null)
        }
      )
    } catch (error: any) {
      console.error('Error in model loading:', error)
      setModelLoadError(`Error in model loading: ${error.message}`)
      setIsLoadingModel(false)
      setLoadedModel(null)
    }
  }, [modelUrl, component.id, component.specifications?.scale])

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
      ) : modelLoadError ? (
        // Show a red box and error text if model fails to load
        <group>
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#ff3333" />
          </mesh>
          {/* Error label */}
          <Html position={[0, 0.4, 0]} center>
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">Model failed to load</div>
          </Html>
          {/* TODO: Check connector data in admin if you see this error */}
        </group>
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
      {shouldShowSnapPoints && hasSnapPoints &&
        // Only render unique, valid snap points by id
        Array.from(new Map((component.snapPoints || []).filter(sp => sp && sp.id).map(sp => [sp.id, sp])).values())
          .map((snapPoint) => {
            if (!snapPoint || !snapPoint.id) return null
            const snapPosX = snapPoint.position?.[0] ?? 0
            const snapPosY = snapPoint.position?.[1] ?? 0
            const snapPosZ = snapPoint.position?.[2] ?? 0
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
