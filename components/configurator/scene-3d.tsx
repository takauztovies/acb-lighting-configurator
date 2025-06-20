"use client"

import { Suspense, useRef, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Environment } from "@react-three/drei"
import { InteractiveComponent3D } from "./interactive-component-3d"
import { GridHelper } from "./grid-helper"
import { SceneBackground3D } from "./scene-background-3d"
import { RoomEnvironment } from "./room-environment"

interface Scene3DProps {
  components: any[]
  selectedComponentIds: string[]
  selectedSnapPoint?: { componentId: string; snapPointId: string } | null
  onComponentClick?: (componentId: string) => void
  onSnapPointClick?: (componentId: string, snapPointId: string) => void
  showLabels?: boolean
  showSnapPoints?: boolean
  gridVisible?: boolean
  transformMode?: string | null
  sceneImageSettings?: Record<string, string | null>
  roomDimensions?: { width: number; length: number; height: number }
  snapToGrid?: boolean
  gridSize?: number
  mode?: string
  socketPosition?: { x: number; y: number; z: number; wall: string } | null
  cableCalculations?: Array<{
    length: number
    type: "power" | "data"
    description: string
  }>
}

// Socket Indicator Component
function SocketIndicator3D({
  position,
  wall,
  isActive = false,
  onClick,
}: {
  position: [number, number, number]
  wall: string
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <group position={position} onClick={onClick}>
      {/* Socket base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color={isActive ? "#4ade80" : "#6b7280"} />
      </mesh>

      {/* Socket holes */}
      <mesh position={[-0.03, 0, 0.026]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.03, 0, 0.026]}>
        <cylinderGeometry args={[0.01, 0.01, 0.02]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Ground hole */}
      <mesh position={[0, -0.03, 0.026]}>
        <cylinderGeometry args={[0.008, 0.008, 0.02]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Glow effect when active */}
      {isActive && <pointLight position={[0, 0, 0.1]} color="#4ade80" intensity={0.5} distance={1} />}

      {/* Label */}
      <Html position={[0, 0.15, 0]} center>
        <div className="bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">Socket ({wall} wall)</div>
      </Html>
    </group>
  )
}

// Power Cable Component
function PowerCable3D({
  startPosition,
  endPosition,
  animated = false,
}: {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  animated?: boolean
}) {
  const points: [number, number, number][] = []
  const start = startPosition
  const end = endPosition

  // Create a curved cable path
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    Math.min(start[1], end[1]) - 0.3, // Sag in the middle
    (start[2] + end[2]) / 2,
  ]

  // Add points for the curve
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * midPoint[0] + t * t * end[0]
    const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * midPoint[1] + t * t * end[1]
    const z = (1 - t) * (1 - t) * start[2] + 2 * (1 - t) * t * midPoint[2] + t * t * end[2]
    points.push([x, y, z])
  }

  return (
    <group>
      {points.slice(0, -1).map((point, index) => {
        const nextPoint = points[index + 1]
        const direction = [nextPoint[0] - point[0], nextPoint[1] - point[1], nextPoint[2] - point[2]]
        const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2)

        return (
          <mesh
            key={index}
            position={[(point[0] + nextPoint[0]) / 2, (point[1] + nextPoint[1]) / 2, (point[2] + nextPoint[2]) / 2]}
          >
            <cylinderGeometry args={[0.01, 0.01, length]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        )
      })}
    </group>
  )
}

// Camera setup helper
function CameraSetup({ roomDimensions }: { roomDimensions: { width: number; length: number; height: number } }) {
  const { camera } = useThree()

  useEffect(() => {
    // Calculate camera position based on room dimensions
    const maxDimension = Math.max(roomDimensions.width, roomDimensions.length, roomDimensions.height)
    const distance = maxDimension * 1.5

    // Position camera at an angle
    camera.position.set(distance, distance * 0.8, distance)
    camera.lookAt(0, 0, 0)
  }, [camera, roomDimensions])

  return null
}

export function Scene3D({
  components = [],
  selectedComponentIds = [],
  selectedSnapPoint = null,
  onComponentClick,
  onSnapPointClick,
  showLabels = false,
  showSnapPoints = true,
  gridVisible = true,
  transformMode = null,
  sceneImageSettings = {},
  roomDimensions = { width: 8, length: 6, height: 3 },
  snapToGrid = true,
  gridSize = 0.5,
  mode = "translate",
  socketPosition = null,
  cableCalculations = [],
}: Scene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Log components for debugging
  useEffect(() => {
    console.log("Scene3D: Rendering with components:", components.length)
    if (socketPosition) {
      console.log("Socket position:", socketPosition)
    }
  }, [components, socketPosition])

  return (
    <div className="w-full h-full">
      <Canvas ref={canvasRef} shadows camera={{ position: [5, 5, 5], fov: 75 }} gl={{ antialias: true, alpha: false }}>
        <Suspense
          fallback={
            <Html center>
              <div className="bg-white p-2 rounded shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <div className="mt-2 text-sm text-gray-600">Loading scene...</div>
              </div>
            </Html>
          }
        >
          {/* Simple lighting setup matching snap points editor */}
          <color attach="background" args={["#f5f5f5"]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <RoomEnvironment />

          {/* Room setup */}
          <SceneBackground3D />

          {/* Grid */}
          {gridVisible && (
            <GridHelper
              visible={gridVisible}
              size={Math.max(roomDimensions.width, roomDimensions.length)}
              divisions={Math.max(roomDimensions.width, roomDimensions.length) * 2}
            />
          )}

          {/* Components */}
          {components.map((component) => (
            <InteractiveComponent3D
              key={component.id}
              component={component}
              isSelected={selectedComponentIds.includes(component.id)}
              isPrimary={selectedComponentIds[0] === component.id}
              isMultiSelected={selectedComponentIds.length > 1 && selectedComponentIds.includes(component.id)}
              showLabels={showLabels}
              showSnapPoints={showSnapPoints}
              selectedSnapPoint={selectedSnapPoint}
              onClick={onComponentClick}
              onSnapPointClick={onSnapPointClick}
            />
          ))}

          {/* Socket indicator */}
          {socketPosition && (
            <SocketIndicator3D
              position={[socketPosition.x, socketPosition.y, socketPosition.z]}
              wall={socketPosition.wall}
              isActive={components.length > 0}
              onClick={() => console.log("Socket clicked")}
            />
          )}

          {/* Power cables from socket to components */}
          {socketPosition && components.length > 0 && (
            <>
              {components
                .filter(
                  (component) =>
                    component.type === "power-supply" ||
                    (component.type !== "power-supply" && !components.some((c) => c.type === "power-supply")),
                )
                .slice(0, 1) // Only show cable to first/closest component
                .map((component) => (
                  <PowerCable3D
                    key={`cable-${component.id}`}
                    startPosition={[socketPosition.x, socketPosition.y, socketPosition.z]}
                    endPosition={component.position || [0, 0, 0]}
                    animated={true}
                  />
                ))}
            </>
          )}

          {/* Camera controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
          <CameraSetup roomDimensions={roomDimensions} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Add default export
export default Scene3D
