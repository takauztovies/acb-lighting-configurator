"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { db, type ComponentData } from "@/lib/database"
import { boundarySystem } from "@/lib/boundary-system"
import * as THREE from "three"

// Define types
export type ComponentType = "track" | "spotlight" | "connector" | "power-supply" | "mounting" | "accessory" | "floor" | "ceiling" | "shade" | "diffuser" | "bulb" | "driver" | "sensor" | "dimmer" | "lamp" | "uplight" | "downlight" | "panel" | "pendant" | "strip" | "wall" | "table"

export interface Component {
  id: string
  name: string
  type: ComponentType
  model3d?: string
  image?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  price: number
  connections: string[]
  properties?: Record<string, any>
  snapPoints?: SnapPoint[]
  initialPosition?: [number, number, number]
  initialRotation?: [number, number, number]
  initialScale?: [number, number, number]
}

export interface SnapPoint {
  id: string
  name: string
  type: "power" | "mechanical" | "data" | "track" | "mounting" | "accessory"
  position: [number, number, number]
  rotation?: [number, number, number]
  compatibleTypes?: string[]
}

export interface Connection {
  id: string
  sourceId: string
  targetId: string
  type: string
  properties?: Record<string, any>
}

export interface Configuration {
  id: string
  name: string
  components: Component[]
  connections: Connection[]
  totalPrice: number
}

export interface SceneImageSettings {
  [key: string]: string | null
  floor: string | null
  ceiling: string | null
  backWall: string | null
  leftWall: string | null
  rightWall: string | null
}

export interface LocalComponentData {
  id: string
  name: string
  type: ComponentType
  price: number
  model3d?: string
  image?: string
  specifications?: Record<string, any>
  bundleRequired?: string[]
  position?: [number, number, number]
  rotation?: [number, number, number]
  connections?: string[]
  connectionPoints?: ConnectionPoint[]
  snapPoints?: SnapPoint[]
}

export interface LightComponent {
  id: string
  name: string
  type: ComponentType
  price: number
  model3d?: string
  image?: string
  specifications: Record<string, any>
  bundleRequired?: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  connections: string[]
  connectionPoints: ConnectionPoint[]
  snapPoints?: SnapPoint[]
}

export interface ConnectionPoint {
  id: string
  position: [number, number, number]
  type: "input" | "output" | "bidirectional"
  connected: boolean
  connectedTo?: string
}

export interface SetupData {
  roomDimensions: {
    width: number
    length: number
    height: number
  }
  powerSource: string | null
  socketPosition: {
    x: number
    y: number
    z: number
  } | null
  socketWall: string
  hangingType: string | null
  mountingWall?: "left" | "right" | "front" | "back"
  trackLayout: {
    type: string
    length: number
    orientation: string
    position: {
      x: number
      y: number
      z: number
    }
  } | null
  selectedComponents: LightComponent[]
}

export interface CableCalculation {
  length: number
  type: "power" | "data"
  pricePerMeter: number
  totalPrice: number
  description: string
}

export interface ConfiguratorState {
  viewMode: "2d" | "3d"
  currentConfig: Configuration
  selectedComponentId: string | null
  selectedComponentIds: string[]
  copiedComponent: Component | null
  showLabels: boolean
  gridVisible: boolean
  transformMode: "translate" | "rotate" | "scale" | null
  sceneImageSettings: SceneImageSettings
  availableComponents: LightComponent[]
  isLoadingComponents: boolean
  componentLoadError: string | null
  lastRefresh: Date | null
  roomDimensions: {
    width: number
    length: number
    height: number
  }
  guidedAssemblyMode: boolean
  currentAssemblyStep: string | null
  assemblyInstructions: string | null
  setupData: SetupData | null
  highlightedSnapPoints: string[]
  selectedComponentType: string | null
  guidedMode: boolean
  guidedSetupData: any | null
  // New states for improved snap point workflow
  selectedSnapPoint: { componentId: string; snapPointId: string } | null
  placementMode: boolean
  pendingComponent: LightComponent | null
  cableCalculations: CableCalculation[]
  socketPosition: { x: number; y: number; z: number } | null
  cablePricing: { power: number; data: number } // price per meter
}

// Define action types
type Action =
  | { type: "SET_VIEW_MODE"; mode: "2d" | "3d" }
  | { type: "ADD_COMPONENT"; component: Component; fromSnapPoint?: boolean }
  | { type: "REMOVE_COMPONENT"; componentId: string }
  | { type: "UPDATE_COMPONENT"; componentId: string; updates: Partial<Component> }
  | { type: "SET_SELECTED_COMPONENT"; componentId: string }
  | { type: "SET_SELECTED_COMPONENTS"; componentIds: string[] }
  | { type: "TOGGLE_COMPONENT_SELECTION"; componentId: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "COPY_COMPONENT"; componentId: string }
  | { type: "PASTE_COMPONENT" }
  | { type: "TOGGLE_LABELS" }
  | { type: "TOGGLE_GRID" }
  | { type: "SET_TRANSFORM_MODE"; mode: "translate" | "rotate" | "scale" | null }
  | { type: "MOVE_SELECTED_COMPONENTS"; direction: string; amount: number }
  | { type: "ROTATE_SELECTED_COMPONENTS"; axis: "x" | "y" | "z"; amount: number }
  | { type: "SET_SCENE_IMAGE"; surface: string; imageData: string }
  | { type: "REMOVE_SCENE_IMAGE"; surface: string }
  | { type: "SET_AVAILABLE_COMPONENTS"; components: LightComponent[] }
  | { type: "SET_COMPONENTS_LOADING"; loading: boolean }
  | { type: "SET_COMPONENTS_ERROR"; error: string | null }
  | { type: "SET_LAST_REFRESH"; date: Date }
  | { type: "SET_ROOM_DIMENSIONS"; dimensions: { width: number; length: number; height: number } }
  | { type: "SET_LANGUAGE"; language: string }
  | { type: "SET_GUIDED_ASSEMBLY_MODE"; enabled: boolean; setupData?: SetupData }
  | { type: "SET_ASSEMBLY_STEP"; step: string | null }
  | { type: "SET_ASSEMBLY_INSTRUCTIONS"; instructions: string | null }
  | { type: "SET_SETUP_DATA"; data: SetupData }
  | { type: "SET_HIGHLIGHTED_SNAP_POINTS"; snapPoints: string[]; componentType: string }
  | { type: "CLEAR_HIGHLIGHTED_SNAP_POINTS" }
  | { type: "SET_GUIDED_MODE"; enabled: boolean; setupData?: any }
  // New actions for improved workflow
  | { type: "SET_SELECTED_SNAP_POINT"; componentId: string; snapPointId: string }
  | { type: "CLEAR_SELECTED_SNAP_POINT" }
  | { type: "SET_PLACEMENT_MODE"; enabled: boolean; component?: LightComponent }
  | { type: "PLACE_COMPONENT_AT_SNAP_POINT"; component: LightComponent }
  | { type: "SET_SOCKET_POSITION"; position: { x: number; y: number; z: number } }
  | { type: "CALCULATE_CABLES" }
  | { type: "UPDATE_CABLE_PRICING"; pricing: { power: number; data: number } }
  | { type: "ADD_CONNECTION"; connection: Connection }

// Create context
interface ConfiguratorContextType {
  state: ConfiguratorState
  dispatch: React.Dispatch<Action>
  loadComponentsFromDatabase: () => Promise<void>
  refreshComponents: () => Promise<void>
}

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(undefined)

// Initial state
const initialState: ConfiguratorState = {
  viewMode: "3d",
  currentConfig: {
    id: "default",
    name: "New Configuration",
    components: [],
    connections: [],
    totalPrice: 0,
  },
  selectedComponentId: null,
  selectedComponentIds: [],
  copiedComponent: null,
  showLabels: true,
  gridVisible: true,
  transformMode: null,
  sceneImageSettings: {
    floor: null,
    ceiling: null,
    backWall: null,
    leftWall: null,
    rightWall: null,
  },
  availableComponents: [],
  isLoadingComponents: false,
  componentLoadError: null,
  lastRefresh: null,
  roomDimensions: {
    width: 8,
    length: 6,
    height: 3,
  },
  guidedAssemblyMode: false,
  currentAssemblyStep: null,
  assemblyInstructions: null,
  setupData: null,
  highlightedSnapPoints: [],
  selectedComponentType: null,
  guidedMode: false,
  guidedSetupData: null,
  // New initial states
  selectedSnapPoint: null,
  placementMode: false,
  pendingComponent: null,
  cableCalculations: [],
  socketPosition: null,
  cablePricing: { power: 2.5, data: 1.8 }, // default prices per meter
}

function calculateCableLength(
  socketPos: { x: number; y: number; z: number },
  componentPos: [number, number, number],
): number {
  const dx = socketPos.x - componentPos[0]
  const dy = socketPos.y - componentPos[1]
  const dz = socketPos.z - componentPos[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function calculateAllCables(
  components: Component[],
  socketPosition: { x: number; y: number; z: number } | null,
  cablePricing: { power: number; data: number },
): CableCalculation[] {
  if (!socketPosition || components.length === 0) return []

  const calculations: CableCalculation[] = []

  // Find power supply components (these need direct connection to socket)
  const powerSupplies = components.filter((c) => c.type === "power-supply")

  if (powerSupplies.length > 0) {
    // Calculate cable to closest power supply
    const closestPowerSupply = powerSupplies.reduce((closest, current) => {
      const closestDistance = calculateCableLength(socketPosition, closest.position)
      const currentDistance = calculateCableLength(socketPosition, current.position)
      return currentDistance < closestDistance ? current : closest
    })

    const length = calculateCableLength(socketPosition, closestPowerSupply.position)
    const totalPrice = length * cablePricing.power

    calculations.push({
      length: Math.ceil(length * 10) / 10, // Round up to nearest 0.1m
      type: "power",
      pricePerMeter: cablePricing.power,
      totalPrice,
      description: `Power cable from socket to ${closestPowerSupply.name}`,
    })
  } else {
    // If no power supply, calculate to first component that needs power
    const powerComponents = components.filter(
      (c) => c.type === "track" || c.type === "spotlight" || c.type === "connector",
    )

    if (powerComponents.length > 0) {
      const closestComponent = powerComponents.reduce((closest, current) => {
        const closestDistance = calculateCableLength(socketPosition, closest.position)
        const currentDistance = calculateCableLength(socketPosition, current.position)
        return currentDistance < closestDistance ? current : closest
      })

      const length = calculateCableLength(socketPosition, closestComponent.position)
      const totalPrice = length * cablePricing.power

      calculations.push({
        length: Math.ceil(length * 10) / 10,
        type: "power",
        pricePerMeter: cablePricing.power,
        totalPrice,
        description: `Power cable from socket to ${closestComponent.name}`,
      })
    }
  }

  return calculations
}

// Reducer function
function configuratorReducer(state: ConfiguratorState, action: Action): ConfiguratorState {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode }

    case "ADD_COMPONENT": {
      // Only allow a connector as the first component
      if (state.currentConfig.components.length === 0 && action.component.type !== "connector") {
        // Optionally, set an error state or toast here
        return state;
      }
      console.log("Adding component to configuration:", action.component)
      
      // CRITICAL FIX: Skip all corrections for snap point placements!
      if (action.fromSnapPoint) {
        console.log(`🔒 SNAP POINT PLACEMENT - PRESERVING EXACT POSITION AND ROTATION`)
        console.log(`📍 Position: [${action.component.position?.[0]}, ${action.component.position?.[1]}, ${action.component.position?.[2]}]`)
        console.log(`🔄 Rotation: [${action.component.rotation?.[0]}, ${action.component.rotation?.[1]}, ${action.component.rotation?.[2]}]`, {
          degrees: [
            ((action.component.rotation?.[0] || 0) * 180 / Math.PI).toFixed(1),
            ((action.component.rotation?.[1] || 0) * 180 / Math.PI).toFixed(1),
            ((action.component.rotation?.[2] || 0) * 180 / Math.PI).toFixed(1)
          ]
        })
        
        // Use the component exactly as calculated by snap logic
        const constrainedComponent = {
          ...action.component
        }
        
        const newComponentCables = calculateAllCables(
          [...state.currentConfig.components, constrainedComponent],
          state.socketPosition,
          state.cablePricing,
        )
        return {
          ...state,
          currentConfig: {
            ...state.currentConfig,
            components: [...state.currentConfig.components, constrainedComponent],
            totalPrice:
              [...state.currentConfig.components, constrainedComponent].reduce((sum, c) => sum + c.price, 0) +
              newComponentCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
          },
          cableCalculations: newComponentCables,
          selectedComponentId: constrainedComponent.id,
          selectedComponentIds: [constrainedComponent.id],
        }
      }
      
      // Apply boundary constraints to new component (only for non-snap-point placements)
      const roomDims = state.roomDimensions || { width: 8, length: 6, height: 3 }
      
      // Force safe height for ALL new components - emergency fix
      const maxSafeHeight = Math.min(roomDims.height - 1.0, 2.0)
      let safePosition = action.component.position || [0, 0, 0]
      let originalRotation = action.component.rotation || [0, 0, 0]
      
      console.log(`📥 ADD_COMPONENT DEBUG:`, {
        type: action.component.type,
        originalPosition: action.component.position,
        originalRotation: action.component.rotation,
        name: action.component.name,
        fromSnapPoint: action.fromSnapPoint
      })
      
      // CRITICAL FIX: Don't apply height corrections to ceiling-mounted connectors or snap point components
      const isCeilingConnector = action.component.type === "connector" && safePosition[1] > 2.5
      const isFromSnapPoint = !!action.fromSnapPoint
      
      if (!isCeilingConnector && !isFromSnapPoint && safePosition[1] > maxSafeHeight) {
        safePosition = [safePosition[0], maxSafeHeight, safePosition[2]]
        console.log(`🚨 EMERGENCY HEIGHT CORRECTION (ADD): Component ${action.component.id} moved from y=${action.component.position?.[1]} to y=${maxSafeHeight}`)
      } else if (isCeilingConnector || isFromSnapPoint) {
        console.log(`🔒 PRESERVING ORIGINAL POSITION for ${isCeilingConnector ? 'ceiling connector' : 'snap point component'}: ${action.component.id} at y=${safePosition[1]}`)
      }
      
      // 🔥 ABSOLUTE OVERRIDE FOR TRACKS - FORCE HORIZONTAL ROTATION (but skip for snap point connections)
      if (action.component.type === "track" && !isFromSnapPoint) {
        originalRotation = [Math.PI/2, 0, 0]  // CRITICAL FIX: Use 90° around X-axis for horizontal tracks
        console.log(`🔥 TRACK ROTATION ABSOLUTE OVERRIDE: FORCED TO [${Math.PI/2}, 0, 0] (was [${action.component.rotation?.[0]}, ${action.component.rotation?.[1]}, ${action.component.rotation?.[2]}])`)
      } else if (action.component.type === "track" && isFromSnapPoint) {
        console.log(`🔒 PRESERVING SNAP POINT ROTATION for track: ${action.component.id} rotation=[${action.component.rotation?.[0]}, ${action.component.rotation?.[1]}, ${action.component.rotation?.[2]}]`)
      }
      
      // Skip boundary constraints for snap point connections to preserve precise positioning and rotation
      let constraintResult: any
      if (isFromSnapPoint) {
        // For snap point connections, preserve the exact calculated position and rotation
        constraintResult = {
          position: safePosition,
          rotation: originalRotation,
          corrected: false,
          reason: 'Snap point connection - preserving exact calculations'
        }
        console.log(`🔒 PRESERVING SNAP POINT CALCULATIONS - NO BOUNDARY CONSTRAINTS`)
      } else {
        // For direct placement, apply boundary constraints
        constraintResult = boundarySystem.validateAndCorrectPosition(
          action.component.type,
          safePosition,
          originalRotation,
          action.component.scale || [1, 1, 1],
          roomDims
        )
        console.log(`🔧 APPLYING BOUNDARY CONSTRAINTS for direct placement`)
      }
      
      console.log(`📤 FINAL ADD_COMPONENT RESULT:`, {
        type: action.component.type,
        finalPosition: constraintResult.position,
        finalRotation: constraintResult.rotation,
        constraintApplied: constraintResult.corrected,
        reason: constraintResult.reason
      })
      
      const constrainedComponent = {
        ...action.component,
        position: constraintResult.position,
        rotation: constraintResult.rotation
      }
      
      if (constraintResult.corrected && constraintResult.reason) {
        console.log(`Component positioning corrected: ${constraintResult.reason}`)
      }
      
      const newComponentCables = calculateAllCables(
        [...state.currentConfig.components, constrainedComponent],
        state.socketPosition,
        state.cablePricing,
      )
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: [...state.currentConfig.components, constrainedComponent],
          totalPrice:
            [...state.currentConfig.components, constrainedComponent].reduce((sum, c) => sum + c.price, 0) +
            newComponentCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
        },
        cableCalculations: newComponentCables,
        selectedComponentId: constrainedComponent.id,
        selectedComponentIds: [constrainedComponent.id],
      }
    }

    case "REMOVE_COMPONENT":
      const componentToRemove = state.currentConfig.components.find((c) => c.id === action.componentId)
      const newComponents = state.currentConfig.components.filter((c) => c.id !== action.componentId)
      const newConnections = state.currentConfig.connections.filter(
        (conn) => conn.sourceId !== action.componentId && conn.targetId !== action.componentId,
      )

      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: newComponents,
          connections: newConnections,
          totalPrice: componentToRemove
            ? state.currentConfig.totalPrice - componentToRemove.price
            : state.currentConfig.totalPrice,
        },
        selectedComponentId: state.selectedComponentId === action.componentId ? null : state.selectedComponentId,
        selectedComponentIds: state.selectedComponentIds.filter((id) => id !== action.componentId),
      }

    case "UPDATE_COMPONENT":
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: state.currentConfig.components.map((component) => {
            if (component.id === action.componentId) {
              const updatedComponent = { ...component, ...action.updates }
              
              // Apply boundary constraints if position or rotation is being updated
              if (action.updates.position || action.updates.rotation) {
                const roomDims = state.roomDimensions || { width: 8, length: 6, height: 3 }
                
                // Force safe height for components (excluding ceiling-mounted connectors)
                const maxSafeHeight = Math.min(roomDims.height - 1.0, 2.0)
                let safePosition = updatedComponent.position || [0, 0, 0]
                const isCeilingConnector = component.type === "connector" && safePosition[1] > 2.5
                
                if (!isCeilingConnector && safePosition[1] > maxSafeHeight) {
                  safePosition = [safePosition[0], maxSafeHeight, safePosition[2]]
                  console.log(`🚨 EMERGENCY HEIGHT CORRECTION: Component ${component.id} moved from y=${updatedComponent.position?.[1]} to y=${maxSafeHeight}`)
                } else if (isCeilingConnector) {
                  console.log(`🔒 PRESERVING CEILING CONNECTOR POSITION: ${component.id} at y=${safePosition[1]}`)
                }
                
                // Detect if this is a manual transform (rotation change without position change)
                const isManualTransform = action.updates.rotation && !action.updates.position
                
                console.log(`🔍 UPDATE_COMPONENT - Boundary check:`, {
                  componentId: action.componentId,
                  hasRotationUpdate: !!action.updates.rotation,
                  hasPositionUpdate: !!action.updates.position,
                  isManualTransform,
                  updateData: action.updates
                })
                
                if (isManualTransform) {
                  // For manual rotation changes, only apply position constraints
                  console.log(`🚫 MANUAL ROTATION DETECTED - Preserving rotation for ${component.id}`)
                  return {
                    ...updatedComponent,
                    position: safePosition, // Only correct position, not rotation
                    rotation: action.updates.rotation || [0, 0, 0] // Preserve manual rotation with default
                  }
                } else {
                  // For position changes or initial placement, apply full constraints
                  const constraintResult = boundarySystem.validateAndCorrectPosition(
                    updatedComponent.type,
                    safePosition,
                    updatedComponent.rotation || [0, 0, 0],
                    updatedComponent.scale || [1, 1, 1],
                    roomDims
                  )
                  
                  if (constraintResult.corrected && constraintResult.reason) {
                    console.log(`Component positioning corrected: ${constraintResult.reason}`)
                  }
                  
                  return {
                    ...updatedComponent,
                    position: constraintResult.position,
                    rotation: constraintResult.rotation
                  }
                }
              }
              
              return updatedComponent
            }
            return component
          }),
        },
      }

    case "SET_SELECTED_COMPONENT":
      return {
        ...state,
        selectedComponentId: action.componentId,
        selectedComponentIds: [action.componentId],
      }

    case "SET_SELECTED_COMPONENTS":
      return {
        ...state,
        selectedComponentId: action.componentIds[0] || null,
        selectedComponentIds: action.componentIds,
      }

    case "TOGGLE_COMPONENT_SELECTION":
      const isSelected = state.selectedComponentIds.includes(action.componentId)
      let newSelectedIds: string[]

      if (isSelected) {
        newSelectedIds = state.selectedComponentIds.filter((id) => id !== action.componentId)
      } else {
        newSelectedIds = [...state.selectedComponentIds, action.componentId]
      }

      return {
        ...state,
        selectedComponentId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
        selectedComponentIds: newSelectedIds,
      }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedComponentId: null,
        selectedComponentIds: [],
        selectedSnapPoint: null,
        placementMode: false,
        pendingComponent: null,
      }

    case "COPY_COMPONENT":
      const componentToCopy = state.currentConfig.components.find((c) => c.id === action.componentId)
      return {
        ...state,
        copiedComponent: componentToCopy || null,
      }

    case "PASTE_COMPONENT":
      if (!state.copiedComponent) return state

      const newId = `${state.copiedComponent.id}-copy-${Date.now()}`
      const pastedComponent: Component = {
        ...state.copiedComponent,
        id: newId,
        position: [
          state.copiedComponent.position[0] + 0.5,
          state.copiedComponent.position[1],
          state.copiedComponent.position[2] + 0.5,
        ],
        connections: [],
      }

      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: [...state.currentConfig.components, pastedComponent],
          totalPrice: state.currentConfig.totalPrice + pastedComponent.price,
        },
        selectedComponentId: newId,
        selectedComponentIds: [newId],
      }

    case "TOGGLE_LABELS":
      return { ...state, showLabels: !state.showLabels }

    case "TOGGLE_GRID":
      return { ...state, gridVisible: !state.gridVisible }

    case "SET_TRANSFORM_MODE":
      return { ...state, transformMode: action.mode }

    case "MOVE_SELECTED_COMPONENTS":
      if (state.selectedComponentIds.length === 0) return state

      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: state.currentConfig.components.map((component) => {
            if (!state.selectedComponentIds.includes(component.id)) return component

            const newPosition = [...component.position] as [number, number, number]

            switch (action.direction) {
              case "left":
                newPosition[0] -= action.amount
                break
              case "right":
                newPosition[0] += action.amount
                break
              case "forward":
                newPosition[2] -= action.amount
                break
              case "backward":
                newPosition[2] += action.amount
                break
              case "up":
                newPosition[1] += action.amount
                break
              case "down":
                newPosition[1] -= action.amount
                break
            }

            return { ...component, position: newPosition }
          }),
        },
      }

    case "ROTATE_SELECTED_COMPONENTS":
      if (state.selectedComponentIds.length === 0) return state

      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: state.currentConfig.components.map((component) => {
            if (!state.selectedComponentIds.includes(component.id)) return component

            const newRotation = [...component.rotation] as [number, number, number]
            const axisIndex = action.axis === "x" ? 0 : action.axis === "y" ? 1 : 2
            newRotation[axisIndex] += action.amount

            return { ...component, rotation: newRotation }
          }),
        },
      }

    case "SET_SCENE_IMAGE":
      return {
        ...state,
        sceneImageSettings: {
          ...state.sceneImageSettings,
          [action.surface]: action.imageData,
        },
      }

    case "REMOVE_SCENE_IMAGE":
      return {
        ...state,
        sceneImageSettings: {
          ...state.sceneImageSettings,
          [action.surface]: null,
        },
      }

    case "SET_AVAILABLE_COMPONENTS":
      console.log("ConfiguratorContext: Setting available components:", action.components.length)
      return {
        ...state,
        availableComponents: action.components,
        isLoadingComponents: false,
        componentLoadError: null,
      }

    case "SET_COMPONENTS_LOADING":
      return { ...state, isLoadingComponents: action.loading }

    case "SET_COMPONENTS_ERROR":
      return {
        ...state,
        componentLoadError: action.error,
        isLoadingComponents: false,
      }

    case "SET_LAST_REFRESH":
      return { ...state, lastRefresh: action.date }

    case "SET_ROOM_DIMENSIONS":
      return {
        ...state,
        roomDimensions: action.dimensions,
      }

    case "SET_LANGUAGE":
      return { ...state }

    case "SET_GUIDED_ASSEMBLY_MODE":
      return {
        ...state,
        guidedAssemblyMode: action.enabled,
        setupData: action.setupData || state.setupData,
      }

    case "SET_ASSEMBLY_STEP":
      return { ...state, currentAssemblyStep: action.step }

    case "SET_ASSEMBLY_INSTRUCTIONS":
      return { ...state, assemblyInstructions: action.instructions }

    case "SET_SETUP_DATA":
      return { ...state, setupData: action.data }

    case "SET_HIGHLIGHTED_SNAP_POINTS":
      return {
        ...state,
        highlightedSnapPoints: action.snapPoints,
        selectedComponentType: action.componentType,
      }

    case "CLEAR_HIGHLIGHTED_SNAP_POINTS":
      return {
        ...state,
        highlightedSnapPoints: [],
        selectedComponentType: null,
      }

    case "SET_GUIDED_MODE":
      return {
        ...state,
        guidedMode: action.enabled,
        guidedSetupData: action.setupData || null,
      }

    // New action handlers
    case "SET_SELECTED_SNAP_POINT":
      return {
        ...state,
        selectedSnapPoint: { componentId: action.componentId, snapPointId: action.snapPointId },
      }

    case "CLEAR_SELECTED_SNAP_POINT":
      return {
        ...state,
        selectedSnapPoint: null,
        placementMode: false,
        pendingComponent: null,
      }

    case "SET_PLACEMENT_MODE":
      return {
        ...state,
        placementMode: action.enabled,
        pendingComponent: action.component || null,
      }

    case "PLACE_COMPONENT_AT_SNAP_POINT": {
      const { componentId, snapPointId } = state.selectedSnapPoint || {}
      if (!componentId || !snapPointId) return state

      const sourceComponent = state.currentConfig.components.find((c) => c.id === componentId)
      const sourceSnapPoint = sourceComponent?.snapPoints?.find((sp) => sp.id === snapPointId)
      const targetSnapPoint = action.component.snapPoints?.[0]

      if (!sourceComponent || !sourceSnapPoint || !targetSnapPoint) return state

      // Calculate the final position by combining source component position and snap point offsets
      const sourcePosition = sourceComponent.position
      const sourceOffset = sourceSnapPoint.position
      const targetOffset = targetSnapPoint.position

      // Calculate the final position
      const position: [number, number, number] = [
        sourcePosition[0] + sourceOffset[0] - targetOffset[0],
        sourcePosition[1] + sourceOffset[1] - targetOffset[1],
        sourcePosition[2] + sourceOffset[2] - targetOffset[2],
      ]

      // Calculate the final rotation by combining source component rotation and snap point rotations
      const sourceRotation = sourceComponent.rotation || [0, 0, 0]
      const sourceSnapRotation = sourceSnapPoint.rotation || [0, 0, 0]
      const targetSnapRotation = targetSnapPoint.rotation || [0, 0, 0]

      // For tracks, ensure horizontal alignment by zeroing out X and Z rotations
      let finalRotation: [number, number, number]
      if (action.component.type === "track") {
        finalRotation = [0, sourceRotation[1] + sourceSnapRotation[1] - targetSnapRotation[1], 0]
      } else {
        finalRotation = [
          (sourceRotation[0] + sourceSnapRotation[0] - targetSnapRotation[0]) % (2 * Math.PI),
          (sourceRotation[1] + sourceSnapRotation[1] - targetSnapRotation[1]) % (2 * Math.PI),
          (sourceRotation[2] + sourceSnapRotation[2] - targetSnapRotation[2]) % (2 * Math.PI),
        ]
      }

      // Create the new component with the calculated position and rotation
      const newComponent: Component = {
        ...action.component,
        id: `${action.component.type}-${Date.now()}`,
        position,
        rotation: finalRotation,
        scale: [
          action.component.specifications?.scale || 1,
          action.component.specifications?.scale || 1,
          action.component.specifications?.scale || 1
        ] as [number, number, number],
        connections: [],
        snapPoints: action.component.snapPoints || [],
        price: action.component.price || 0,
        properties: action.component.specifications || {}
      }

      // Create a connection between the source and new component
      const connection: Connection = {
        id: `connection-${Date.now()}`,
        sourceId: sourceComponent.id,
        targetId: newComponent.id,
        type: sourceSnapPoint.type,
        properties: {
          sourceSnapPoint: snapPointId,
          targetSnapPoint: targetSnapPoint.id,
        }
      }

      // Add the new component and connection
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: [...state.currentConfig.components, newComponent],
          connections: [...state.currentConfig.connections, connection]
        },
        selectedSnapPoint: null,
        placementMode: false,
        pendingComponent: null
      }
    }

    case "SET_SOCKET_POSITION":
      const newCables = calculateAllCables(state.currentConfig.components, action.position, state.cablePricing)
      return {
        ...state,
        socketPosition: action.position,
        cableCalculations: newCables,
        currentConfig: {
          ...state.currentConfig,
          totalPrice:
            state.currentConfig.components.reduce((sum, c) => sum + c.price, 0) +
            newCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
        },
      }

    case "CALCULATE_CABLES":
      const calculatedCables = calculateAllCables(
        state.currentConfig.components,
        state.socketPosition,
        state.cablePricing,
      )
      return {
        ...state,
        cableCalculations: calculatedCables,
        currentConfig: {
          ...state.currentConfig,
          totalPrice:
            state.currentConfig.components.reduce((sum, c) => sum + c.price, 0) +
            calculatedCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
        },
      }

    case "UPDATE_CABLE_PRICING":
      const updatedCables = calculateAllCables(state.currentConfig.components, state.socketPosition, action.pricing)
      return {
        ...state,
        cablePricing: action.pricing,
        cableCalculations: updatedCables,
        currentConfig: {
          ...state.currentConfig,
          totalPrice:
            state.currentConfig.components.reduce((sum, c) => sum + c.price, 0) +
            updatedCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
        },
      }

    case "ADD_CONNECTION":
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          connections: [...state.currentConfig.connections, action.connection],
        },
      }

    default:
      return state
  }
}

const convertToLightComponent = (component: ComponentData): LightComponent => {
  return {
    id: component.id,
    name: component.name,
    type: component.type,
    price: component.price,
    model3d: component.model3d || '',
    image: component.image || '',
    specifications: component.specifications || {},
    bundleRequired: [],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    connections: [],
    connectionPoints: [],
    snapPoints: component.snapPoints,
  }
}

// Provider component
export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configuratorReducer, initialState)

  const loadComponentsFromDatabase = async () => {
    console.log("ConfiguratorContext: Loading components from database...")
    dispatch({ type: "SET_COMPONENTS_LOADING", loading: true })

    try {
      await db.init()
      const components = await db.getComponents()
      console.log("ConfiguratorContext: Loaded components from database:", components.length)

      const lightComponents = components.map(convertToLightComponent)
      console.log("ConfiguratorContext: Converted to light components:", lightComponents.length)

      dispatch({ type: "SET_AVAILABLE_COMPONENTS", components: lightComponents })
      dispatch({ type: "SET_LAST_REFRESH", date: new Date() })
    } catch (error) {
      console.error("ConfiguratorContext: Error loading components:", error)
      dispatch({ type: "SET_COMPONENTS_ERROR", error: `Failed to load components: ${error}` })
    }
  }

  const refreshComponents = async () => {
    console.log("ConfiguratorContext: Refreshing components...")
    await loadComponentsFromDatabase()
  }

  // Load components on mount and set up periodic refresh
  useEffect(() => {
    console.log("ConfiguratorContext: Provider mounted, loading components...")
    loadComponentsFromDatabase()

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      console.log("ConfiguratorContext: Periodic refresh...")
      loadComponentsFromDatabase()
    }, 30000)

    // Listen for storage events (when admin panel saves components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "acb-components-updated") {
        console.log("ConfiguratorContext: Components updated in admin panel, refreshing...")
        loadComponentsFromDatabase()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return (
    <ConfiguratorContext.Provider value={{ state, dispatch, loadComponentsFromDatabase, refreshComponents }}>
      {children}
    </ConfiguratorContext.Provider>
  )
}

// Custom hook to use the context
export function useConfigurator() {
  const context = useContext(ConfiguratorContext)
  if (context === undefined) {
    console.error("useConfigurator must be used within a ConfiguratorProvider")
    // Return a default context to prevent crashes
    return {
      state: initialState,
      dispatch: () => {},
      loadComponentsFromDatabase: async () => {},
      refreshComponents: async () => {},
    }
  }
  return context
}
