import * as THREE from "three"

export interface RoomDimensions {
  width: number
  length: number
  height: number
}

export interface ComponentBounds {
  min: [number, number, number]
  max: [number, number, number]
}

export interface PositionConstraint {
  position: [number, number, number]
  rotation: [number, number, number]
  reason: string
}

export const boundarySystem = {
  // Check if a position is within room boundaries
  isPositionValid: (
    position: [number, number, number],
    roomDimensions: RoomDimensions,
    componentBounds?: ComponentBounds
  ): boolean => {
    const [x, y, z] = position
    const { width, length, height } = roomDimensions

    // Default component bounds (small buffer)
    const bounds = componentBounds || {
      min: [-0.1, -0.05, -0.1],
      max: [0.1, 0.05, 0.1]
    }

    // Calculate component extents at this position
    const minX = x + bounds.min[0]
    const maxX = x + bounds.max[0]
    const minY = y + bounds.min[1]
    const maxY = y + bounds.max[1]
    const minZ = z + bounds.min[2]
    const maxZ = z + bounds.max[2]

    // Check boundaries (with small tolerance)
    const tolerance = 0.01
    return (
      minX >= -width / 2 - tolerance &&
      maxX <= width / 2 + tolerance &&
      minY >= -tolerance &&
      maxY <= height + tolerance &&
      minZ >= -length / 2 - tolerance &&
      maxZ <= length / 2 + tolerance
    )
  },

  // Constrain position to stay within boundaries
  constrainPosition: (
    position: [number, number, number],
    roomDimensions: RoomDimensions,
    componentBounds?: ComponentBounds
  ): [number, number, number] => {
    const [x, y, z] = position
    const { width, length, height } = roomDimensions

    // Default component bounds
    const bounds = componentBounds || {
      min: [-0.1, -0.05, -0.1],
      max: [0.1, 0.05, 0.1]
    }

    // Constrain to room boundaries
    const constrainedX = Math.max(
      -width / 2 - bounds.min[0],
      Math.min(width / 2 - bounds.max[0], x)
    )
    const constrainedY = Math.max(
      -bounds.min[1],
      Math.min(height - bounds.max[1], y)
    )
    const constrainedZ = Math.max(
      -length / 2 - bounds.min[2],
      Math.min(length / 2 - bounds.max[2], z)
    )

    return [constrainedX, constrainedY, constrainedZ]
  },

  // Smart positioning for tracks based on location
  getTrackConstraints: (
    position: [number, number, number],
    roomDimensions: RoomDimensions
  ): PositionConstraint | null => {
    const [x, y, z] = position
    const { width, length, height } = roomDimensions

    // Define zones
    const ceilingThreshold = height - 0.3 // Within 30cm of ceiling
    const wallThreshold = 0.3 // Within 30cm of walls
    
    // Near ceiling - tracks should be horizontal
    if (y > ceilingThreshold) {
      const constrainedY = height - 0.15 // 15cm below ceiling
      return {
        position: [x, constrainedY, z],
        rotation: [0, 0, 0], // Horizontal orientation
        reason: "Track positioned horizontally near ceiling"
      }
    }

    // Near left wall
    if (x < -width / 2 + wallThreshold) {
      const constrainedX = -width / 2 + 0.15
      return {
        position: [constrainedX, y, z],
        rotation: [0, Math.PI / 2, 0], // Vertical orientation along wall
        reason: "Track oriented vertically along left wall"
      }
    }

    // Near right wall
    if (x > width / 2 - wallThreshold) {
      const constrainedX = width / 2 - 0.15
      return {
        position: [constrainedX, y, z],
        rotation: [0, Math.PI / 2, 0], // Vertical orientation along wall
        reason: "Track oriented vertically along right wall"
      }
    }

    // Near back wall
    if (z < -length / 2 + wallThreshold) {
      const constrainedZ = -length / 2 + 0.15
      return {
        position: [x, y, constrainedZ],
        rotation: [0, 0, 0], // Horizontal orientation along wall
        reason: "Track oriented horizontally along back wall"
      }
    }

    // Near front wall
    if (z > length / 2 - wallThreshold) {
      const constrainedZ = length / 2 - 0.15
      return {
        position: [x, y, constrainedZ],
        rotation: [0, 0, 0], // Horizontal orientation along wall
        reason: "Track oriented horizontally along front wall"
      }
    }

    // Corner detection for proper downward orientation
    const isNearCorner = (
      (Math.abs(x) > width / 2 - wallThreshold && Math.abs(z) > length / 2 - wallThreshold) ||
      (Math.abs(x) > width / 2 - wallThreshold && y > ceilingThreshold) ||
      (Math.abs(z) > length / 2 - wallThreshold && y > ceilingThreshold)
    )

    if (isNearCorner) {
      return {
        position: [x, y, z],
        rotation: [Math.PI / 2, 0, 0], // Pointing downward
        reason: "Track oriented downward at corner/ceiling junction"
      }
    }

    return null // No constraints needed
  },

  // Get component bounds based on type and model
  getComponentBounds: (componentType: string, scale: [number, number, number] = [1, 1, 1]): ComponentBounds => {
    let baseBounds: ComponentBounds

    switch (componentType) {
      case "track":
        baseBounds = {
          min: [-1.0, -0.05, -0.1],
          max: [1.0, 0.05, 0.1]
        }
        break
      case "spotlight":
        baseBounds = {
          min: [-0.1, -0.15, -0.1],
          max: [0.1, 0.15, 0.1]
        }
        break
      case "power-supply":
        baseBounds = {
          min: [-0.2, -0.1, -0.15],
          max: [0.2, 0.1, 0.15]
        }
        break
      case "connector":
        baseBounds = {
          min: [-0.075, -0.075, -0.075],
          max: [0.075, 0.075, 0.075]
        }
        break
      default:
        baseBounds = {
          min: [-0.25, -0.25, -0.25],
          max: [0.25, 0.25, 0.25]
        }
    }

    // Apply scale
    return {
      min: [
        baseBounds.min[0] * scale[0],
        baseBounds.min[1] * scale[1],
        baseBounds.min[2] * scale[2]
      ],
      max: [
        baseBounds.max[0] * scale[0],
        baseBounds.max[1] * scale[1],
        baseBounds.max[2] * scale[2]
      ]
    }
  },

  // Check and correct component positioning
  validateAndCorrectPosition: (
    componentType: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number],
    roomDimensions: RoomDimensions
  ): { position: [number, number, number]; rotation: [number, number, number]; corrected: boolean; reason?: string } => {
    const bounds = boundarySystem.getComponentBounds(componentType, scale)
    
    // First, ensure position is within boundaries
    const constrainedPosition = boundarySystem.constrainPosition(position, roomDimensions, bounds)
    
    let finalPosition = constrainedPosition
    let finalRotation = rotation
    let corrected = false
    let reason = ""

    // Apply track-specific constraints
    if (componentType === "track") {
      const trackConstraint = boundarySystem.getTrackConstraints(constrainedPosition, roomDimensions)
      
      if (trackConstraint) {
        finalPosition = trackConstraint.position
        finalRotation = trackConstraint.rotation
        corrected = true
        reason = trackConstraint.reason
      }
    }

    // Check if anything was corrected
    const positionChanged = (
      Math.abs(finalPosition[0] - position[0]) > 0.01 ||
      Math.abs(finalPosition[1] - position[1]) > 0.01 ||
      Math.abs(finalPosition[2] - position[2]) > 0.01
    )
    
    const rotationChanged = (
      Math.abs(finalRotation[0] - rotation[0]) > 0.01 ||
      Math.abs(finalRotation[1] - rotation[1]) > 0.01 ||
      Math.abs(finalRotation[2] - rotation[2]) > 0.01
    )

    return {
      position: finalPosition,
      rotation: finalRotation,
      corrected: corrected || positionChanged || rotationChanged,
      reason: reason || (positionChanged ? "Position constrained to room boundaries" : undefined)
    }
  }
}

export default boundarySystem 