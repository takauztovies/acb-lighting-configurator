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

    console.log(`🌍 WORLD SNAP POINT CALCULATION:`, {
      componentId: component.id,
      componentPosition: component.position,
      componentRotation: component.rotation,
      componentScale: component.scale,
      snapPointId: snapPoint.id,
      snapPointLocalPosition: snapPoint.position
    })

    // Create transformation matrix for the component
    const componentMatrix = new THREE.Matrix4()
    const position = new THREE.Vector3(...(component.position || [0, 0, 0]))
    const rotation = new THREE.Euler(...(component.rotation || [0, 0, 0]))
    const scale = new THREE.Vector3(...(component.scale || [1, 1, 1]))
    
    componentMatrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    
    console.log(`🔧 TRANSFORMATION MATRIX COMPONENTS:`, {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
      scale: [scale.x, scale.y, scale.z]
    })
    
    // Transform snap point position
    const snapPointVector = new THREE.Vector3(...snapPoint.position)
    console.log(`📍 SNAP POINT BEFORE TRANSFORM:`, [snapPointVector.x, snapPointVector.y, snapPointVector.z])
    
    snapPointVector.applyMatrix4(componentMatrix)
    console.log(`🌍 SNAP POINT AFTER TRANSFORM:`, [snapPointVector.x, snapPointVector.y, snapPointVector.z])
    
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
    targetComponent: Component | null,
    targetSnapPoint: SnapPoint | null
  ): { position: [number, number, number]; rotation: [number, number, number] } => {
    console.log(`🔗 SNAP LOGIC - CONNECTION CALCULATION:`, {
      sourceComponent: sourceComponent.name,
      sourceSnapPoint: sourceSnapPoint.name,
      targetComponent: targetComponent?.name || 'Unknown',
      targetSnapPoint: targetSnapPoint?.name || 'Unknown'
    })

    // Safety check for required parameters
    if (!targetComponent || !targetSnapPoint) {
      console.warn('Missing target component or snap point, using default position')
      return {
        position: [0, 2, 0],
        rotation: [0, 0, 0]
      }
    }

    // CORRECT APPROACH: Calculate where the source component needs to be positioned
    // so that its snap point aligns with the target snap point
    
    // 1. Get the world position of the target snap point (where we want to connect)
    const targetWorldPosition = snapLogic.getWorldSnapPointPosition(targetComponent, targetSnapPoint)
    console.log(`🌍 TARGET SNAP POINT WORLD POSITION:`, targetWorldPosition)
    
    // 2. Get the local offset of the source snap point within the source component
    const sourceSnapOffset = sourceSnapPoint.position || [0, 0, 0]
    console.log(`📍 SOURCE SNAP POINT LOCAL OFFSET:`, sourceSnapOffset)
    
    // 3. Calculate where to position the source component so its snap point aligns with target
    // Formula: sourceComponent.position = targetWorldPosition - sourceSnapOffset
    const finalPosition: [number, number, number] = [
      targetWorldPosition[0] - sourceSnapOffset[0],
      targetWorldPosition[1] - sourceSnapOffset[1], 
      targetWorldPosition[2] - sourceSnapOffset[2]
    ]
    
    console.log(`📍 CALCULATED SOURCE COMPONENT POSITION:`, finalPosition)
    console.log(`✅ This should place source snap point at:`, [
      finalPosition[0] + sourceSnapOffset[0],
      finalPosition[1] + sourceSnapOffset[1],
      finalPosition[2] + sourceSnapOffset[2]
    ])
    
    // Use the existing component rotation as default
    const defaultRotation: [number, number, number] = sourceComponent.rotation || [0, 0, 0]
    
    return {
      position: finalPosition,
      rotation: defaultRotation
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
