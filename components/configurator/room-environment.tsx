"use client"

import { useRef, useEffect, useState } from "react"
import { useConfigurator } from "./configurator-context"
import * as THREE from "three"
import { TextureLoader } from "three"

export function RoomEnvironment() {
  const { state } = useConfigurator()
  const groupRef = useRef<THREE.Group>(null)
  const wallsRef = useRef<THREE.Group>(null)

  // Get room dimensions with defaults
  const roomDimensions = state.roomDimensions || { width: 8, length: 6, height: 3 }
  const { width, length, height } = roomDimensions

  // Load textures for surfaces
  const floorTexturePath = state.sceneImageSettings?.floor || null
  const ceilingTexturePath = state.sceneImageSettings?.ceiling || null
  const backWallTexturePath = state.sceneImageSettings?.backWall || null
  const leftWallTexturePath = state.sceneImageSettings?.leftWall || null
  const rightWallTexturePath = state.sceneImageSettings?.rightWall || null

  const [floorTexture, setFloorTexture] = useState<THREE.Texture | null>(null)
  const [ceilingTexture, setCeilingTexture] = useState<THREE.Texture | null>(null)
  const [backWallTexture, setBackWallTexture] = useState<THREE.Texture | null>(null)
  const [leftWallTexture, setLeftWallTexture] = useState<THREE.Texture | null>(null)
  const [rightWallTexture, setRightWallTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (floorTexturePath) {
      new TextureLoader().load(floorTexturePath, setFloorTexture)
    } else {
      setFloorTexture(null)
    }
  }, [floorTexturePath])

  useEffect(() => {
    if (ceilingTexturePath) {
      new TextureLoader().load(ceilingTexturePath, setCeilingTexture)
    } else {
      setCeilingTexture(null)
    }
  }, [ceilingTexturePath])

  useEffect(() => {
    if (backWallTexturePath) {
      new TextureLoader().load(backWallTexturePath, setBackWallTexture)
    } else {
      setBackWallTexture(null)
    }
  }, [backWallTexturePath])

  useEffect(() => {
    if (leftWallTexturePath) {
      new TextureLoader().load(leftWallTexturePath, setLeftWallTexture)
    } else {
      setLeftWallTexture(null)
    }
  }, [leftWallTexturePath])

  useEffect(() => {
    if (rightWallTexturePath) {
      new TextureLoader().load(rightWallTexturePath, setRightWallTexture)
    } else {
      setRightWallTexture(null)
    }
  }, [rightWallTexturePath])

  // Create room geometry
  useEffect(() => {
    if (!groupRef.current) return

    // Clear existing geometry
    groupRef.current.clear()

    // Create materials with error handling
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#fafafa", // Changed from "#f5f5f5" to much lighter
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9, // Increased opacity slightly for better visibility
    })

    const floorMaterial = floorTexture
      ? new THREE.MeshStandardMaterial({
          map: floorTexture,
          roughness: 0.8,
          metalness: 0.1,
        })
      : new THREE.MeshStandardMaterial({
          color: "#e0e0e0",
          roughness: 0.8,
          metalness: 0.1,
        })

    const ceilingMaterial = ceilingTexture
      ? new THREE.MeshStandardMaterial({
          map: ceilingTexture,
          roughness: 0.9,
          metalness: 0.0,
        })
      : new THREE.MeshStandardMaterial({
          color: "#ffffff",
          roughness: 0.9,
          metalness: 0.0,
        })

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(width, length)
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    groupRef.current.add(floor)

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(width, length)
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = height
    ceiling.receiveShadow = true
    groupRef.current.add(ceiling)

    // Walls
    const wallsGroup = new THREE.Group()

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(width, height)
    const backWallMaterial = backWallTexture
      ? new THREE.MeshStandardMaterial({
          map: backWallTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      : new THREE.MeshStandardMaterial({
          color: "#fafafa", // Much lighter wall color
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })

    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial)
    backWall.position.set(0, height / 2, -length / 2)
    backWall.receiveShadow = true
    wallsGroup.add(backWall)

    // Front wall (optional, usually omitted for better view)
    if (state.showFrontWall) {
      const frontWallGeometry = new THREE.PlaneGeometry(width, height)
      const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial)
      frontWall.position.set(0, height / 2, length / 2)
      frontWall.rotation.y = Math.PI
      frontWall.receiveShadow = true
      wallsGroup.add(frontWall)
    }

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(length, height)
    const leftWallMaterial = leftWallTexture
      ? new THREE.MeshStandardMaterial({
          map: leftWallTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      : new THREE.MeshStandardMaterial({
          color: "#fafafa", // Much lighter wall color
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })

    const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial)
    leftWall.position.set(-width / 2, height / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    wallsGroup.add(leftWall)

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(length, height)
    const rightWallMaterial = rightWallTexture
      ? new THREE.MeshStandardMaterial({
          map: rightWallTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      : new THREE.MeshStandardMaterial({
          color: "#fafafa", // Much lighter wall color
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })

    const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial)
    rightWall.position.set(width / 2, height / 2, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.receiveShadow = true
    wallsGroup.add(rightWall)

    groupRef.current.add(wallsGroup)
    wallsRef.current = wallsGroup

    // Add room outline (wireframe)
    const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, length))
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: "#666666",
      transparent: true,
      opacity: 0.3,
    })
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial)
    outline.position.y = height / 2
    groupRef.current.add(outline)
  }, [
    width,
    length,
    height,
    state.showFrontWall,
    state.sceneImageSettings,
    floorTexture,
    ceilingTexture,
    backWallTexture,
    leftWallTexture,
    rightWallTexture,
  ])

  return (
    <group ref={groupRef}>
      {/* Ambient lighting for the room */}
      <ambientLight intensity={0.4} />

      {/* Main directional light */}
      <directionalLight
        position={[width / 2, height + 2, length / 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-width}
        shadow-camera-right={width}
        shadow-camera-top={length}
        shadow-camera-bottom={-length}
      />

      {/* Additional fill light */}
      <directionalLight position={[-width / 2, height, -length / 2]} intensity={0.3} color="#ffffff" />
    </group>
  )
}
