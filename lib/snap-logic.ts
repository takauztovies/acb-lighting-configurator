// Enhanced snap logic implementation with perfect alignment
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
  connections?: string[]
  [key: string]: any
}

export const snapLogic = {
  // Calculate world position of a snap point using proper 3D transformations
  getWorldSnapPointPosition: (component: Component, snapPoint: SnapPoint): [number, number, number] => {
    if (!component || !snapPoint) {
      console.warn('Invalid component or snap point provided')
      return [0, 0, 0]
    }

    // Component transform data
    const componentPos = component.position || [0, 0, 0]
    const componentRot = component.rotation || [0, 0, 0]
    const componentScale = component.scale || [1, 1, 1]
    const snapPointLocal = snapPoint.position || [0, 0, 0]
    
    // Create transformation matrices
    const translationMatrix = new THREE.Matrix4().makeTranslation(
      componentPos[0], componentPos[1], componentPos[2]
    )
    
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(componentRot[0], componentRot[1], componentRot[2], 'XYZ')
    )
    
    const scaleMatrix = new THREE.Matrix4().makeScale(
      componentScale[0], componentScale[1], componentScale[2]
    )
    
    // Combine transformations: Translation * Rotation * Scale
    const transformMatrix = new THREE.Matrix4()
      .multiplyMatrices(translationMatrix, rotationMatrix)
      .multiply(scaleMatrix)
    
    // Transform the local snap point position to world space
    const localSnapVector = new THREE.Vector3(
      snapPointLocal[0], snapPointLocal[1], snapPointLocal[2]
    )
    
    const worldSnapVector = localSnapVector.applyMatrix4(transformMatrix)
    
    const worldPos: [number, number, number] = [
      worldSnapVector.x,
      worldSnapVector.y, 
      worldSnapVector.z
    ]
    
    console.log(`🌍 PRECISE WORLD SNAP POSITION:`, {
      componentId: component.id,
      componentPos,
      componentRot,
      componentScale,
      snapPointLocal,
      worldPos
    })
    
    return worldPos
  },

  // Calculate world rotation of a snap point using proper 3D transformations
  getWorldSnapPointRotation: (component: Component, snapPoint: SnapPoint): [number, number, number] => {
    if (!component || !snapPoint) {
      return [0, 0, 0]
    }

    // Component and snap point rotations
    const componentRot = component.rotation || [0, 0, 0]
    const snapPointRot = snapPoint.rotation || [0, 0, 0]
    
    // Create rotation matrices
    const componentRotMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(componentRot[0], componentRot[1], componentRot[2], 'XYZ')
    )
    
    const snapRotMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(snapPointRot[0], snapPointRot[1], snapPointRot[2], 'XYZ')
    )
    
    // Combine rotations
    const finalRotMatrix = new THREE.Matrix4().multiplyMatrices(componentRotMatrix, snapRotMatrix)
    
    // Extract Euler angles
    const euler = new THREE.Euler().setFromRotationMatrix(finalRotMatrix, 'XYZ')
    
    return [euler.x, euler.y, euler.z]
  },

  // Check if two snap points are compatible for connection
  areSnapPointsCompatible: (snapPoint1: SnapPoint, snapPoint2: SnapPoint, component1?: Component, component2?: Component): boolean => {
    if (!snapPoint1 || !snapPoint2) return false
    
    // NEW STRICT COMPATIBILITY RULES based on component types and snap point types
    
    // Rule 1: Track snap points on connectors/caps can ONLY connect to tracks/profiles
    if (snapPoint1.type === "track" && component1?.type === "connector") {
      return snapPoint2.type === "track" && (component2?.type === "track" || component2?.type === "profile")
    }
    if (snapPoint2.type === "track" && component2?.type === "connector") {
      return snapPoint1.type === "track" && (component1?.type === "track" || component1?.type === "profile")
    }
    
    // Rule 2: Track snap points on tracks/profiles can ONLY connect to connectors or caps
    if (snapPoint1.type === "track" && (component1?.type === "track" || component1?.type === "profile")) {
      return snapPoint2.type === "track" && component2?.type === "connector"
    }
    if (snapPoint2.type === "track" && (component2?.type === "track" || component2?.type === "profile")) {
      return snapPoint1.type === "track" && component1?.type === "connector"
    }
    
    // Rule 3: Mounting snap points connect lamps/pendants to connectors
    if (snapPoint1.type === "mounting") {
      return (snapPoint2.type === "mechanical" && (component2?.type === "spotlight" || component2?.name?.toLowerCase().includes('pendant'))) ||
             (snapPoint2.type === "mounting" && component2?.type === "connector")
    }
    if (snapPoint2.type === "mounting") {
      return (snapPoint1.type === "mechanical" && (component1?.type === "spotlight" || component1?.name?.toLowerCase().includes('pendant'))) ||
             (snapPoint1.type === "mounting" && component1?.type === "connector")
    }
    
    // Rule 4: Mechanical snap points on pendants connect to lamps or mounting points on connectors
    if (snapPoint1.type === "mechanical" && component1?.name?.toLowerCase().includes('pendant')) {
      return (snapPoint2.type === "mechanical" && component2?.type === "spotlight") ||
             (snapPoint2.type === "mounting" && component2?.type === "connector")
    }
    if (snapPoint2.type === "mechanical" && component2?.name?.toLowerCase().includes('pendant')) {
      return (snapPoint1.type === "mechanical" && component1?.type === "spotlight") ||
             (snapPoint1.type === "mounting" && component1?.type === "connector")
    }
    
    // Rule 5: Mechanical snap points on lamps connect to mounting points
    if (snapPoint1.type === "mechanical" && component1?.type === "spotlight") {
      return snapPoint2.type === "mounting"
    }
    if (snapPoint2.type === "mechanical" && component2?.type === "spotlight") {
      return snapPoint1.type === "mounting"
    }
    
    // Rule 6: Power snap points for general electrical connections
    if (snapPoint1.type === "power" || snapPoint2.type === "power") {
      return snapPoint1.type === "power" && snapPoint2.type === "power"
    }
    
    // No other combinations are allowed by default
    console.log(`🚫 SNAP POINT COMPATIBILITY REJECTED:`, {
      snapPoint1: { type: snapPoint1.type, component: component1?.type },
      snapPoint2: { type: snapPoint2.type, component: component2?.type },
      reason: "No matching compatibility rule found"
    })
    
    return false
  },

  // Check if a snap point is already connected to another component
  isSnapPointConnected: (component: Component, snapPointId: string): boolean => {
    if (!component.connections || component.connections.length === 0) {
      return false
    }
    
    // Check if this snap point ID appears in the connections array
    return component.connections.includes(snapPointId)
  },

  // Get all connected snap points for a component
  getConnectedSnapPoints: (component: Component): string[] => {
    return component.connections || []
  },

  // PERFECT ALIGNMENT: Calculate position and rotation for connecting component to a snap point
  calculateConnectionPosition: (
    sourceComponent: Component,
    sourceSnapPoint: SnapPoint,
    targetComponent: Component | null,
    targetSnapPoint: SnapPoint | null
  ): { position: [number, number, number]; rotation: [number, number, number] } => {
    console.log(`🔗 PERFECT ALIGNMENT CALCULATION START:`, {
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

    // STEP 1: Get source snap point world position (where we want to connect TO)
    const sourceWorldPos = snapLogic.getWorldSnapPointPosition(sourceComponent, sourceSnapPoint)
    const sourceWorldRot = snapLogic.getWorldSnapPointRotation(sourceComponent, sourceSnapPoint)
    
    console.log(`🌍 SOURCE SNAP POINT:`, {
      worldPosition: sourceWorldPos,
      worldRotation: sourceWorldRot
    })
    
    // STEP 2: Calculate what the target component's position should be
    // so that its snap point world position exactly matches the source snap point
    
    // We need to solve: sourceWorldPos = targetPos + transformedTargetSnapPoint
    // Therefore: targetPos = sourceWorldPos - transformedTargetSnapPoint
    
    const targetScale = targetComponent.scale || [1, 1, 1]
    const targetSnapLocal = targetSnapPoint.position || [0, 0, 0]
    
    // For perfect alignment, we start with the assumption that components have the same orientation
    // then we'll adjust for special cases
    let targetRotation: [number, number, number] = [0, 0, 0]
    
    // STEP 3: Determine proper orientation based on component types and source direction
    const sourceIsCeilingConnector = sourceComponent.type.includes('connector') && sourceComponent.position[1] > 2.5
    const sourceIsEasyLinkEndCap = sourceComponent.name?.toLowerCase().includes('easy link end cap white')
    const sourceIsTrack = sourceComponent.type.includes('track') || sourceComponent.type.includes('profile')
    const targetIsTrack = targetComponent.type.includes('track') || targetComponent.type.includes('profile')
    const targetIsEndCap = targetComponent.name?.toLowerCase().includes('easy link end cap white') || 
                          (targetComponent.type.includes('connector') && targetComponent.name?.toLowerCase().includes('cap'))
    const targetIsPendant = targetComponent.type.includes('spotlight') && 
                           targetComponent.name?.toLowerCase().includes('pendant')
    
    console.log(`🔍 COMPONENT TYPE ANALYSIS:`, {
      sourceIsCeilingConnector,
      sourceIsEasyLinkEndCap,
      sourceIsTrack,
      targetIsTrack,
      targetIsEndCap,
      targetIsPendant,
      sourceType: sourceComponent.type,
      targetType: targetComponent.type
    })
    
    if (targetIsTrack && (sourceIsCeilingConnector || sourceIsEasyLinkEndCap)) {
      // FIX: Calculate track direction based on source component's orientation
      // The track should extend in the direction the cap/connector is facing
      
      // Get the source component's rotation to determine the facing direction
      const sourceRotation = sourceComponent.rotation || [0, 0, 0]
      
      // For tracks, we want them to be horizontal (lying flat) but oriented correctly
      // The X rotation makes it horizontal, Y rotation controls the direction
      targetRotation = [
        Math.PI / 2,  // X: 90° to make track horizontal (lying flat)
        sourceRotation[1], // Y: Use source's Y rotation to match direction
        sourceRotation[2]  // Z: Use source's Z rotation if any
      ]
      
      console.log(`🎯 CORRECTED TRACK DIRECTION CALCULATION:`, {
          sourceComponent: sourceComponent.name,
          sourceSnapPoint: sourceSnapPoint.name,
          sourceRotation: {
            radians: [sourceRotation[0].toFixed(4), sourceRotation[1].toFixed(4), sourceRotation[2].toFixed(4)],
            degrees: [(sourceRotation[0] * 180 / Math.PI).toFixed(1), (sourceRotation[1] * 180 / Math.PI).toFixed(1), (sourceRotation[2] * 180 / Math.PI).toFixed(1)]
          },
          finalRotation: {
            radians: [targetRotation[0].toFixed(4), targetRotation[1].toFixed(4), targetRotation[2].toFixed(4)],
            degrees: [(targetRotation[0] * 180 / Math.PI).toFixed(1), (targetRotation[1] * 180 / Math.PI).toFixed(1), (targetRotation[2] * 180 / Math.PI).toFixed(1)]
          },
          reasoning: "Track inherits source component's Y and Z rotation for correct direction"
        })
      
    } else if (sourceIsTrack && targetIsEndCap) {
      // SPECIAL CASE: Track connecting to end cap
      // The cap should face back toward the track, and only the cap's tail should overlap
      
      // Get the source track's rotation 
      const sourceRotation = sourceComponent.rotation || [0, 0, 0]
      
      // Cap should face opposite direction to the track's extension direction
      // If track is horizontal and extending in +X direction, cap should face -X direction
      targetRotation = [
        0,                          // X: Keep cap upright (not tilted)
        sourceRotation[1] + Math.PI, // Y: Face opposite direction (180° rotation)
        sourceRotation[2]           // Z: Use same Z rotation as track
      ]
      
      console.log(`🎯 TRACK-TO-CAP CONNECTION CALCULATION:`, {
        sourceComponent: sourceComponent.name,
        targetComponent: targetComponent.name,
        sourceRotation: {
          radians: [sourceRotation[0].toFixed(4), sourceRotation[1].toFixed(4), sourceRotation[2].toFixed(4)],
          degrees: [(sourceRotation[0] * 180 / Math.PI).toFixed(1), (sourceRotation[1] * 180 / Math.PI).toFixed(1), (sourceRotation[2] * 180 / Math.PI).toFixed(1)]
        },
        targetRotation: {
          radians: [targetRotation[0].toFixed(4), targetRotation[1].toFixed(4), targetRotation[2].toFixed(4)],
          degrees: [(targetRotation[0] * 180 / Math.PI).toFixed(1), (targetRotation[1] * 180 / Math.PI).toFixed(1), (targetRotation[2] * 180 / Math.PI).toFixed(1)]
        },
        reasoning: "Cap faces opposite to track direction for proper end connection"
      })
      
    } else if (targetIsPendant) {
      // Pendant lamps should hang vertically with snap point on top
      targetRotation = [Math.PI/2, 0, 0] // 90° X rotation to make vertical
      console.log(`🎯 PENDANT VERTICAL ORIENTATION`)
      
    } else {
      // For other components, maintain default orientation
      targetRotation = [0, 0, 0]
      console.log(`🎯 DEFAULT ORIENTATION`)
    }
    
    // STEP 4: Calculate target component position for perfect snap point alignment
    
    // Create transformation matrix for the target component with its final rotation
    const targetRotMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(targetRotation[0], targetRotation[1], targetRotation[2], 'XYZ')
    )
    
    const targetScaleMatrix = new THREE.Matrix4().makeScale(
      targetScale[0], targetScale[1], targetScale[2]
    )
    
    // Combined transform (without translation)
    const targetTransformMatrix = new THREE.Matrix4()
      .multiplyMatrices(targetRotMatrix, targetScaleMatrix)
    
    // Transform the target snap point from local to "component" space (before final translation)
    const targetSnapLocalVector = new THREE.Vector3(
      targetSnapLocal[0], targetSnapLocal[1], targetSnapLocal[2]
    )
    
    const transformedTargetSnap = targetSnapLocalVector.applyMatrix4(targetTransformMatrix)
    
    console.log(`🔧 TRANSFORMED TARGET SNAP:`, {
      localSnap: targetSnapLocal,
      targetRotation,
      targetScale,
      transformedSnap: [transformedTargetSnap.x, transformedTargetSnap.y, transformedTargetSnap.z]
    })
    
    // STEP 5: Calculate final target component position
    // Position the target component so its transformed snap point matches source snap point exactly
    const finalPosition: [number, number, number] = [
      sourceWorldPos[0] - transformedTargetSnap.x,
      sourceWorldPos[1] - transformedTargetSnap.y,
      sourceWorldPos[2] - transformedTargetSnap.z
    ]
    
    console.log(`📍 CALCULATED POSITION:`, {
      sourceWorldPos,
      transformedTargetSnap: [transformedTargetSnap.x, transformedTargetSnap.y, transformedTargetSnap.z],
      finalPosition
    })
    
    // STEP 6: FINALIZE ALIGNMENT WITH SPECIAL CASE HANDLING
    const connectionType = sourceIsTrack && targetIsEndCap ? "Track-to-Cap with proper orientation" : "Standard snap alignment"
    console.log(`🎯 CONNECTION ALIGNMENT COMPLETE:`, {
      sourceWorldPos,
      calculatedPosition: finalPosition,
      targetRotation,
      targetRotationDegrees: [(targetRotation[0] * 180 / Math.PI).toFixed(1), (targetRotation[1] * 180 / Math.PI).toFixed(1), (targetRotation[2] * 180 / Math.PI).toFixed(1)],
      componentType: targetComponent.type,
      connectionType,
      isTrack: targetIsTrack,
      isEndCap: targetIsEndCap,
      reasoning: sourceIsTrack && targetIsEndCap ? 
        "Cap oriented to face track - snap points overlap, cap tail connects properly" : 
        "Pure snap point alignment for perfect connection"
    })
    
    const result = {
      position: finalPosition,
      rotation: targetRotation
    }
    
    console.log(`✅ PERFECT ALIGNMENT RESULT:`, result)
    
    // STEP 7: Verify alignment (for debugging)
    const verificationWorldPos = snapLogic.getWorldSnapPointPosition(
      { ...targetComponent, position: finalPosition, rotation: targetRotation },
      targetSnapPoint
    )
    
    const alignmentError = [
      Math.abs(verificationWorldPos[0] - sourceWorldPos[0]),
      Math.abs(verificationWorldPos[1] - sourceWorldPos[1]),
      Math.abs(verificationWorldPos[2] - sourceWorldPos[2])
    ]
    
    const maxError = Math.max(...alignmentError)
    
    console.log(`🎯 ALIGNMENT VERIFICATION:`, {
      sourceWorldPos,
      calculatedTargetSnapWorldPos: verificationWorldPos,
      alignmentError,
      maxError: maxError.toFixed(4),
      isAligned: maxError < 0.01, // 1cm tolerance for all connections
      targetRotation,
      targetRotationDegrees: [(targetRotation[0] * 180 / Math.PI).toFixed(1), (targetRotation[1] * 180 / Math.PI).toFixed(1), (targetRotation[2] * 180 / Math.PI).toFixed(1)],
      connectionType: sourceIsTrack && targetIsEndCap ? "Track-to-Cap (snap points overlap)" : "Standard snap alignment"
    })
    
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