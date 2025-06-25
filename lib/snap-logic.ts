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

    // Use high precision for calculations
    const pos = new THREE.Vector3(...(component.position || [0, 0, 0]))
    const rot = new THREE.Euler(...(component.rotation || [0, 0, 0]), 'XYZ')
    const scale = new THREE.Vector3(...(component.scale || [1, 1, 1]))
    
    // Create transformation matrix with high precision
    const transformMatrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion().setFromEuler(rot)
    transformMatrix.compose(pos, quaternion, scale)
    
    console.log(`🔧 HIGH PRECISION TRANSFORMATION:`, {
      position: [pos.x, pos.y, pos.z],
      rotation: [rot.x, rot.y, rot.z],
      scale: [scale.x, scale.y, scale.z],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    })
    
    // Transform snap point with high precision
    const snapVector = new THREE.Vector3(...snapPoint.position)
    console.log(`📍 SNAP POINT BEFORE TRANSFORM:`, [snapVector.x, snapVector.y, snapVector.z])
    
    snapVector.applyMatrix4(transformMatrix)
    
    // Round to avoid floating point drift (to 6 decimal places for precision)
    const worldPos: [number, number, number] = [
      Math.round(snapVector.x * 1000000) / 1000000,
      Math.round(snapVector.y * 1000000) / 1000000,
      Math.round(snapVector.z * 1000000) / 1000000
    ]
    
    console.log(`🌍 HIGH PRECISION WORLD POSITION:`, worldPos)
    
    return worldPos
  },

  // Calculate world rotation of a snap point based on component transform
  getWorldSnapPointRotation: (component: Component, snapPoint: SnapPoint): [number, number, number] => {
    if (!component || !snapPoint) {
      return [0, 0, 0]
    }

    const componentRotation = new THREE.Euler(...(component.rotation || [0, 0, 0]), 'XYZ')
    const snapPointRotation = new THREE.Euler(...(snapPoint.rotation || [0, 0, 0]), 'XYZ')
    
    // Use quaternions for precise rotation combination
    const combinedQuaternion = new THREE.Quaternion()
      .setFromEuler(componentRotation)
      .multiply(new THREE.Quaternion().setFromEuler(snapPointRotation))
    
    const resultEuler = new THREE.Euler().setFromQuaternion(combinedQuaternion, 'XYZ')
    
    // Round to avoid floating point drift
    return [
      Math.round(resultEuler.x * 1000000) / 1000000,
      Math.round(resultEuler.y * 1000000) / 1000000,
      Math.round(resultEuler.z * 1000000) / 1000000
    ]
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

  // HIGH PRECISION Calculate position for connecting component to a snap point
  calculateConnectionPosition: (
    sourceComponent: Component,
    sourceSnapPoint: SnapPoint,
    targetComponent: Component | null,
    targetSnapPoint: SnapPoint | null
  ): { position: [number, number, number]; rotation: [number, number, number] } => {
    console.log(`🔗 HIGH PRECISION SNAP CALCULATION START:`, {
      sourceComponent: {
        name: sourceComponent.name,
        type: sourceComponent.type,
        position: sourceComponent.position,
        rotation: sourceComponent.rotation,
        scale: sourceComponent.scale
      },
      sourceSnapPoint: {
        name: sourceSnapPoint.name,
        position: sourceSnapPoint.position,
        type: sourceSnapPoint.type
      },
      targetComponent: {
        name: targetComponent?.name || 'Unknown',
        type: targetComponent?.type || 'Unknown',
        scale: targetComponent?.scale || [1, 1, 1],
        rotation: targetComponent?.rotation || [0, 0, 0]
      },
      targetSnapPoint: {
        name: targetSnapPoint?.name || 'Unknown',
        position: targetSnapPoint?.position || [0, 0, 0]
      }
    })

    // Safety check for required parameters
    if (!targetComponent || !targetSnapPoint) {
      console.warn('Missing target component or snap point, using default position')
      return {
        position: [0, 2, 0],
        rotation: [0, 0, 0]
      }
    }

    // STEP 1: Get high precision world position of the SOURCE snap point
    const sourceWorldPosition = snapLogic.getWorldSnapPointPosition(sourceComponent, sourceSnapPoint)
    console.log(`🌍 SOURCE SNAP POINT WORLD POSITION (HIGH PRECISION):`, sourceWorldPosition)
    
    // STEP 2: Calculate target component transformation matrices with high precision
    const targetRotation = targetComponent.rotation || [0, 0, 0]
    const targetScale = targetComponent.scale || [1, 1, 1]
    const targetSnapOffset = targetSnapPoint.position || [0, 0, 0]
    
    // Use high precision vectors and matrices
    const rotEuler = new THREE.Euler(...targetRotation, 'XYZ')
    const scaleVec = new THREE.Vector3(...targetScale)
    const snapOffsetVec = new THREE.Vector3(...targetSnapOffset)
    
    // Create transformation matrix (rotation + scale only, no position)
    const transformMatrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion().setFromEuler(rotEuler)
    const zeroPos = new THREE.Vector3(0, 0, 0)
    
    transformMatrix.compose(zeroPos, quaternion, scaleVec)
    
    console.log(`🔄 TARGET COMPONENT HIGH PRECISION TRANSFORMATIONS:`, {
      rotation: targetRotation,
      rotationDegrees: [
        (targetRotation[0] * 180 / Math.PI).toFixed(3),
        (targetRotation[1] * 180 / Math.PI).toFixed(3),
        (targetRotation[2] * 180 / Math.PI).toFixed(3)
      ],
      scale: targetScale,
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    })
    
    // Apply transformation to snap point offset with high precision
    snapOffsetVec.applyMatrix4(transformMatrix)
    
    const transformedOffset: [number, number, number] = [
      Math.round(snapOffsetVec.x * 1000000) / 1000000,
      Math.round(snapOffsetVec.y * 1000000) / 1000000,
      Math.round(snapOffsetVec.z * 1000000) / 1000000
    ]
    
    console.log(`🔧 TARGET SNAP POINT TRANSFORMED OFFSET (HIGH PRECISION):`, transformedOffset)
    
    // STEP 3: Calculate final position with high precision arithmetic
    // Formula: newComponent.position = sourceWorldPosition - transformedTargetSnapOffset
    let finalPosition: [number, number, number] = [
      Math.round((sourceWorldPosition[0] - transformedOffset[0]) * 1000000) / 1000000,
      Math.round((sourceWorldPosition[1] - transformedOffset[1]) * 1000000) / 1000000, 
      Math.round((sourceWorldPosition[2] - transformedOffset[2]) * 1000000) / 1000000
    ]
    
    console.log(`📍 HIGH PRECISION CALCULATION RESULT:`, finalPosition)
    
    // STEP 4: Special ceiling mounting preservation
    const sourceIsCeilingConnector = sourceComponent.type.includes('connector') && sourceComponent.position[1] > 2.0
    const targetIsTrack = targetComponent.type.includes('track') || targetComponent.type.includes('profile')
    
    console.log(`🔍 CEILING DETECTION:`, {
      sourceIsCeilingConnector,
      targetIsTrack,
      sourcePosition: sourceComponent.position,
      sourceType: sourceComponent.type
    })
    
    if (sourceIsCeilingConnector && targetIsTrack) {
      // Preserve exact ceiling level with high precision
      const ceilingY = Math.round((sourceComponent.position[1] + 0.1) * 1000000) / 1000000
      finalPosition = [finalPosition[0], ceilingY, finalPosition[2]]
      
      console.log(`🔧 CEILING CORRECTION APPLIED (HIGH PRECISION):`, {
        originalPosition: [sourceWorldPosition[0] - transformedOffset[0], sourceWorldPosition[1] - transformedOffset[1], sourceWorldPosition[2] - transformedOffset[2]],
        correctedPosition: finalPosition,
        reason: 'Forcing track to ceiling level for ceiling connector'
      })
    }
    
    console.log(`📍 FINAL HIGH PRECISION POSITION:`, finalPosition)
    
    // STEP 5: Calculate rotation with intelligent orientation
    let finalRotation: [number, number, number] = [0, 0, 0]
    
    const isTrackOrProfile = targetComponent.type.includes('track') || 
                            targetComponent.type.includes('profile') ||
                            targetComponent.type.includes('pipe')
    
    console.log(`🎯 ROTATION CALCULATION START:`, {
      componentType: targetComponent.type,
      isTrackOrProfile,
      sourceComponentType: sourceComponent.type,
      sourcePosition: sourceComponent.position
    })
    
    if (isTrackOrProfile) {
      // Default to horizontal for track models (90° X-axis rotation)
      let preferredRotation: [number, number, number] = [Math.PI/2, 0, 0]
      
      console.log(`🎯 DEFAULT HORIZONTAL ROTATION:`, preferredRotation, {
        degrees: [(Math.PI/2 * 180 / Math.PI).toFixed(1), '0.0', '0.0']
      })
      
      // Force horizontal for ceiling connectors
      if (sourceIsCeilingConnector) {
        preferredRotation = [Math.PI/2, 0, 0]
        console.log(`🎯 CEILING CONNECTOR FORCES HORIZONTAL:`, preferredRotation)
      }
      
      // Check boundary collision with high precision
      const roomDimensions = { width: 8, length: 6, height: 3 }
      const trackLength = 0.3 // 30cm
      const halfLength = trackLength / 2
      
      const wouldHitWall = (
        finalPosition[0] - halfLength < -roomDimensions.width/2 ||
        finalPosition[0] + halfLength > roomDimensions.width/2 ||
        finalPosition[2] - halfLength < -roomDimensions.length/2 ||
        finalPosition[2] + halfLength > roomDimensions.length/2
      )
      
      console.log(`🎯 BOUNDARY CHECK (HIGH PRECISION):`, {
        trackLength,
        halfLength,
        finalPosition,
        roomDimensions,
        wouldHitWall,
        xRange: [finalPosition[0] - halfLength, finalPosition[0] + halfLength],
        zRange: [finalPosition[2] - halfLength, finalPosition[2] + halfLength],
        roomXRange: [-roomDimensions.width/2, roomDimensions.width/2],
        roomZRange: [-roomDimensions.length/2, roomDimensions.length/2]
      })
      
      if (wouldHitWall) {
        // Vertical downward if horizontal hits walls
        preferredRotation = [0, 0, 0]
        console.log(`🎯 WALL COLLISION - VERTICAL DOWNWARD:`, preferredRotation)
      }
      
      finalRotation = preferredRotation
      
    } else {
      // Non-track components keep their original rotation
      finalRotation = targetComponent.rotation || [0, 0, 0]
      console.log(`🎯 NON-TRACK COMPONENT - ORIGINAL ROTATION:`, finalRotation)
    }
    
    // Round rotation to avoid floating point drift
    finalRotation = [
      Math.round(finalRotation[0] * 1000000) / 1000000,
      Math.round(finalRotation[1] * 1000000) / 1000000,
      Math.round(finalRotation[2] * 1000000) / 1000000
    ]
    
    console.log(`🔄 FINAL HIGH PRECISION ROTATION:`, {
      finalRotation,
      finalRotationDegrees: [
        (finalRotation[0] * 180 / Math.PI).toFixed(3),
        (finalRotation[1] * 180 / Math.PI).toFixed(3),
        (finalRotation[2] * 180 / Math.PI).toFixed(3)
      ]
    })
    
    const result = {
      position: finalPosition,
      rotation: finalRotation
    }
    
    console.log(`✅ HIGH PRECISION SNAP LOGIC RESULT:`, result)
    
    return result
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
