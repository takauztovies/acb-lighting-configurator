"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Save, X, Target, Move3D } from "lucide-react"
import { db, type ComponentData } from "@/lib/database"
import { getDefaultSnapPoint, type SnapPoint } from "@/lib/snap-system"
import * as THREE from "three"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { ComponentSnapPoint } from "@/components/configurator/component-snap-point"

// Debug utility function
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data !== undefined ? data : "")
}

// Validate snap point utility
function isValidSnapPoint(sp: any): boolean {
  return sp && typeof sp === "object" && sp.id && typeof sp.id === "string"
}

interface VisualSnapPointEditorProps {
  component: ComponentData
  onSnapPointsUpdated: (component: ComponentData) => void
  onClose: () => void
}

// Visual snap point representation in 3D
function VisualSnapPoint({
  snapPoint,
  position,
  isSelected,
  isEditing,
  onClick,
  onPositionChange,
}: {
  snapPoint: SnapPoint
  position: [number, number, number]
  isSelected: boolean
  isEditing: boolean
  onClick: () => void
  onPositionChange: (newPosition: [number, number, number]) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState(false)

  const getSnapPointColor = (type: SnapPoint["type"]) => {
    switch (type) {
      case "power":
        return "#ef4444"
      case "mechanical":
        return "#3b82f6"
      case "data":
        return "#10b981"
      case "track":
        return "#8b5cf6"
      case "mounting":
        return "#f97316"
      case "accessory":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  const getSnapPointShape = (type: SnapPoint["type"]) => {
    switch (type) {
      case "power":
        return "sphere"
      case "mechanical":
        return "box"
      case "data":
        return "cylinder"
      case "track":
        return "cone"
      case "mounting":
        return "octahedron"
      default:
        return "sphere"
    }
  }

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    if (isEditing) {
      setIsDragging(true)
    }
    onClick()
  }

  const handlePointerMove = useCallback(
    (e: any) => {
      if (isDragging && isEditing) {
        // Convert mouse movement to 3D position change
        const newPosition: [number, number, number] = [
          position[0] + e.movementX * 0.01,
          position[1] - e.movementY * 0.01,
          position[2],
        ]
        onPositionChange(newPosition)
      }
    },
    [isDragging, isEditing, position, onPositionChange],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const color = getSnapPointColor(snapPoint.type)
  const shape = getSnapPointShape(snapPoint.type)
  const size = isSelected ? 0.08 : hovered ? 0.06 : 0.05

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = isEditing ? "move" : "pointer"
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = "default"
        }}
      >
        {shape === "sphere" && <sphereGeometry args={[size, 16, 16]} />}
        {shape === "box" && <boxGeometry args={[size * 2, size * 2, size * 2]} />}
        {shape === "cylinder" && <cylinderGeometry args={[size, size, size * 2, 16]} />}
        {shape === "cone" && <coneGeometry args={[size, size * 2, 16]} />}
        {shape === "octahedron" && <octahedronGeometry args={[size]} />}

        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : hovered ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.1 : 0}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[size * 1.5, size * 2, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

// Component that handles click detection on the 3D model
function ClickableComponent3D({
  component,
  snapPoints,
  isPlacementMode,
  onComponentClick,
}: {
  component: ComponentData
  snapPoints: SnapPoint[]
  isPlacementMode: boolean
  onComponentClick: (position: [number, number, number]) => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const { raycaster, mouse, camera } = useThree()
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null)

  // Ensure component has valid position
  const componentPosition: [number, number, number] = [0, 0, 0]

  useFrame(() => {
    if (isPlacementMode && meshRef.current) {
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(meshRef.current, true)

      if (intersects.length > 0) {
        const intersect = intersects[0]
        setHoverPoint(intersect.point.clone())
      } else {
        setHoverPoint(null)
      }
    } else {
      setHoverPoint(null)
    }
  })

  const handleClick = (event: any) => {
    if (isPlacementMode && hoverPoint) {
      event.stopPropagation()
      // Convert world position to local component position
      const componentPos = new THREE.Vector3(componentPosition[0], componentPosition[1], componentPosition[2])
      const localPosition = hoverPoint.clone().sub(componentPos)
      onComponentClick([localPosition.x, localPosition.y, localPosition.z])
    }
  }

  // Filter out invalid snap points before rendering
  const validSnapPoints = snapPoints.filter(isValidSnapPoint)

  return (
    <group ref={meshRef} position={componentPosition as readonly [number, number, number]} onClick={handleClick}>
      {/* Render a simple box for the component */}
      <mesh userData={{ componentId: component.id }}>
        <boxGeometry args={[1, 0.5, 0.3]} />
        <meshStandardMaterial
          color={isPlacementMode ? "#00ff00" : "#666666"}
          transparent
          opacity={isPlacementMode ? 0.7 : 1}
        />
      </mesh>

      {/* Show existing snap points */}
      {validSnapPoints.map((snapPoint) => {
        const snapPos: [number, number, number] =
          Array.isArray(snapPoint.position) && snapPoint.position.length === 3
            ? [snapPoint.position[0], snapPoint.position[1], snapPoint.position[2]]
            : [0, 0, 0]

        return (
          <group key={snapPoint.id} position={snapPos}>
            <mesh>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </group>
        )
      })}

      {/* Show placement preview */}
      {isPlacementMode && hoverPoint && (
        <mesh position={hoverPoint.clone().sub(new THREE.Vector3(...componentPosition))}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

// 3D Scene for snap point editing
function SnapPointEditor3D({
  component,
  snapPoints,
  selectedSnapPointId,
  isPlacementMode,
  isEditMode,
  onSnapPointClick,
  onSnapPointPlace,
  onSnapPointMove,
}: {
  component: ComponentData
  snapPoints: SnapPoint[]
  selectedSnapPointId: string | null
  isPlacementMode: boolean
  isEditMode: boolean
  onSnapPointClick: (snapPointId: string) => void
  onSnapPointPlace: (position: [number, number, number], faceInfo?: any) => void
  onSnapPointMove: (snapPointId: string, position: [number, number, number]) => void
}) {
  // Ensure component has valid position
  const componentPosition: [number, number, number] = [0, 0, 0]

  // Filter out invalid snap points before rendering
  const validSnapPoints = snapPoints.filter(isValidSnapPoint)

  return (
    <>
      <ModelWithSnapPoints
        component={component}
        snapPoints={validSnapPoints}
        isPlacementMode={isPlacementMode}
        onComponentClick={onSnapPointPlace}
      />
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
    </>
  )
}

function ModelWithSnapPoints({ component, snapPoints, isPlacementMode, onComponentClick }: {
  component: ComponentData
  snapPoints: SnapPoint[]
  isPlacementMode: boolean
  onComponentClick: (position: [number, number, number], faceInfo?: any) => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const { raycaster, mouse, camera, gl } = useThree();
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null)
  const [modelBoundingBox, setModelBoundingBox] = useState<{ box: THREE.Box3, center: THREE.Vector3 } | null>(null)

  // Load model URL (db:// or direct)
  useEffect(() => {
    if (!component.model3d) return setModelUrl(null)
    if (component.model3d.startsWith("db://")) {
      const fileId = component.model3d.replace("db://", "")
      // Now works with backend RestAPIAdapter
      db.getFile(fileId).then((file: { data: string }) => {
        if (file && file.data && file.data.startsWith("data:")) {
          fetch(file.data).then(res => res.blob()).then(blob => {
            setModelUrl(URL.createObjectURL(blob))
          })
        }
      })
    } else {
      setModelUrl(component.model3d)
    }
  }, [component.model3d])

  // Load OBJ model
  useEffect(() => {
    if (!modelUrl) return setLoadedModel(null)
    const loader = new OBJLoader()
    loader.load(modelUrl, (object: THREE.Group) => {
      object.updateMatrixWorld(true);
      // Center and scale model
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const center = box.getCenter(new THREE.Vector3())
      if (maxDim > 0) {
        const scale = 1 / maxDim
        object.scale.setScalar(scale)
        object.position.sub(center.multiplyScalar(scale))
        object.position.set(0, 0, 0)
      }
      object.updateMatrixWorld(true);
      // Log all meshes and their world positions/bounding boxes
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.visible = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => {
                mat.side = THREE.DoubleSide;
                mat.visible = true;
              });
            } else {
              mesh.material.side = THREE.DoubleSide;
              mesh.material.visible = true;
            }
          }
          mesh.updateMatrixWorld(true);
        }
      });
      setLoadedModel(object)
      setModelBoundingBox({ box: box.clone(), center: center.clone() })
    })
  }, [modelUrl])

  // Utility to collect all meshes from a group
  function getAllMeshes(group: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh);
      }
    });
    return meshes;
  }

  // Hover/preview logic for placement mode
  useFrame(() => {
    if (isPlacementMode && meshRef.current) {
      raycaster.setFromCamera(mouse, camera);
      let intersects: any[] = [];
      if (loadedModel) {
        const meshes = getAllMeshes(loadedModel);
        intersects = raycaster.intersectObjects(meshes, true);
      } else {
        intersects = raycaster.intersectObject(meshRef.current, true);
      }
      if (intersects.length > 0) {
        setHoverPoint(intersects[0].point.clone());
      } else {
        setHoverPoint(null);
      }
    } else {
      setHoverPoint(null);
    }
  });

  // Placement click handler
  const handlePointerDown = (event: any) => {
    if (!isPlacementMode) return;
    event.stopPropagation();
    if (!meshRef.current) return;

    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    let intersects: any[] = [];
    if (loadedModel) {
      // Try raycasting on both the group and all meshes
      const meshes = getAllMeshes(loadedModel);
      const meshIntersects = raycaster.intersectObjects(meshes, true);
      const groupIntersects = raycaster.intersectObject(loadedModel, true);
      intersects = meshIntersects.length > 0 ? meshIntersects : (Array.isArray(groupIntersects) ? groupIntersects : [groupIntersects]);
    }
    // No fallback to placeholder mesh

    if (intersects.length > 0) {
      // Convert world position to local position
      const intersect = intersects[0];
      const localPos = meshRef.current.worldToLocal(intersect.point.clone());
      onComponentClick([localPos.x, localPos.y, localPos.z], intersect.face ? {
        face: intersect.face,
        object: intersect.object,
        faceIndex: intersect.faceIndex,
        geometry: (intersect.object as THREE.Mesh).geometry
      } : undefined);
    }
  };

  return (
    <group ref={meshRef} onPointerDown={handlePointerDown}>
      {loadedModel ? (
        <>
          <primitive object={loadedModel.clone()} />
        </>
      ) : (
        <mesh>
          <boxGeometry args={[1, 0.5, 0.3]} />
          <meshStandardMaterial color="#666" opacity={0.7} transparent />
        </mesh>
      )}
      {/* Render snap points using ComponentSnapPoint */}
      {snapPoints.map((sp) => (
        <ComponentSnapPoint
          key={sp.id}
          position={sp.position}
          snapPoint={{
            id: sp.id,
            type: sp.type,
            name: sp.name,
            position: sp.position,
          }}
          isActive={false}
        />
      ))}
      {/* Show placement preview */}
      {isPlacementMode && hoverPoint && (
        <mesh position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

export function VisualSnapPointEditor({ component, onSnapPointsUpdated, onClose }: VisualSnapPointEditorProps) {
  // Debug the incoming component
  useEffect(() => {}, [component]) // This effect only runs when component changes

  // Memoize safeComponent to prevent it from being recreated on every render
  const safeComponent = useMemo(() => {
    return {
      ...component,
      snapPoints: Array.isArray(component.snapPoints) ? component.snapPoints.filter((sp) => isValidSnapPoint(sp)) : [],
    }
  }, [component]) // Only recreate when component changes

  // Initialize snapPoints state directly from safeComponent.snapPoints
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>(() => {
    const validSnapPoints = safeComponent.snapPoints.filter(isValidSnapPoint)
    return validSnapPoints
  })

  // Update snapPoints when component changes
  useEffect(() => {
    const validSnapPoints = safeComponent.snapPoints.filter(isValidSnapPoint)
    setSnapPoints(validSnapPoints)
  }, [safeComponent]) // Only run when safeComponent changes (which is only when component changes)

  const [selectedSnapPointId, setSelectedSnapPointId] = useState<string | null>(null)
  const [isPlacementMode, setIsPlacementMode] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSnapPoint, setEditingSnapPoint] = useState<SnapPoint | null>(null)
  const [formData, setFormData] = useState<Partial<SnapPoint>>({})
  const [saveStatus, setSaveStatus] = useState("")

  const selectedSnapPoint = selectedSnapPointId
    ? snapPoints.find((sp) => isValidSnapPoint(sp) && sp.id === selectedSnapPointId)
    : null

  const handleStartPlacement = () => {
    setIsPlacementMode(true)
    setIsEditMode(false)
    setSelectedSnapPointId(null)
    setEditingSnapPoint(null)
    setSaveStatus("Click on the component to place a snap point")
  }

  const handleStopPlacement = () => {
    setIsPlacementMode(false)
    setSaveStatus("")
  }

  const handleSnapPointPlace = (position: [number, number, number], faceInfo?: any) => {
    const newId = `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Helper to determine if click is close to a face center
    const isCloseToFaceCenter = (pos: [number, number, number], threshold = 0.1) => {
      const faceCenters: [string, [number, number, number]][] = [
        ["right", [0.5, 0, 0]],
        ["left", [-0.5, 0, 0]],
        ["top", [0, 0.25, 0]],
        ["bottom", [0, -0.25, 0]],
        ["back", [0, 0, 0.15]],
        ["front", [0, 0, -0.15]],
        ["center", [0, 0, 0]],
      ];
      for (const [side, center] of faceCenters) {
        const dist = Math.sqrt(
          Math.pow(pos[0] - center[0], 2) +
          Math.pow(pos[1] - center[1], 2) +
          Math.pow(pos[2] - center[2], 2)
        );
        if (dist < threshold) return { isClose: true, side, center };
      }
      return { isClose: false, side: "custom", center: pos };
    };

    const { isClose, side, center } = isCloseToFaceCenter(position);
    let snapPosition: [number, number, number];
    let placementSide: string;
    if (isClose) {
      snapPosition = center;
      placementSide = side;
    } else {
      snapPosition = position;
      placementSide = "custom";
    }

    // Store faceInfo if available
    let faceData: { faceIndex: number; vertexIndices: [number, number, number]; geometry?: any } | undefined = undefined;
    if (faceInfo && faceInfo.face && faceInfo.object && faceInfo.geometry) {
      const a = faceInfo.geometry.index?.array[faceInfo.face.a];
      const b = faceInfo.geometry.index?.array[faceInfo.face.b];
      const c = faceInfo.geometry.index?.array[faceInfo.face.c];
      if (
        typeof a === 'number' &&
        typeof b === 'number' &&
        typeof c === 'number'
      ) {
        faceData = {
          faceIndex: faceInfo.faceIndex,
          vertexIndices: [a, b, c],
          geometry: faceInfo.geometry,
        };
      }
    }

    const newSnapPoint: SnapPoint = {
      ...(getDefaultSnapPoint() as SnapPoint),
      id: newId,
      name: `${placementSide.charAt(0).toUpperCase() + placementSide.slice(1)} Connection`,
      description: placementSide === "custom"
        ? "Connection point at custom position"
        : `Connection point on the ${placementSide} side`,
      position: snapPosition,
      type: "mechanical",
      createdAt: new Date(),
      updatedAt: new Date(),
      faceData,
    };

    // Filter out any invalid snap points before adding the new one
    const validSnapPoints = snapPoints.filter(isValidSnapPoint)
    const updatedSnapPoints = [...validSnapPoints, newSnapPoint]

    setSnapPoints(updatedSnapPoints)
    setSelectedSnapPointId(newId)
    setIsPlacementMode(false)

    // Ensure all state is properly set
    setEditingSnapPoint(newSnapPoint)
    setFormData({
      id: newId, // Explicitly set the ID
      name: newSnapPoint.name,
      description: newSnapPoint.description,
      position: newSnapPoint.position,
      type: newSnapPoint.type,
    })

    setSaveStatus(
      placementSide === "custom"
        ? "Snap point placed at clicked position! Edit its properties below and click Save."
        : `Snap point placed on ${placementSide} side and centered! Edit its properties below and click Save.`
    )
  }

  const handleSnapPointMove = (snapPointId: string, position: [number, number, number]) => {
    // Safely update snap points array
    const updatedSnapPoints = snapPoints
      .filter(isValidSnapPoint) // Filter out invalid snap points
      .map((sp) => {
        return sp.id === snapPointId ? { ...sp, position, updatedAt: new Date() } : sp
      })

    setSnapPoints(updatedSnapPoints)

    // Update form data if this is the selected snap point
    if (selectedSnapPointId === snapPointId) {
      setFormData((prev) => ({ ...prev, position }))
    }
  }

  const handleSnapPointClick = (snapPointId: string) => {
    const snapPoint = snapPoints.find((sp) => isValidSnapPoint(sp) && sp.id === snapPointId)
    if (!snapPoint) {
      setSaveStatus("Error: Could not find the selected snap point")
      return
    }
    setSelectedSnapPointId(snapPointId)
    setEditingSnapPoint(snapPoint)
    setFormData({
      id: snapPoint.id,
      name: snapPoint.name,
      description: snapPoint.description,
      position: snapPoint.position,
      type: snapPoint.type,
    })
    setIsPlacementMode(false)
  }

  // COMPLETELY REWRITTEN SAVE FUNCTION WITH EXTENSIVE DEBUGGING
  const handleSaveSnapPoint = () => {
    try {
      // Step 1: Defensive state cleaning and validation
      const cleanSnapPoints = snapPoints.filter(isValidSnapPoint)
      if (cleanSnapPoints.length !== snapPoints.length) {
        setSnapPoints(cleanSnapPoints) // Self-heal the state
      }
      if (!selectedSnapPointId) {
        setSaveStatus("Error: No snap point selected")
        return
      }
      if (!formData.name || !formData.type) {
        setSaveStatus("Error: Name and Type are required")
        return
      }
      // Step 2: Operate only on the cleaned data
      const snapPointToUpdate = cleanSnapPoints.find((sp) => sp.id === selectedSnapPointId)
      if (!snapPointToUpdate) {
        setSaveStatus("Error: Could not find the selected snap point. It may have been deleted.")
        return
      }
      // Create the updated snap point
      const updatedSnapPoint = {
        ...snapPointToUpdate,
        name: formData.name,
        description: formData.description || "",
        position: formData.position || snapPointToUpdate.position,
        type: formData.type,
        updatedAt: new Date(),
      }
      // Create a new array with the updated snap point
      const newSnapPoints = cleanSnapPoints.map((sp) => (sp.id === selectedSnapPointId ? updatedSnapPoint : sp))
      // Create updated component
      const updatedComponent = {
        ...safeComponent,
        snapPoints: newSnapPoints,
        updatedAt: new Date(),
      }
      // Save to database
      if (typeof db.saveComponent === "function") {
        db.saveComponent(updatedComponent)
      }
      // Update state
      setSnapPoints(newSnapPoints)
      setSelectedSnapPointId(null)
      setEditingSnapPoint(null)
      setFormData({})
      setSaveStatus("Snap point saved successfully!")
      // Notify parent
      if (typeof onSnapPointsUpdated === "function") {
        onSnapPointsUpdated(updatedComponent)
      }
      // Clear status after delay
      setTimeout(() => setSaveStatus(""), 3000)
    } catch (error) {
      setSaveStatus(`Error saving snap point: ${error}`)
    }
  }

  const handleDeleteSnapPoint = async () => {
    if (!selectedSnapPointId || !confirm("Are you sure you want to delete this snap point?")) return

    try {
      // Filter with safety checks
      const updatedSnapPoints = snapPoints.filter((sp) => isValidSnapPoint(sp) && sp.id !== selectedSnapPointId)

      const updatedComponent: ComponentData = {
        ...safeComponent,
        snapPoints: updatedSnapPoints,
        updatedAt: new Date(),
      }

      // Mock database save for demo
      try {
        if (typeof db.saveComponent === "function") {
          await db.saveComponent(updatedComponent)
        } else {
          console.warn("Database save mocked in demo mode")
        }
      } catch (dbError) {
        console.warn("Database save failed, continuing in demo mode", dbError)
      }

      setSnapPoints(updatedSnapPoints)
      setSelectedSnapPointId(null)
      setEditingSnapPoint(null)
      setFormData({})
      setSaveStatus("Snap point deleted successfully!")
      onSnapPointsUpdated(updatedComponent)

      setTimeout(() => setSaveStatus(""), 3000)
    } catch (error) {
      console.error("Error deleting snap point:", error)
      setSaveStatus(`Error deleting snap point: ${error}`)
    }
  }

  const getSnapPointTypeBadgeColor = (type: SnapPoint["type"]) => {
    switch (type) {
      case "power":
        return "bg-red-100 text-red-800"
      case "mechanical":
        return "bg-blue-100 text-blue-800"
      case "data":
        return "bg-green-100 text-green-800"
      case "track":
        return "bg-purple-100 text-purple-800"
      case "mounting":
        return "bg-orange-100 text-orange-800"
      case "accessory":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex">
        {/* 3D Editor Panel */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-10 space-y-2">
            {!isPlacementMode ? (
              <Button
                onClick={handleStartPlacement}
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Target className="w-4 h-4" />
                Add Snap Point
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={handleStopPlacement} variant="outline" size="sm" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel Placement
                </Button>
                <div className="bg-green-600 text-white px-3 py-2 rounded text-sm">
                  Click on the component to place snap point
                </div>
              </div>
            )}

            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              disabled={!selectedSnapPoint}
            >
              <Move3D className="w-4 h-4 mr-2" />
              {isEditMode ? "Stop Editing" : "Edit Position"}
            </Button>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Canvas camera={{ position: [2, 2, 2], fov: 75 }}>
            <SnapPointEditor3D
              component={safeComponent}
              snapPoints={snapPoints}
              selectedSnapPointId={selectedSnapPointId}
              isPlacementMode={isPlacementMode}
              isEditMode={isEditMode}
              onSnapPointClick={handleSnapPointClick}
              onSnapPointPlace={handleSnapPointPlace}
              onSnapPointMove={handleSnapPointMove}
            />
            <OrbitControls enableDamping dampingFactor={0.05} enabled={!isEditMode || !selectedSnapPointId} />
          </Canvas>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-medium text-lg">{safeComponent.name || "Component"}</h3>
              <p className="text-sm text-gray-600">Snap Point Editor</p>
            </div>

            {saveStatus && (
              <div
                className={`text-sm p-2 rounded ${
                  saveStatus.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {saveStatus}
              </div>
            )}

            <Separator />

            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click "Add Snap Point" to enter placement mode</li>
                <li>
                  Click on any side of the green component - the snap point will automatically center on that face
                </li>
                <li>Select a snap point to edit its properties or fine-tune position</li>
                <li>Use "Edit Position" mode to drag snap points around</li>
                <li>Save your changes when done</li>
              </ol>
            </div>

            {/* Snap Points List */}
            <div className="space-y-2">
              <h4 className="font-medium">Snap Points ({snapPoints.filter(isValidSnapPoint).length})</h4>
              {snapPoints.filter(isValidSnapPoint).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {snapPoints.filter(isValidSnapPoint).map((snapPoint) => (
                    <div
                      key={snapPoint.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedSnapPointId === snapPoint.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                      onClick={() => handleSnapPointClick(snapPoint.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{snapPoint.name || "Unnamed"}</span>
                        <Badge className={getSnapPointTypeBadgeColor(snapPoint.type)}>{snapPoint.type}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Position: [
                        {(Array.isArray(snapPoint.position) && snapPoint.position.length === 3
                          ? snapPoint.position
                          : [0, 0, 0]
                        )
                          .map((p) => p.toFixed(2))
                          .join(", ")}
                        ]
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No snap points yet. Click "Add Snap Point" to start.</p>
              )}
            </div>

            {/* Edit Form */}
            {editingSnapPoint && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Edit Snap Point</h4>
                    <Button
                      onClick={handleDeleteSnapPoint}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {isEditMode && selectedSnapPointId && (
                    <div className="bg-green-100 border border-green-300 text-green-800 text-sm p-2 rounded mb-4 flex items-center gap-2">
                      <Move3D className="w-4 h-4" />
                      Drag mode active - Click and drag snap points in the 3D view
                    </div>
                  )}

                  <div>
                    <label htmlFor="snap-name" className="block text-sm font-medium mb-1">Name *</label>
                    <Input
                      id="snap-name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Power Input, Track Connection"
                    />
                  </div>

                  <div>
                    <label htmlFor="snap-type" className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      id="snap-type"
                      value={formData.type || "mechanical"}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as SnapPoint["type"] })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      title="Component Type"
                    >
                      <option value="power">Power</option>
                      <option value="mechanical">Mechanical</option>
                      <option value="data">Data</option>
                      <option value="track">Track</option>
                      <option value="mounting">Mounting</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="snap-description" className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      id="snap-description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label>Position X</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          Array.isArray(formData.position) && formData.position.length > 0
                            ? formData.position[0]?.toFixed(2)
                            : "0.00"
                        }
                        onChange={(e) => {
                          const currentPos = Array.isArray(formData.position) ? formData.position : [0, 0, 0]
                          const newPosition: [number, number, number] = [
                            Number.parseFloat(e.target.value) || 0,
                            currentPos[1] || 0,
                            currentPos[2] || 0,
                          ]
                          setFormData({ ...formData, position: newPosition })

                          // Safe snap point move
                          if (selectedSnapPointId) {
                            handleSnapPointMove(selectedSnapPointId, newPosition)
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label>Position Y</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          Array.isArray(formData.position) && formData.position.length > 1
                            ? formData.position[1]?.toFixed(2)
                            : "0.00"
                        }
                        onChange={(e) => {
                          const currentPos = Array.isArray(formData.position) ? formData.position : [0, 0, 0]
                          const newPosition: [number, number, number] = [
                            currentPos[0] || 0,
                            Number.parseFloat(e.target.value) || 0,
                            currentPos[2] || 0,
                          ]
                          setFormData({ ...formData, position: newPosition })

                          // Safe snap point move
                          if (selectedSnapPointId) {
                            handleSnapPointMove(selectedSnapPointId, newPosition)
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label>Position Z</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          Array.isArray(formData.position) && formData.position.length > 2
                            ? formData.position[2]?.toFixed(2)
                            : "0.00"
                        }
                        onChange={(e) => {
                          const currentPos = Array.isArray(formData.position) ? formData.position : [0, 0, 0]
                          const newPosition: [number, number, number] = [
                            currentPos[0] || 0,
                            currentPos[1] || 0,
                            Number.parseFloat(e.target.value) || 0,
                          ]
                          setFormData({ ...formData, position: newPosition })

                          // Safe snap point move
                          if (selectedSnapPointId) {
                            handleSnapPointMove(selectedSnapPointId, newPosition)
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveSnapPoint} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Snap Point
                  </Button>
                </div>
              </>
            )}

            {editingSnapPoint && editingSnapPoint.faceData && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  // Type guard: ensure faceData and selectedSnapPoint.faceData are defined
                  const faceData = editingSnapPoint.faceData;
                  if (
                    faceData &&
                    Array.isArray(faceData.vertexIndices) &&
                    faceData.vertexIndices.length === 3 &&
                    selectedSnapPoint &&
                    selectedSnapPoint.faceData &&
                    selectedSnapPoint.faceData.geometry
                  ) {
                    const geometry = selectedSnapPoint.faceData.geometry || (selectedSnapPoint as any).geometry;
                    if (geometry && geometry.attributes && geometry.attributes.position) {
                      const posAttr = geometry.attributes.position;
                      const vA = new THREE.Vector3().fromBufferAttribute(posAttr, faceData.vertexIndices[0]);
                      const vB = new THREE.Vector3().fromBufferAttribute(posAttr, faceData.vertexIndices[1]);
                      const vC = new THREE.Vector3().fromBufferAttribute(posAttr, faceData.vertexIndices[2]);
                      const center = new THREE.Vector3()
                        .addVectors(vA, vB)
                        .add(vC)
                        .divideScalar(3);
                      // Update snap point position
                      handleSnapPointMove(selectedSnapPoint.id, [center.x, center.y, center.z]);
                      setFormData((prev) => ({ ...prev, position: [center.x, center.y, center.z] }));
                    }
                  }
                }}
              >
                Snap to Face Center
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
