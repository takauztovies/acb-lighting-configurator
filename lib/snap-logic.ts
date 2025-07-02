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
    
    // ENHANCED COMPATIBILITY RULES - Properly implemented for your requirements
    
    // Helper functions for component type detection (avoiding nullish coalescing syntax issues)
    const isLampOrPendant = (component?: Component): boolean => {
      if (!component) return false
      return component.type === "spotlight" || 
             (component.name ? component.name.toLowerCase().includes('pendant') : false) ||
             (component.name ? component.name.toLowerCase().includes('lamp') : false)
    }
    
    const isConnector = (component?: Component): boolean => {
      if (!component) return false
      return component.type.includes('connector')
    }
    
    const isProfileOrTrack = (component?: Component): boolean => {
      if (!component) return false
      return component.type.includes('profile') || 
             component.type.includes('track') ||
             (component.name ? component.name.toLowerCase().includes('profile') : false) ||
             (component.name ? component.name.toLowerCase().includes('1000mm') : false)
    }
    
    const isEndCap = (component?: Component): boolean => {
      if (!component) return false
      return component.name ? component.name.toLowerCase().includes('cap') : false
    }
    
    console.log(`🔍 CHECKING SNAP COMPATIBILITY:`, {
      snapPoint1: { type: snapPoint1.type, component: component1?.type, name: component1?.name },
      snapPoint2: { type: snapPoint2.type, component: component2?.type, name: component2?.name }
    })
    
    // Rule 1: Same type connections (basic compatibility)
    if (snapPoint1.type === snapPoint2.type) {
      console.log(`✅ SAME TYPE CONNECTION: ${snapPoint1.type} ↔ ${snapPoint2.type}`)
      return true
    }
    
    // Rule 2: Track ↔ Mounting cross-compatibility
    if ((snapPoint1.type === "track" && snapPoint2.type === "mounting") ||
        (snapPoint1.type === "mounting" && snapPoint2.type === "track")) {
      console.log(`✅ TRACK-MOUNTING CROSS CONNECTION`)
      return true
    }
    
    // Rule 3: ENHANCED - Lamps/Pendants ↔ Connectors (FIXED: Now works!)
    // This specifically addresses your requirement: "Lamps and Pendants should be possible to snap to the mechanical snaps of connectors"
    if (isLampOrPendant(component1) && isConnector(component2)) {
      if ((snapPoint1.type === "mounting" || snapPoint1.type === "track") && 
          (snapPoint2.type === "track" || snapPoint2.type === "mounting")) {
        console.log(`✅ LAMP/PENDANT → CONNECTOR: ${component1?.name} can connect to ${component2?.name}`)
        return true
      }
    }
    if (isLampOrPendant(component2) && isConnector(component1)) {
      if ((snapPoint2.type === "mounting" || snapPoint2.type === "track") && 
          (snapPoint1.type === "track" || snapPoint1.type === "mounting")) {
        console.log(`✅ CONNECTOR → LAMP/PENDANT: ${component1?.name} can connect to ${component2?.name}`)
        return true
      }
    }
    
    // Rule 4: ENHANCED - 1000mm Profiles ↔ Connectors (FIXED: Now works!)
    // This specifically addresses your requirement: "1000mm profile should be possible to snap to a connector"
    
    // CRITICAL FIX: Profile Connector SNAP POINTS ONLY connect to Profiles/Tracks - REJECT everything else!
    // Fix: Check SNAP POINT name, not component name!
    const isSnapPoint1ProfileConnector = snapPoint1.name ? snapPoint1.name.toLowerCase().includes('profile connector') : false
    const isSnapPoint2ProfileConnector = snapPoint2.name ? snapPoint2.name.toLowerCase().includes('profile connector') : false
    
    // If snapPoint1 is a profile connector, it can ONLY connect to profiles/tracks
    if (isSnapPoint1ProfileConnector) {
      if (isProfileOrTrack(component2)) {
        console.log(`✅ PROFILE CONNECTOR SNAP POINT → PROFILE/TRACK ONLY: ${snapPoint1.name} can connect to ${component2?.name}`)
        return true
      } else {
        console.log(`🚫 PROFILE CONNECTOR SNAP POINT RESTRICTED: ${snapPoint1.name} CANNOT connect to ${component2?.name} (only profiles/tracks allowed)`)
        return false
      }
    }
    
    // If snapPoint2 is a profile connector, it can ONLY connect to profiles/tracks
    if (isSnapPoint2ProfileConnector) {
      if (isProfileOrTrack(component1)) {
        console.log(`✅ PROFILE/TRACK → PROFILE CONNECTOR SNAP POINT ONLY: ${component1?.name} can connect to ${snapPoint2.name}`)
        return true
      } else {
        console.log(`🚫 PROFILE CONNECTOR SNAP POINT RESTRICTED: ${snapPoint2.name} CANNOT connect to ${component1?.name} (only profiles/tracks allowed)`)
        return false
      }
    }
    
    // For NON-profile connectors, allow connections to profiles/tracks
    if (isProfileOrTrack(component1) && isConnector(component2)) {
      if (snapPoint1.type === "track" && snapPoint2.type === "track") {
        console.log(`✅ PROFILE/TRACK → CONNECTOR: ${component1?.name} can connect to ${component2?.name}`)
        return true
      }
    }
    if (isProfileOrTrack(component2) && isConnector(component1)) {
      if (snapPoint2.type === "track" && snapPoint1.type === "track") {
        console.log(`✅ CONNECTOR → PROFILE/TRACK: ${component1?.name} can connect to ${component2?.name}`)
        return true
      }
    }
    
    // Rule 5: Connector ↔ Connector connections
    if (isConnector(component1) && isConnector(component2)) {
      if (snapPoint1.type === "track" && snapPoint2.type === "track") {
        console.log(`✅ CONNECTOR ↔ CONNECTOR: Track connection`)
        return true
      }
    }
    
    // Rule 6: Profile/Track ↔ Profile/Track connections
    if (isProfileOrTrack(component1) && isProfileOrTrack(component2)) {
      if (snapPoint1.type === "track" && snapPoint2.type === "track") {
        console.log(`✅ PROFILE/TRACK ↔ PROFILE/TRACK: Direct connection`)
        return true
      }
    }
    
    // Rule 7: End Cap connections
    if (isEndCap(component1) || isEndCap(component2)) {
      if (snapPoint1.type === "track" && snapPoint2.type === "track") {
        console.log(`✅ END CAP CONNECTION: Track connection`)
        return true
      }
    }
    
    // Rule 8: Compatible types defined in snap point properties
    if (snapPoint1.compatibleTypes?.includes(snapPoint2.type) ||
        snapPoint2.compatibleTypes?.includes(snapPoint1.type)) {
      console.log(`✅ COMPATIBLE TYPES: Via snap point compatibility definition`)
      return true
    }
    
    console.log(`🚫 SNAP POINT COMPATIBILITY REJECTED:`, {
      snapPoint1: { type: snapPoint1.type, component: component1?.type, name: component1?.name },
      snapPoint2: { type: snapPoint2.type, component: component2?.type, name: component2?.name },
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
    const sourceIsWallConnector = sourceComponent.type.includes('connector') && sourceComponent.position[1] <= 2.5
    const sourceIsEasyLinkEndCap = sourceComponent.name?.toLowerCase().includes('easy link end cap white')
    const sourceIsTrack = sourceComponent.type.includes('track') || sourceComponent.type.includes('profile')
    const targetIsTrack = targetComponent.type.includes('track') || targetComponent.type.includes('profile')
    const targetIsProfile = targetComponent.type.includes('profile') || targetComponent.name?.toLowerCase().includes('profile')
    const targetIsEndCap = targetComponent.name?.toLowerCase().includes('easy link end cap white') || 
                          (targetComponent.type.includes('connector') && targetComponent.name?.toLowerCase().includes('cap'))
    const targetIsConnector = targetComponent.type.includes('connector')
    const targetIsPendant = targetComponent.type.includes('spotlight') && 
                           targetComponent.name?.toLowerCase().includes('pendant')
    
    // Detect wall vs ceiling mounting based on source position
    const sourceOnCeiling = sourceComponent.position[1] > 2.5
    const sourceOnWall = sourceComponent.position[1] <= 2.5
    
    console.log(`🔍 COMPONENT TYPE ANALYSIS:`, {
      sourceIsCeilingConnector,
      sourceIsWallConnector,
      sourceIsEasyLinkEndCap,
      sourceIsTrack,
      targetIsTrack,
      targetIsProfile,
      targetIsEndCap,
      targetIsConnector,
      targetIsPendant,
      sourceOnCeiling,
      sourceOnWall,
      sourceType: sourceComponent.type,
      targetType: targetComponent.type
    })
    
    // CAP TO PROFILE CONNECTION: Orient profile in cap's tail direction
    if ((targetIsTrack || targetIsProfile) && (sourceIsCeilingConnector || sourceIsWallConnector || sourceIsEasyLinkEndCap)) {
      
      const connectorOnWall = sourceComponent.position[1] <= 2.5
      
      // ENHANCED TAIL DIRECTION CALCULATION: Account for cap's actual rotation
      const capCenter = sourceComponent.position || [0, 0, 0]
      const snapWorldPos = sourceWorldPos
      const capRotation = sourceComponent.rotation || [0, 0, 0]
      
      // Calculate raw tail direction: from cap center to snap point
      let tailDirection = [
        snapWorldPos[0] - capCenter[0],
        snapWorldPos[1] - capCenter[1], 
        snapWorldPos[2] - capCenter[2]
      ]
      
      // CRITICAL FIX: When cap is rotated, the "forward" direction changes
      // We need to account for the cap's Y rotation (primary rotation axis)
      const capYRotation = capRotation[1]
      
      // If cap has significant Y rotation, adjust the tail direction accordingly
      if (Math.abs(capYRotation) > 0.1) { // More than ~6 degrees
        // The cap's "forward" direction has rotated, so adjust tail calculation
        const rotationMatrix = new THREE.Matrix4().makeRotationY(capYRotation)
        const baseDirection = new THREE.Vector3(1, 0, 0) // Default forward direction
        const rotatedDirection = baseDirection.applyMatrix4(rotationMatrix)
        
        // Use the rotated direction instead of center-to-snap calculation
        tailDirection = [rotatedDirection.x, rotatedDirection.y, rotatedDirection.z]
        
        console.log(`🔄 CAP ROTATION DETECTED:`, {
          capYRotation: (capYRotation * 180 / Math.PI).toFixed(1) + '°',
          adjustedTailDirection: tailDirection,
          reasoning: 'Using cap rotation-aware tail direction'
        })
      }
      
      // Calculate the Y rotation needed to point the profile in the tail direction
      const targetYRotation = Math.atan2(tailDirection[2], tailDirection[0])
      
      if (connectorOnWall) {
        // WALL MOUNTING: Profile horizontal, lying on narrow edge, oriented in tail direction
        targetRotation = [Math.PI / 2, targetYRotation, 0]
        console.log(`🎯 WALL CAP→PROFILE: Horizontal profile lying on narrow edge in tail direction`)
      } else {
        // CEILING MOUNTING: Profile horizontal, lying on narrow edge, oriented in tail direction
        targetRotation = [Math.PI / 2, targetYRotation, 0]
        console.log(`🎯 CEILING CAP→PROFILE: Horizontal profile lying on narrow edge in tail direction`)
      }
      
      console.log(`🔧 CAP→PROFILE TAIL DIRECTION:`, {
        capType: sourceComponent.name,
        capCenter,
        snapWorldPos,
        capRotation: {
          radians: capRotation,
          degrees: [(capRotation[0] * 180 / Math.PI).toFixed(1), (capRotation[1] * 180 / Math.PI).toFixed(1), (capRotation[2] * 180 / Math.PI).toFixed(1)]
        },
        tailDirection,
        targetYRotation: {
          radians: targetYRotation.toFixed(4),
          degrees: (targetYRotation * 180 / Math.PI).toFixed(1)
        },
        mountingSurface: connectorOnWall ? 'wall' : 'ceiling',
        targetRotation: {
          degrees: [(targetRotation[0] * 180 / Math.PI).toFixed(1), (targetRotation[1] * 180 / Math.PI).toFixed(1), (targetRotation[2] * 180 / Math.PI).toFixed(1)]
        }
      })
      
    } else if (sourceIsTrack && (targetIsTrack || targetIsProfile)) {
      // TRACK TO TRACK/PROFILE CONNECTION: Horizontal orientation on narrow edge
      if (sourceOnCeiling) {
        // CEILING MOUNTING: Profile horizontal, lying on narrow edge
        targetRotation = [Math.PI / 2, 0, 0]
        console.log(`🎯 CEILING TRACK→PROFILE: Horizontal profile lying on narrow edge`)
      } else {
        // WALL MOUNTING: Profile horizontal, lying on narrow edge
        targetRotation = [Math.PI / 2, 0, 0]
        console.log(`🎯 WALL TRACK→PROFILE: Horizontal profile lying on narrow edge`)
      }
      
    } else if (sourceIsTrack && (targetIsEndCap || targetIsConnector)) {
      // TRACK TO CONNECTOR CONNECTION: Simple default orientation
      targetRotation = [0, 0, 0]
      console.log(`🎯 TRACK→CONNECTOR: Default orientation`)
      
    } else if ((sourceIsCeilingConnector || sourceIsWallConnector) && (targetIsTrack || targetIsProfile)) {
      // CONNECTOR TO TRACK CONNECTION: Horizontal orientation on narrow edge
      const connectorOnWall = sourceComponent.position[1] <= 2.5
      
      if (connectorOnWall) {
        // WALL MOUNTING: Track horizontal, lying on narrow edge
        targetRotation = [Math.PI / 2, 0, 0]
        console.log(`🎯 WALL CONNECTOR→TRACK: Horizontal track lying on narrow edge`)
      } else {
        // CEILING MOUNTING: Track horizontal, lying on narrow edge
        targetRotation = [Math.PI / 2, 0, 0]
        console.log(`🎯 CEILING CONNECTOR→TRACK: Horizontal track lying on narrow edge`)
      }
      
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
    let finalPosition: [number, number, number] = [
      sourceWorldPos[0] - transformedTargetSnap.x,
      sourceWorldPos[1] - transformedTargetSnap.y,
      sourceWorldPos[2] - transformedTargetSnap.z
    ]
    
    // PURE SNAP-TO-SNAP ALIGNMENT FOR ALL CONNECTIONS
    // No offsets, no extensions - snap points align exactly
    console.log(`🔧 PURE SNAP-TO-SNAP ALIGNMENT:`, {
      sourceSnapWorldPos: sourceWorldPos,
      transformedTargetSnap: [transformedTargetSnap.x, transformedTargetSnap.y, transformedTargetSnap.z],
      finalPosition,
      reasoning: "Perfect snap point alignment - snap points overlap exactly"
    })
    
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