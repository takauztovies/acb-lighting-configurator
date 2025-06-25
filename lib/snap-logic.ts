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
    console.log(`🔗 SNAP LOGIC - CONNECTION CALCULATION START:`, {
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

    // STEP 1: Get the world position of the SOURCE snap point (the selected snap point on existing component)
    const sourceWorldPosition = snapLogic.getWorldSnapPointPosition(sourceComponent, sourceSnapPoint)
    console.log(`🌍 SOURCE SNAP POINT WORLD POSITION:`, sourceWorldPosition)
    
    // STEP 2: Get the local offset of the target snap point within the new component
    const targetSnapOffset = targetSnapPoint.position || [0, 0, 0]
    console.log(`📍 TARGET SNAP POINT LOCAL OFFSET:`, targetSnapOffset)
    
    // STEP 3: Account for target component transformations (rotation + scale)
    const targetRotation = targetComponent.rotation || [0, 0, 0]
    const targetScale = targetComponent.scale || [1, 1, 1]
    
    // Create transformation matrix (without position, just rotation and scale)
    const transformMatrix = new THREE.Matrix4()
    const rotation = new THREE.Euler(...targetRotation)
    const scale = new THREE.Vector3(...targetScale)
    const position = new THREE.Vector3(0, 0, 0) // Zero position for offset calculation
    
    transformMatrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    
    // Apply transformation to the target snap point offset
    const snapPointVector = new THREE.Vector3(...targetSnapOffset)
    console.log(`📍 TARGET SNAP POINT BEFORE TRANSFORM:`, [snapPointVector.x, snapPointVector.y, snapPointVector.z])
    
    snapPointVector.applyMatrix4(transformMatrix)
    
    const transformedOffset: [number, number, number] = [
      snapPointVector.x,
      snapPointVector.y,
      snapPointVector.z
    ]
    
    console.log(`🔄 TARGET COMPONENT TRANSFORMATIONS:`, {
      rotation: targetRotation,
      rotationDegrees: [
        (targetRotation[0] * 180 / Math.PI).toFixed(1),
        (targetRotation[1] * 180 / Math.PI).toFixed(1),
        (targetRotation[2] * 180 / Math.PI).toFixed(1)
      ],
      scale: targetScale
    })
    console.log(`🔧 TARGET SNAP POINT AFTER TRANSFORM:`, transformedOffset)
    
    // STEP 4: Calculate final position
    // Formula: newComponent.position = sourceWorldPosition - transformedTargetSnapOffset
    let finalPosition: [number, number, number] = [
      sourceWorldPosition[0] - transformedOffset[0],
      sourceWorldPosition[1] - transformedOffset[1], 
      sourceWorldPosition[2] - transformedOffset[2]
    ]
    
    console.log(`📍 BASIC CALCULATION RESULT:`, finalPosition)
    
    // STEP 4.5: Check for ceiling-mounted track connection correction
    const sourceIsCeilingConnector = sourceComponent.type.includes('connector') && sourceComponent.position[1] > 2.0
    const targetIsTrack = targetComponent.type.includes('track') || targetComponent.type.includes('profile')
    
    console.log(`🔍 CEILING DETECTION:`, {
      sourceIsCeilingConnector,
      targetIsTrack,
      sourcePosition: sourceComponent.position,
      sourceType: sourceComponent.type
    })
    
    if (sourceIsCeilingConnector && targetIsTrack) {
      // Keep X and Z from calculation, but force Y to be near ceiling
      const ceilingY = sourceComponent.position[1] + 0.1 // Slightly above connector
      finalPosition = [finalPosition[0], ceilingY, finalPosition[2]]
      
      console.log(`🔧 CEILING CORRECTION APPLIED:`, {
        originalPosition: [sourceWorldPosition[0] - transformedOffset[0], sourceWorldPosition[1] - transformedOffset[1], sourceWorldPosition[2] - transformedOffset[2]],
        correctedPosition: finalPosition,
        reason: 'Forcing track to ceiling level for ceiling connector'
      })
    }
    
    console.log(`📍 FINAL CALCULATED POSITION:`, finalPosition)
    
    // STEP 5: Calculate proper rotation for tracks/profiles with intelligent orientation
    let finalRotation: [number, number, number] = [0, 0, 0]
    
    // Check if this is a track/profile component
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
      // ULTRA ROBUST TRACK/PROFILE ROTATION LOGIC
      
             // Rule 1: Default to horizontal (track models need 90° X-axis rotation to be horizontal)
       let preferredRotation: [number, number, number] = [Math.PI/2, 0, 0] // 90° around X-axis = horizontal for track models
       
       console.log(`🎯 RULE 1 - DEFAULT HORIZONTAL (track models):`, preferredRotation, {
         degrees: [(Math.PI/2 * 180 / Math.PI).toFixed(1), '0.0', '0.0']
       })
       
       // Rule 2: Check room boundaries to see if horizontal fits
       // For now, assume room boundaries allow horizontal (we'll add boundary checks later)
       const roomDimensions = { width: 8, length: 6, height: 3 } // Default room
       
       // Rule 3: If this is a ceiling connector, DEFINITELY make it horizontal
       if (sourceIsCeilingConnector) {
         preferredRotation = [Math.PI/2, 0, 0] // 90° X-axis = horizontal for track models
         console.log(`🎯 RULE 3 - CEILING CONNECTOR FORCES HORIZONTAL:`, preferredRotation, {
           degrees: [(Math.PI/2 * 180 / Math.PI).toFixed(1), '0.0', '0.0']
         })
       }
      
      // Rule 4: Check if horizontal would go outside room boundaries
      // Estimate track length (assume 30cm default length)
      const trackLength = 0.3 // 30cm
      const halfLength = trackLength / 2
      
      const wouldHitWall = (
        finalPosition[0] - halfLength < -roomDimensions.width/2 ||
        finalPosition[0] + halfLength > roomDimensions.width/2 ||
        finalPosition[2] - halfLength < -roomDimensions.length/2 ||
        finalPosition[2] + halfLength > roomDimensions.length/2
      )
      
      console.log(`🎯 RULE 4 - BOUNDARY CHECK:`, {
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
         // Rule 5: If horizontal hits wall, go vertical pointing DOWN (not up)
         // For track models: 0° X-axis = vertical, Math.PI = upside down vertical
         preferredRotation = [0, 0, 0] // 0° around X-axis = pointing down for track models
         console.log(`🎯 RULE 5 - WALL COLLISION, GOING VERTICAL DOWNWARD:`, preferredRotation, {
           degrees: ['0.0', '0.0', '0.0']
         })
       }
      
      finalRotation = preferredRotation
      
      console.log(`🎯 FINAL TRACK ROTATION DECISION:`, {
        finalRotation,
        finalRotationDegrees: [
          (finalRotation[0] * 180 / Math.PI).toFixed(1),
          (finalRotation[1] * 180 / Math.PI).toFixed(1),
          (finalRotation[2] * 180 / Math.PI).toFixed(1)
        ],
        reasoning: wouldHitWall ? 'Vertical downward due to wall collision' : 'Horizontal as preferred'
      })
      
    } else {
      // For other components (like connectors), use their intended rotation  
      finalRotation = targetComponent.rotation || [0, 0, 0]
      console.log(`🎯 NON-TRACK COMPONENT - USING ORIGINAL ROTATION:`, finalRotation)
    }
    
    console.log(`🔄 FINAL ROTATION RESULT:`, {
      componentType: targetComponent.type,
      isTrackOrProfile,
      finalRotation,
      finalRotationDegrees: [
        (finalRotation[0] * 180 / Math.PI).toFixed(1),
        (finalRotation[1] * 180 / Math.PI).toFixed(1),
        (finalRotation[2] * 180 / Math.PI).toFixed(1)
      ]
    })
    
    const result = {
      position: finalPosition,
      rotation: finalRotation
    }
    
    console.log(`✅ SNAP LOGIC FINAL RESULT:`, result)
    
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
