"use client"

import { Suspense, useRef, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import * as THREE from "three"
import { InteractiveComponent3D } from "./interactive-component-3d"
import { GridHelper } from "./grid-helper"
import { SceneBackground3D } from "./scene-background-3d"
import { RoomEnvironment } from "./room-environment"
import { EnhancedCameraControls } from "./enhanced-camera-controls"
import { useConfigurator } from "./configurator-context"
import { boundarySystem } from "@/lib/boundary-system"

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
  const points = [
    new THREE.Vector3(...startPosition),
    new THREE.Vector3(...endPosition),
  ]

  return (
    <group>
      <mesh>
        <tubeGeometry args={[new THREE.CatmullRomCurve3(points), 20, 0.02, 8, false]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
    </group>
  )
}

// Enhanced Component with Transform Controls
function ComponentWithTransform({
  component,
  isSelected,
  isPrimary,
  showLabels,
  showSnapPoints,
  selectedSnapPoint,
  onComponentClick,
  onSnapPointClick,
  roomDimensions,
  onTransformChange,
}: {
  component: any
  isSelected: boolean
  isPrimary: boolean
  showLabels: boolean
  showSnapPoints: boolean
  selectedSnapPoint?: { componentId: string; snapPointId: string } | null
  onComponentClick?: (componentId: string) => void
  onSnapPointClick?: (componentId: string, snapPointId: string) => void
  roomDimensions: { width: number; length: number; height: number }
  onTransformChange?: (componentId: string, position: [number, number, number], rotation: [number, number, number]) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const transformRef = useRef<any>(null)
  const { camera, gl } = useThree()

  return (
    <group>
      <group ref={groupRef}>
        <InteractiveComponent3D
          component={component}
          isSelected={isSelected}
          isPrimary={isPrimary}
          showLabels={showLabels}
          showSnapPoints={showSnapPoints}
          selectedSnapPoint={selectedSnapPoint}
          onClick={onComponentClick}
          onSnapPointClick={onSnapPointClick}
        />
      </group>


    </group>
  )
}

// Camera setup helper
function CameraSetup({ roomDimensions }: { roomDimensions: { width: number; length: number; height: number } }) {
  const { camera } = useThree()

  useEffect(() => {
    // CRITICAL FIX: Calculate camera position to nicely fill the canvas
    const maxDimension = Math.max(roomDimensions.width, roomDimensions.length, roomDimensions.height)
    const distance = maxDimension * 1.0  // Reduced from 1.5 to 1.0 for better zoom

    // Position camera at an angle to frame the room nicely
    camera.position.set(distance, distance * 0.8, distance)
    camera.lookAt(0, roomDimensions.height / 2, 0)  // Look at room center height instead of floor
    
    console.log(`📷 CAMERA SETUP - ROOM FILLING ZOOM:`, {
      roomDimensions,
      maxDimension,
      distance,
      cameraPosition: [distance, distance * 0.8, distance],
      lookAtPoint: [0, roomDimensions.height / 2, 0]
    })
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
  const { dispatch } = useConfigurator()
  const orbitControlsRef = useRef<any>(null)

  // Handle transform changes with boundary checking
  const handleTransformChange = (componentId: string, position: [number, number, number], rotation: [number, number, number]) => {
    dispatch({
      type: "UPDATE_COMPONENT",
      componentId,
      updates: { position, rotation }
    })
  }

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading 3D scene...</span>
              </div>
            </Html>
          }
        >
          {/* Lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />

          {/* Room environment */}
          <RoomEnvironment />

          {/* Scene background */}
          <SceneBackground3D />

          {/* Grid helper */}
          {gridVisible && (
            <GridHelper
              visible={gridVisible}
              size={Math.max(roomDimensions.width, roomDimensions.length)}
            />
          )}

          {/* Components with transform controls */}
          {components.map((component) => {
            const isSelected = selectedComponentIds.includes(component.id)
            const isPrimary = selectedComponentIds.length === 1 && isSelected

            return (
              <ComponentWithTransform
                key={component.id}
                component={component}
                isSelected={isSelected}
                isPrimary={isPrimary}
                showLabels={showLabels}
                showSnapPoints={showSnapPoints}
                selectedSnapPoint={selectedSnapPoint}
                onComponentClick={onComponentClick}
                onSnapPointClick={onSnapPointClick}
                roomDimensions={roomDimensions}
                onTransformChange={handleTransformChange}
              />
            )
          })}

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
            ref={orbitControlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
          <CameraSetup roomDimensions={roomDimensions} />
        </Suspense>
      </Canvas>
      
      {/* Enhanced Camera Controls */}
      <EnhancedCameraControls orbitControlsRef={orbitControlsRef} />
    </div>
  )
}

export default Scene3D
