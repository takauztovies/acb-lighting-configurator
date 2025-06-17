"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { db, type ComponentData } from "@/lib/database"

// Define types
export interface Component {
  id: string
  name: string
  type: string
  model?: string
  image?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  price: number
  connections: string[]
  properties?: Record<string, any>
  snapPoints?: SnapPoint[]
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

export interface LightComponent {
  id: string
  name: string
  type: "track" | "spotlight" | "connector" | "power-supply"
  price: number
  model3d?: string
  image: string
  specifications: Record<string, any>
  bundleRequired?: string[]
  position: [number, number, number]
  rotation: [number, number, number]
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
  | { type: "ADD_COMPONENT"; component: Component }
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

    case "ADD_COMPONENT":
      console.log("Adding component to configuration:", action.component)
      const newComponentCables = calculateAllCables(
        [...state.currentConfig.components, action.component],
        state.socketPosition,
        state.cablePricing,
      )
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: [...state.currentConfig.components, action.component],
          totalPrice:
            [...state.currentConfig.components, action.component].reduce((sum, c) => sum + c.price, 0) +
            newComponentCables.reduce((sum, cable) => sum + cable.totalPrice, 0),
        },
        cableCalculations: newComponentCables,
        selectedComponentId: action.component.id,
        selectedComponentIds: [action.component.id],
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
          components: state.currentConfig.components.map((component) =>
            component.id === action.componentId ? { ...component, ...action.updates } : component,
          ),
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

    case "PLACE_COMPONENT_AT_SNAP_POINT":
      if (!state.selectedSnapPoint) return state

      // Find the source component and snap point
      const sourceComponent = state.currentConfig.components.find((c) => c.id === state.selectedSnapPoint!.componentId)
      const sourceSnapPoint = sourceComponent?.snapPoints?.find((sp) => sp.id === state.selectedSnapPoint!.snapPointId)

      if (!sourceComponent || !sourceSnapPoint) return state

      // Calculate world position of the snap point
      const worldPosition: [number, number, number] = [
        sourceComponent.position[0] + sourceSnapPoint.position[0],
        sourceComponent.position[1] + sourceSnapPoint.position[1],
        sourceComponent.position[2] + sourceSnapPoint.position[2],
      ]

      // Create the new component at the snap point
      const newComponent: Component = {
        ...action.component,
        id: `${action.component.type}-${Date.now()}`,
        position: worldPosition,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        connections: [],
        snapPoints: action.component.snapPoints || [],
      }

      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          components: [...state.currentConfig.components, newComponent],
          totalPrice: state.currentConfig.totalPrice + newComponent.price,
        },
        selectedComponentId: newComponent.id,
        selectedComponentIds: [newComponent.id],
        selectedSnapPoint: null,
        placementMode: false,
        pendingComponent: null,
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
    model3d: component.model3d,
    image: component.image,
    specifications: component.specifications,
    bundleRequired: component.bundleRequired,
    position: component.position,
    rotation: component.rotation,
    connections: component.connections,
    connectionPoints: component.connectionPoints,
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
