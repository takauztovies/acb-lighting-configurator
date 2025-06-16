import * as THREE from "three"

export interface SnapPoint {
  id: string
  name: string
  description?: string
  position: [number, number, number]
  rotation?: [number, number, number]
  type: "power" | "mechanical" | "data" | "track" | "mounting" | "accessory"
  subtype?: "male" | "female" | "bidirectional" | "universal"
  maxConnections: number
  compatibleComponents?: string[]
  compatibleSnapTypes?: string[]
  visualIndicator?: {
    shape: "sphere" | "cube" | "cylinder" | "cone"
    color: string
    size: number
    opacity: number
  }
  isRequired?: boolean
  priority?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface AssemblyStep {
  id: string
  title: string
  description: string
  availableComponents: string[]
  targetSnapPoints: string[]
  baseComponent?: string
  isOptional: boolean
  nextSteps: string[]
}

export interface AssemblyWorkflow {
  id: string
  name: string
  description: string
  startingComponent: string
  steps: AssemblyStep[]
}

// Add the missing getDefaultSnapPoint function
export function getDefaultSnapPoint(): Partial<SnapPoint> {
  return {
    name: "New Snap Point",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    type: "mechanical",
    maxConnections: 1,
    compatibleComponents: [],
    compatibleSnapTypes: [],
    visualIndicator: {
      shape: "sphere",
      color: "#3b82f6",
      size: 0.1,
      opacity: 0.8,
    },
    isRequired: false,
    priority: 1,
  }
}

export function validateSnapConnection(
  source: SnapPoint,
  target: SnapPoint,
  sourceType: string,
  targetType: string,
): { isValid: boolean; reason?: string } {
  // Basic validation - check if types are compatible
  if (source.compatibleTypes && !source.compatibleTypes.includes(targetType)) {
    return { isValid: false, reason: `${sourceType} is not compatible with ${targetType}` }
  }

  if (target.compatibleTypes && !target.compatibleTypes.includes(sourceType)) {
    return { isValid: false, reason: `${targetType} is not compatible with ${sourceType}` }
  }

  return { isValid: true }
}

export function findNearestSnapPoint(
  position: [number, number, number],
  snapPoints: Array<{ snapPoint: SnapPoint; worldPosition: [number, number, number] }>,
  threshold: number,
): { snapPoint: SnapPoint; worldPosition: [number, number, number]; distance: number } | null {
  if (snapPoints.length === 0) return null

  // Find the nearest snap point
  let nearest = null
  let minDistance = Number.POSITIVE_INFINITY

  for (const point of snapPoints) {
    const distance = new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...point.worldPosition))
    if (distance < minDistance && distance < threshold) {
      minDistance = distance
      nearest = { ...point, distance }
    }
  }

  return nearest
}
