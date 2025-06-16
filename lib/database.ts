"use client"

import type { SnapPoint } from "./snap-system"

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
  category: string
  tags: string[]
  isActive: boolean
  sortOrder: number
  displaySize: "small" | "medium" | "large"
  createdAt: Date
  updatedAt: Date
}

export interface PresetData {
  id: string
  name: string
  description: string
  category: "track-layout" | "room-setup" | "lighting-scene"
  components: PresetComponent[]
  roomDimensions?: {
    width: number
    length: number
    height: number
  }
  hangingHeight?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PresetComponent {
  componentId: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: [number, number, number]
  properties?: Record<string, any>
}

export interface BundleData {
  id: string
  name: string
  description: string
  components: string[]
  price: number
  createdAt: Date
  updatedAt: Date
}

// Simple in-memory database implementation
class Database {
  private components: Map<string, ComponentData> = new Map()
  private presets: Map<string, PresetData> = new Map()
  private bundles: Map<string, BundleData> = new Map()
  private initialized = false

  // Component methods
  async saveComponent(component: ComponentData): Promise<ComponentData> {
    await this.init()
    try {
      const updatedComponent = {
        ...component,
        updatedAt: new Date(),
      }
      this.components.set(component.id, updatedComponent)
      console.log(`Component saved: ${component.id}`)
      return updatedComponent
    } catch (error) {
      console.error("Error saving component:", error)
      throw error
    }
  }

  async getComponent(id: string): Promise<ComponentData | null> {
    await this.init()
    try {
      const component = this.components.get(id)
      return component || null
    } catch (error) {
      console.error("Error getting component:", error)
      return null
    }
  }

  async getAllComponents(): Promise<ComponentData[]> {
    await this.init()
    try {
      return Array.from(this.components.values())
    } catch (error) {
      console.error("Error getting all components:", error)
      return []
    }
  }

  async deleteComponent(id: string): Promise<boolean> {
    try {
      const deleted = this.components.delete(id)
      console.log(`Component deleted: ${id}`)
      return deleted
    } catch (error) {
      console.error("Error deleting component:", error)
      return false
    }
  }

  // Preset methods
  async savePreset(preset: PresetData): Promise<PresetData> {
    try {
      const updatedPreset = {
        ...preset,
        updatedAt: new Date(),
      }
      this.presets.set(preset.id, updatedPreset)
      console.log(`Preset saved: ${preset.id}`)
      return updatedPreset
    } catch (error) {
      console.error("Error saving preset:", error)
      throw error
    }
  }

  async getAllPresets(): Promise<PresetData[]> {
    try {
      return Array.from(this.presets.values())
    } catch (error) {
      console.error("Error getting all presets:", error)
      return []
    }
  }

  async getPresetsByCategory(category: string): Promise<PresetData[]> {
    try {
      const allPresets = await this.getAllPresets()
      return allPresets.filter((preset) => preset.category === category && preset.isActive)
    } catch (error) {
      console.error("Error getting presets by category:", error)
      return []
    }
  }

  async deletePreset(id: string): Promise<boolean> {
    try {
      const deleted = this.presets.delete(id)
      console.log(`Preset deleted: ${id}`)
      return deleted
    } catch (error) {
      console.error("Error deleting preset:", error)
      return false
    }
  }

  // Bundle methods
  async saveBundle(bundle: BundleData): Promise<BundleData> {
    try {
      this.bundles.set(bundle.id, bundle)
      console.log(`Bundle saved: ${bundle.id}`)
      return bundle
    } catch (error) {
      console.error("Error saving bundle:", error)
      throw error
    }
  }

  async getAllBundles(): Promise<BundleData[]> {
    try {
      return Array.from(this.bundles.values())
    } catch (error) {
      console.error("Error getting all bundles:", error)
      return []
    }
  }

  async deleteBundle(id: string): Promise<boolean> {
    try {
      const deleted = this.bundles.delete(id)
      console.log(`Bundle deleted: ${id}`)
      return deleted
    } catch (error) {
      console.error("Error deleting bundle:", error)
      return false
    }
  }

  // Initialization method
  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    try {
      console.log("🗄️ Database: Initializing...")

      // Clear any existing data
      this.components.clear()
      this.presets.clear()
      this.bundles.clear()

      // Initialize with mock data
      await this.initializeMockData()

      console.log("✅ Database: Initialized successfully")
    } catch (error) {
      console.error("❌ Database: Initialization failed:", error)
      throw error
    }
  }

  // Method to get components (alias for getAllComponents)
  async getComponents(): Promise<ComponentData[]> {
    return this.getAllComponents()
  }

  // Method to get bundles (alias for getAllBundles)
  async getBundles(): Promise<BundleData[]> {
    return this.getAllBundles()
  }

  // Method to get presets (alias for getAllPresets)
  async getPresets(): Promise<PresetData[]> {
    return this.getAllPresets()
  }

  // Method to get inspirations (mock for now)
  async getInspirations(): Promise<any[]> {
    try {
      // Return some mock inspiration data
      return [
        {
          id: "insp-1",
          title: "Modern Living Room",
          description: "Clean lines with warm accent lighting",
          image: "/placeholder.svg?height=200&width=300",
          tags: ["modern", "living room", "warm"],
        },
        {
          id: "insp-2",
          title: "Industrial Kitchen",
          description: "Track lighting with pendant accents",
          image: "/placeholder.svg?height=200&width=300",
          tags: ["industrial", "kitchen", "track"],
        },
        {
          id: "insp-3",
          title: "Cozy Bedroom",
          description: "Soft ambient lighting for relaxation",
          image: "/placeholder.svg?height=200&width=300",
          tags: ["cozy", "bedroom", "ambient"],
        },
      ]
    } catch (error) {
      console.error("Error getting inspirations:", error)
      return []
    }
  }

  // Private method to initialize mock data
  private async initializeMockData(): Promise<void> {
    try {
      const mockComponents: ComponentData[] = [
        {
          id: "comp-1",
          name: "Track Light System",
          description: "Professional track lighting system for versatile illumination",
          type: "track",
          price: 299.99,
          image: "/placeholder.svg?height=200&width=200",
          cardImage: "/placeholder.svg?height=150&width=200",
          specifications: {
            voltage: "120V",
            wattage: "50W",
            length: "4ft",
            color: "Black",
          },
          snapPoints: [],
          isBaseComponent: true,
          category: "infrastructure",
          assemblyComplexity: "moderate",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "comp-2",
          name: "LED Spotlight",
          description: "High-efficiency LED spotlight with adjustable beam",
          type: "spotlight",
          price: 89.99,
          image: "/placeholder.svg?height=200&width=200",
          cardImage: "/placeholder.svg?height=150&width=200",
          specifications: {
            voltage: "12V",
            wattage: "15W",
            lumens: 1200,
            beam_angle: "30°",
          },
          snapPoints: [],
          requiresParent: true,
          category: "lighting",
          assemblyComplexity: "simple",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "comp-3",
          name: "Power Supply Unit",
          description: "Reliable power supply for LED lighting systems",
          type: "power-supply",
          price: 149.99,
          image: "/placeholder.svg?height=200&width=200",
          cardImage: "/placeholder.svg?height=150&width=200",
          specifications: {
            voltage: "120V",
            output: "12V",
            amperage: "10A",
            efficiency: "90%",
          },
          snapPoints: [],
          isBaseComponent: true,
          category: "power",
          assemblyComplexity: "complex",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "comp-4",
          name: "Track Connector",
          description: "Connector piece for joining track sections",
          type: "connector",
          price: 24.99,
          image: "/placeholder.svg?height=200&width=200",
          cardImage: "/placeholder.svg?height=150&width=200",
          specifications: {
            material: "Aluminum",
            finish: "Black",
            compatibility: "Standard Track",
          },
          snapPoints: [],
          requiresParent: true,
          category: "infrastructure",
          assemblyComplexity: "simple",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      // Save all mock components
      for (const component of mockComponents) {
        await this.saveComponent(component)
      }

      // Add some mock track layout presets
      const mockTrackPresets: PresetData[] = [
        {
          id: "preset-track-1",
          name: "Straight Track Layout",
          description: "Simple straight line configuration for narrow spaces",
          category: "track-layout",
          components: [
            {
              componentId: "comp-3", // Power supply
              position: [0, 0, 0],
              rotation: [0, 0, 0],
            },
            {
              componentId: "comp-1", // Track
              position: [0.5, 0, 0],
              rotation: [0, 0, 0],
              properties: { length: 2 },
            },
            {
              componentId: "comp-2", // Spotlight 1
              position: [0.25, 0.05, 0],
              rotation: [0, 0, 0],
            },
            {
              componentId: "comp-2", // Spotlight 2
              position: [0.75, 0.05, 0],
              rotation: [0, 0, 0],
            },
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "preset-track-2",
          name: "L-Shaped Track Layout",
          description: "Corner configuration for better room coverage",
          category: "track-layout",
          components: [
            {
              componentId: "comp-3", // Power supply
              position: [0, 0, 0],
              rotation: [0, 0, 0],
            },
            {
              componentId: "comp-1", // Track 1
              position: [0.5, 0, 0],
              rotation: [0, 0, 0],
              properties: { length: 1.5 },
            },
            {
              componentId: "comp-4", // Connector
              position: [1.5, 0, 0],
              rotation: [0, Math.PI / 2, 0],
            },
            {
              componentId: "comp-1", // Track 2
              position: [1.5, 0, 0.5],
              rotation: [0, Math.PI / 2, 0],
              properties: { length: 1.5 },
            },
            {
              componentId: "comp-2", // Spotlight 1
              position: [0.75, 0.05, 0],
              rotation: [0, 0, 0],
            },
            {
              componentId: "comp-2", // Spotlight 2
              position: [1.5, 0.05, 0.75],
              rotation: [0, 0, 0],
            },
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "preset-track-3",
          name: "U-Shaped Track Layout",
          description: "Three-sided coverage for maximum illumination",
          category: "track-layout",
          components: [
            {
              componentId: "comp-3", // Power supply
              position: [0, 0, 0],
              rotation: [0, 0, 0],
            },
            {
              componentId: "comp-1", // Track 1
              position: [0.5, 0, 0],
              rotation: [0, 0, 0],
              properties: { length: 2 },
            },
            {
              componentId: "comp-4", // Connector 1
              position: [2, 0, 0],
              rotation: [0, Math.PI / 2, 0],
            },
            {
              componentId: "comp-1", // Track 2
              position: [2, 0, 0.5],
              rotation: [0, Math.PI / 2, 0],
              properties: { length: 1 },
            },
            {
              componentId: "comp-4", // Connector 2
              position: [2, 0, 1],
              rotation: [0, Math.PI / 2, 0],
            },
            {
              componentId: "comp-1", // Track 3
              position: [1.5, 0, 1],
              rotation: [0, Math.PI, 0],
              properties: { length: 2 },
            },
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      for (const preset of mockTrackPresets) {
        await this.savePreset(preset)
      }

      // Add some mock bundles
      const mockBundles = [
        {
          id: "bundle-1",
          name: "Starter Kit",
          description: "Everything you need to get started",
          components: ["comp-1", "comp-2", "comp-3"],
          price: 499.99,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      for (const bundle of mockBundles) {
        await this.saveBundle(bundle)
      }

      console.log(
        `✅ Database: Loaded ${mockComponents.length} components, ${mockTrackPresets.length} track presets, ${mockBundles.length} bundles`,
      )
    } catch (error) {
      console.error("❌ Database: Error loading mock data:", error)
      throw error
    }
  }

  // Utility methods
  async clear(): Promise<void> {
    try {
      this.components.clear()
      this.presets.clear()
      this.bundles.clear()
      console.log("Database cleared")
    } catch (error) {
      console.error("Error clearing database:", error)
    }
  }

  async getStats(): Promise<{ components: number; presets: number; bundles: number }> {
    return {
      components: this.components.size,
      presets: this.presets.size,
      bundles: this.bundles.size,
    }
  }

  // Inspiration methods
  async getActiveInspirations(): Promise<InspirationData[]> {
    try {
      // For now, return mock inspiration data
      const inspirations: InspirationData[] = [
        {
          id: "sample-1",
          title: "Modern Living Room",
          description: "Contemporary track lighting with warm ambient glow",
          image: "/placeholder.svg?height=200&width=300&text=Modern+Living+Room",
          category: "living-room",
          tags: ["modern", "track-lighting", "ambient", "warm"],
          isActive: true,
          sortOrder: 0,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-2",
          title: "Industrial Kitchen",
          description: "Pendant lights over kitchen island with under-cabinet LED strips",
          image: "/placeholder.svg?height=200&width=300&text=Industrial+Kitchen",
          category: "kitchen",
          tags: ["industrial", "pendant", "led-strips", "task-lighting"],
          isActive: true,
          sortOrder: 1,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-3",
          title: "Cozy Bedroom",
          description: "Soft bedside lighting with ceiling spotlights",
          image: "/placeholder.svg?height=200&width=300&text=Cozy+Bedroom",
          category: "bedroom",
          tags: ["cozy", "bedside", "spotlights", "soft"],
          isActive: true,
          sortOrder: 2,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-4",
          title: "Elegant Dining",
          description: "Statement chandelier with dimmable wall sconces",
          image: "/placeholder.svg?height=200&width=300&text=Elegant+Dining",
          category: "dining-room",
          tags: ["elegant", "chandelier", "wall-sconces", "dimmable"],
          isActive: true,
          sortOrder: 3,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-5",
          title: "Home Office",
          description: "Task lighting with adjustable desk lamps and ceiling panels",
          image: "/placeholder.svg?height=200&width=300&text=Home+Office",
          category: "office",
          tags: ["task-lighting", "desk-lamps", "ceiling-panels", "adjustable"],
          isActive: true,
          sortOrder: 4,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-6",
          title: "Outdoor Patio",
          description: "Weather-resistant string lights and pathway illumination",
          image: "/placeholder.svg?height=200&width=300&text=Outdoor+Patio",
          category: "outdoor",
          tags: ["outdoor", "string-lights", "pathway", "weather-resistant"],
          isActive: true,
          sortOrder: 5,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-7",
          title: "Minimalist Bathroom",
          description: "Clean LED mirror lighting with recessed ceiling spots",
          image: "/placeholder.svg?height=200&width=300&text=Minimalist+Bathroom",
          category: "bathroom",
          tags: ["minimalist", "led-mirror", "recessed", "clean"],
          isActive: true,
          sortOrder: 6,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sample-8",
          title: "Rustic Cabin",
          description: "Warm wood fixtures with Edison bulb pendants",
          image: "/placeholder.svg?height=200&width=300&text=Rustic+Cabin",
          category: "living-room",
          tags: ["rustic", "wood", "edison-bulbs", "pendants"],
          isActive: true,
          sortOrder: 7,
          displaySize: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      console.log(`✅ Database: Retrieved ${inspirations.length} active inspirations`)
      return inspirations
    } catch (error) {
      console.error("❌ Database: Error getting active inspirations:", error)
      return []
    }
  }

  async saveInspiration(inspiration: InspirationData): Promise<InspirationData> {
    try {
      const updatedInspiration = {
        ...inspiration,
        updatedAt: new Date(),
      }
      console.log(`✅ Database: Inspiration saved: ${inspiration.title}`)
      return updatedInspiration
    } catch (error) {
      console.error("❌ Database: Error saving inspiration:", error)
      throw error
    }
  }

  async getInspiration(id: string): Promise<InspirationData | null> {
    try {
      // For now, return null since we're using mock data
      // In a real implementation, this would fetch from storage
      console.log(`Database: Getting inspiration ${id}`)
      return null
    } catch (error) {
      console.error("❌ Database: Error getting inspiration:", error)
      return null
    }
  }

  async resolveFileUrl(dbUrl: string): Promise<string> {
    try {
      // For db:// URLs, convert them to placeholder URLs
      if (dbUrl.startsWith("db://")) {
        const filename = dbUrl.replace("db://", "")
        return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(filename)}`
      }
      return dbUrl
    } catch (error) {
      console.error("❌ Database: Error resolving file URL:", error)
      return "/placeholder.svg?height=200&width=300&text=Error"
    }
  }

  async getFile(fileId: string): Promise<FileData | null> {
    await this.init()
    console.log("Getting file:", fileId)
    return null
  }

  async saveFile(file: FileData): Promise<void> {
    await this.init()
    console.log("File saved:", file.id)
  }
}

// Create and export the database instance
export const db = new Database()

// Export the database instance
console.log("📦 Database module loaded")

// Export types for convenience
export type { SnapPoint }
export type { InspirationData, PresetData, PresetComponent, BundleData }
