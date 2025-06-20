// Enhanced snap logic implementation
import * as THREE from "three"

export interface SnapPoint {
  id: string
  name: string
  type: "power" | "mechanical" | "data" | "track" | "mounting" | "accessory"
  position: [number, number, number]
  rotation?: [number, number, number]
  compatibleTypes?: string[]
}

export interface Component {
  id: string
  name: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  snapPoints?: SnapPoint[]
  [key: string]: any
}

export const snapLogic = {
  // Calculate world position of a snap point based on component transform
  getWorldSnapPointPosition: (component: Component, snapPoint: SnapPoint): [number, number, number] => {
    if (!component || !snapPoint) {
      console.warn('Invalid component or snap point provided')
      return [0, 0, 0]
    }

    // Create transformation matrix for the component
    const componentMatrix = new THREE.Matrix4()
    const position = new THREE.Vector3(...(component.position || [0, 0, 0]))
    const rotation = new THREE.Euler(...(component.rotation || [0, 0, 0]))
    const scale = new THREE.Vector3(...(component.scale || [1, 1, 1]))
    
    componentMatrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    
    // Transform snap point position
    const snapPointVector = new THREE.Vector3(...snapPoint.position)
    snapPointVector.applyMatrix4(componentMatrix)
    
    return [snapPointVector.x, snapPointVector.y, snapPointVector.z]
  },

  // Calculate world rotation of a snap point based on component transform
  getWorldSnapPointRotation: (component: Component, snapPoint: SnapPoint): [number, number, number] => {
    if (!component || !snapPoint) {
      return [0, 0, 0]
    }

    const componentRotation = new THREE.Euler(...(component.rotation || [0, 0, 0]))
    const snapPointRotation = new THREE.Euler(...(snapPoint.rotation || [0, 0, 0]))
    
    // Combine rotations
    const combinedQuaternion = new THREE.Quaternion()
      .setFromEuler(componentRotation)
      .multiply(new THREE.Quaternion().setFromEuler(snapPointRotation))
    
    const resultEuler = new THREE.Euler().setFromQuaternion(combinedQuaternion)
    return [resultEuler.x, resultEuler.y, resultEuler.z]
  },

  // Check if two snap points are compatible for connection
  areSnapPointsCompatible: (snapPoint1: SnapPoint, snapPoint2: SnapPoint): boolean => {
    if (!snapPoint1 || !snapPoint2) return false
    
    // Check direct type compatibility
    if (snapPoint1.type === snapPoint2.type) return true
    
    // Check compatible types arrays
    if (snapPoint1.compatibleTypes?.includes(snapPoint2.type)) return true
    if (snapPoint2.compatibleTypes?.includes(snapPoint1.type)) return true
    
    // Special compatibility rules
    const compatibilityRules: Record<string, string[]> = {
      power: ["mechanical", "mounting"],
      mechanical: ["power", "track", "mounting"],
      track: ["mechanical", "accessory"],
      mounting: ["power", "mechanical"],
      accessory: ["track", "mechanical"]
    }
    
    return compatibilityRules[snapPoint1.type]?.includes(snapPoint2.type) || false
  },

  // Calculate position for connecting component to a snap point
  calculateConnectionPosition: (
    sourceComponent: Component,
    sourceSnapPoint: SnapPoint,
    targetComponent: Component,
    targetSnapPoint: SnapPoint
  ): { position: [number, number, number]; rotation: [number, number, number] } => {
    // Get world positions of snap points
    const sourceWorldPos = snapLogic.getWorldSnapPointPosition(sourceComponent, sourceSnapPoint)
    const targetLocalPos = targetSnapPoint.position

    // Calculate offset from target component origin to its snap point
    const targetOffset = new THREE.Vector3(...targetLocalPos)

    // Calculate where the target component should be positioned
    // so that its snap point aligns with the source snap point
    const targetPosition = new THREE.Vector3(...sourceWorldPos).sub(targetOffset)

    // Calculate rotation alignment
    const sourceWorldRot = snapLogic.getWorldSnapPointRotation(sourceComponent, sourceSnapPoint)
    const targetSnapRot = targetSnapPoint.rotation || [0, 0, 0]
    
    // For connection, we typically want opposite orientations (one pointing in, one out)
    const connectionRotation: [number, number, number] = [
      sourceWorldRot[0] + Math.PI, // Flip X to face opposite direction
      sourceWorldRot[1],
      sourceWorldRot[2]
    ]

    return {
      position: [targetPosition.x, targetPosition.y, targetPosition.z],
      rotation: connectionRotation
    }
  },

  // Find the best snap point on a component for connection
  findBestSnapPoint: (component: Component, targetType: string): SnapPoint | null => {
    if (!component.snapPoints || component.snapPoints.length === 0) {
      return null
    }

    // Look for exact type match first
    let bestSnapPoint = component.snapPoints.find(sp => sp.type === targetType)
    
    // If no exact match, look for compatible type
    if (!bestSnapPoint) {
      bestSnapPoint = component.snapPoints.find(sp => 
        sp.compatibleTypes?.includes(targetType)
      )
    }

    // If still no match, use the first available snap point
    if (!bestSnapPoint) {
      bestSnapPoint = component.snapPoints[0]
    }

    return bestSnapPoint || null
  },

  // Calculate distance between two snap points
  getSnapPointDistance: (
    component1: Component,
    snapPoint1: SnapPoint,
    component2: Component,
    snapPoint2: SnapPoint
  ): number => {
    const pos1 = snapLogic.getWorldSnapPointPosition(component1, snapPoint1)
    const pos2 = snapLogic.getWorldSnapPointPosition(component2, snapPoint2)
    
    const dx = pos1[0] - pos2[0]
    const dy = pos1[1] - pos2[1]
    const dz = pos1[2] - pos2[2]
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}

export default snapLogic
