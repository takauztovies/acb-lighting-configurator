"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import * as THREE from "three"
import { Box } from "lucide-react"

interface ModelPreviewProps {
  modelData: string // Base64 data
  filename: string
  className?: string
}

function ModelMesh({ url }: { url: string }) {
  const [error, setError] = useState(false)
  const [obj, setObj] = useState<THREE.Group | null>(null)

  useEffect(() => {
    try {
      new OBJLoader().load(
        url,
        (object) => {
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(object)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // Center the model
          object.position.sub(center)

          // Scale to fit in a unit cube
          const maxDim = Math.max(size.x, size.y, size.z)
          if (maxDim > 0) {
            object.scale.setScalar(1 / maxDim)
          }

          // Apply enhanced materials with better visual properties
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.1,
                roughness: 0.8,
                side: THREE.DoubleSide, // Better visibility from all angles
              })
              child.castShadow = true
              child.receiveShadow = true
            }
          })
          
          // Model loaded successfully - reduced logging to prevent spam
          
          setObj(object)
        },
        (xhr) => {
          //console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        },
        (error) => {
          console.error("Error loading model:", error)
          if (!error) setError(true)
        },
      )
    } catch (err) {
      console.error("Error loading model:", err)
      if (!error) setError(true)
    }
  }, [url, error])

  return obj ? <primitive object={obj} /> : null
}

export function ModelPreview({ modelData, filename, className = "" }: ModelPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (modelData && modelData.startsWith("data:")) {
      try {
        // Convert base64 to blob URL for OBJ loader
        fetch(modelData)
          .then((res) => res.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob)
            setBlobUrl(url)
            setLoading(false)
          })
          .catch((err) => {
            console.error("Error creating blob URL:", err)
            setError(true)
            setLoading(false)
          })
      } catch (err) {
        console.error("Error processing model data:", err)
        setError(true)
        setLoading(false)
      }
    } else {
      setError(true)
      setLoading(false)
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [modelData, blobUrl])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <Box className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">3D Model</p>
          <p className="text-xs text-gray-400 truncate">{filename}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 ${className}`}>
      <Canvas 
        camera={{ position: [2, 2, 2], fov: 75 }} 
        style={{ width: "100%", height: "100%" }}
        shadows
      >
        {/* Memory-optimized lighting setup - no HDR environment to prevent allocation failures */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <directionalLight position={[0, 10, 0]} intensity={0.3} />
        <hemisphereLight args={["#87CEEB", "#362d1a", 0.4]} />

        {blobUrl && <ModelMesh url={blobUrl} />}

        {/* Enhanced controls with damping for smoother interaction */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          enablePan={true} 
          enableZoom={true} 
          autoRotate 
          autoRotateSpeed={1} 
        />
      </Canvas>
    </div>
  )
}
