"use client"

import { useRef, useEffect, useState } from "react"
import { useThree } from "@react-three/fiber"
import { useConfigurator } from "./configurator-context"
import { db } from "@/lib/database"
import * as THREE from "three"

export function SceneBackground3D() {
  const { state } = useConfigurator()
  const { scene } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load and resolve scene image
  useEffect(() => {
    const loadSceneImage = async () => {
      if (!state.sceneImage) {
        setTexture(null)
        setError(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        let imageUrl = state.sceneImage

        // Resolve database references
        if (imageUrl.startsWith("db://")) {
          try {
            imageUrl = await db.resolveFileUrl(imageUrl)
          } catch (dbError) {
            console.error("Error resolving scene image from database:", dbError)
            setError("Failed to load image from database")
            setIsLoading(false)
            return
          }
        }

        // Validate URL
        if (!imageUrl || imageUrl === "undefined" || imageUrl === "null") {
          console.warn("Invalid scene image URL:", imageUrl)
          setTexture(null)
          setError("Invalid image URL")
          setIsLoading(false)
          return
        }

        // Load texture with error handling
        const loader = new THREE.TextureLoader()

        loader.load(
          imageUrl,
          (loadedTexture) => {
            // Success callback
            loadedTexture.wrapS = THREE.ClampToEdgeWrapping
            loadedTexture.wrapT = THREE.ClampToEdgeWrapping
            loadedTexture.minFilter = THREE.LinearFilter
            loadedTexture.magFilter = THREE.LinearFilter

            setTexture(loadedTexture)
            setError(null)
            setIsLoading(false)
            console.log("Scene background texture loaded successfully")
          },
          (progress) => {
            // Progress callback
            console.log("Loading scene background:", (progress.loaded / progress.total) * 100 + "%")
          },
          (loadError) => {
            // Error callback
            console.error("Error loading scene background texture:", loadError)
            setError("Failed to load background image")
            setTexture(null)
            setIsLoading(false)
          },
        )
      } catch (error) {
        console.error("Error in loadSceneImage:", error)
        setError(`Error loading image: ${error}`)
        setTexture(null)
        setIsLoading(false)
      }
    }

    loadSceneImage()
  }, [state.sceneImage])

  // Update material when texture changes
  useEffect(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      if (texture) {
        meshRef.current.material.map = texture
        meshRef.current.material.transparent = true
        meshRef.current.material.opacity = state.sceneImageSettings?.opacity || 0.8
        meshRef.current.material.needsUpdate = true
      } else {
        meshRef.current.material.map = null
        meshRef.current.material.needsUpdate = true
      }
    }
  }, [texture, state.sceneImageSettings?.opacity])

  // Don't render if no image or error
  if (!state.sceneImage || error) {
    return null
  }

  // Get image settings with defaults
  const settings = state.sceneImageSettings || {
    position: [0, 2, -5],
    rotation: [0, 0, 0],
    scale: [8, 4.5],
    opacity: 0.8,
    perspective: 1,
    depth: -5,
  }

  return (
    <mesh
      ref={meshRef}
      position={settings.position as [number, number, number]}
      rotation={settings.rotation as [number, number, number]}
      scale={[settings.scale[0], settings.scale[1], 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={settings.opacity} side={THREE.DoubleSide} map={texture} />
    </mesh>
  )
}
