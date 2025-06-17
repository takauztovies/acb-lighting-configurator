"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useThree } from "@react-three/fiber"
import { useConfigurator } from "./configurator-context"
import { db } from "@/lib/database"
import * as THREE from "three"

interface ImageSettings {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number]
  opacity: number
  perspective: number
  depth: number
}

interface ImageData {
  texture: THREE.Texture
  width: number
  height: number
  settings: ImageSettings
}

const defaultSettings: ImageSettings = {
  position: [0, 2, -5],
  rotation: [0, 0, 0],
  scale: [8, 4.5],
  opacity: 0.8,
  perspective: 1,
  depth: -5,
}

export function SceneBackground3D() {
  const { state } = useConfigurator()
  const { scene } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const textureLoader = useMemo(() => new THREE.TextureLoader(), [])

  // Load and resolve scene image
  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get image URL from scene settings
        const imageUrl = state.sceneImageSettings?.backWall || null
        if (!imageUrl) {
          setIsLoading(false)
          return
        }

        // Resolve database references
        let resolvedUrl = imageUrl
        if (imageUrl.startsWith("db://")) {
          try {
            const fileId = imageUrl.replace("db://", "")
            const file = await db.getFile(fileId)
            resolvedUrl = file.url || file.data
          } catch (dbError) {
            console.error("Error resolving scene image from database:", dbError)
            setError("Failed to load image from database")
            setIsLoading(false)
            return
          }
        }

        // Create texture
        const texture = await textureLoader.loadAsync(resolvedUrl)
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping

        // Calculate aspect ratio and dimensions
        const aspectRatio = texture.image.width / texture.image.height
        const width = 10 * aspectRatio
        const height = 10

        setImageData({
          texture,
          width,
          height,
          settings: defaultSettings
        })

        setTexture(texture)

      } catch (error) {
        console.error("Error loading scene image:", error)
        setError("Failed to load image")
      }

      setIsLoading(false)
    }

    loadImage()
  }, [state.sceneImageSettings?.backWall, textureLoader])

  // Update material when texture changes
  useEffect(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      if (texture) {
        meshRef.current.material.map = texture
        meshRef.current.material.transparent = true
        meshRef.current.material.opacity = defaultSettings.opacity
        meshRef.current.material.needsUpdate = true
      } else {
        meshRef.current.material.map = null
        meshRef.current.material.needsUpdate = true
      }
    }
  }, [texture])

  // Don't render if no image data or error
  if (!imageData || error) {
    return null
  }

  return (
    <mesh
      ref={meshRef}
      position={imageData.settings.position}
      rotation={imageData.settings.rotation}
      scale={[imageData.settings.scale[0], imageData.settings.scale[1], 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={imageData.settings.opacity} side={THREE.DoubleSide} map={texture} />
    </mesh>
  )
}
