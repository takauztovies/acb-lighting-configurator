"use client"

import type { SnapPoint } from "./snap-system"
import { RestAPIAdapter } from './database-adapters'

// Create a singleton instance of the database adapter
const db = new RestAPIAdapter({
  baseUrl: '/api',
})

export { db }

export interface ComponentData {
  id: string
  name: string
  description?: string
  type:
    | "track"
    | "spotlight"
    | "connector"
    | "power-supply"
    | "shade"
    | "diffuser"
    | "mounting"
    | "accessory"
    | "bulb"
    | "driver"
    | "sensor"
    | "dimmer"
    | "lamp"
    | "pendant"
    | "ceiling"
    | "wall"
    | "floor"
    | "table"
    | "strip"
    | "panel"
    | "downlight"
    | "uplight"
  price: number
  image?: string
  cardImage?: string
  model3d?: string
  componentUrl?: string
  specifications: Record<string, any>

  // NEW: Snap point system fields
  snapPoints?: SnapPoint[]
  isBaseComponent?: boolean // Can be placed directly in room
  requiresParent?: boolean // Must be attached to another component
  category?: "infrastructure" | "lighting" | "power" | "accessory"
  assemblyComplexity?: "simple" | "moderate" | "complex"

  createdAt: Date
  updatedAt: Date
}

export interface FileData {
  id: string
  componentId: string
  type: "image" | "model3d"
  data: string
  filename: string
  mimeType: string
  createdAt: Date
}

export interface InspirationData {
  id: string
  title: string
  description: string
  image: string
  category?: string
  tags?: string[]
  isActive: boolean
  sortOrder: number
  displaySize?: 'small' | 'medium' | 'large'
  components?: ComponentData[]
  createdAt: Date
  updatedAt: Date
}

export interface PresetData {
  id: string
  name: string
  description: string
  components: ComponentData[]
  preview?: string
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface BundleData {
  id: string
  name: string
  description: string
  components: string[]
  price: number
  image?: string
  createdAt: Date
  updatedAt: Date
}

// Add configuration interface
export interface ConfigurationData {
  id: string
  customerId: string
  name: string
  description?: string
  data: any // JSON or object representing the configuration
  createdAt: Date
  updatedAt: Date
}
