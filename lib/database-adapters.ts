export interface DatabaseAdapter {
  init(): Promise<void>
  testConnection(): Promise<boolean>

  // Component operations
  getComponents(): Promise<ComponentData[]>
  saveComponent(component: ComponentData): Promise<void>
  deleteComponents(ids: string[]): Promise<void>

  // Bundle operations
  getBundles(): Promise<BundleData[]>
  saveBundle(bundle: BundleData): Promise<void>
  deleteBundle(id: string): Promise<void>

  // Preset operations
  getPresets(): Promise<PresetData[]>
  savePreset(preset: PresetData): Promise<void>
  deletePreset(id: string): Promise<void>

  // Inspiration operations
  getInspirations(): Promise<InspirationData[]>
  saveInspiration(inspiration: InspirationData): Promise<void>
  deleteInspiration(id: string): Promise<void>

  // Utility operations
  clearAll(): Promise<void>
  exportData(): Promise<string>
  importData(data: string): Promise<void>

  // New operations
  getFile(id: string): Promise<any>
}

import type { ComponentData, BundleData, PresetData, InspirationData } from "./database"

// IndexedDB Adapter (existing functionality)
export class IndexedDBAdapter implements DatabaseAdapter {
  private db: IDBDatabase | null = null
  private readonly dbName = "ACBLightingDB"
  private readonly version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("components")) {
          db.createObjectStore("components", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("bundles")) {
          db.createObjectStore("bundles", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("presets")) {
          db.createObjectStore("presets", { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("inspirations")) {
          db.createObjectStore("inspirations", { keyPath: "id" })
        }
      }
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.init()
      return true
    } catch {
      return false
    }
  }

  async getComponents(): Promise<ComponentData[]> {
    if (!this.db) await this.init()
    return this.getAll("components")
  }

  async saveComponent(component: ComponentData): Promise<void> {
    if (!this.db) await this.init()
    await this.save("components", component)
  }

  async deleteComponents(ids: string[]): Promise<void> {
    if (!this.db) await this.init()
    for (const id of ids) {
      await this.delete("components", id)
    }
  }

  async getBundles(): Promise<BundleData[]> {
    if (!this.db) await this.init()
    return this.getAll("bundles")
  }

  async saveBundle(bundle: BundleData): Promise<void> {
    if (!this.db) await this.init()
    await this.save("bundles", bundle)
  }

  async deleteBundle(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.delete("bundles", id)
  }

  async getPresets(): Promise<PresetData[]> {
    if (!this.db) await this.init()
    return this.getAll("presets")
  }

  async savePreset(preset: PresetData): Promise<void> {
    if (!this.db) await this.init()
    await this.save("presets", preset)
  }

  async deletePreset(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.delete("presets", id)
  }

  async getInspirations(): Promise<InspirationData[]> {
    if (!this.db) await this.init()
    return this.getAll("inspirations")
  }

  async saveInspiration(inspiration: InspirationData): Promise<void> {
    if (!this.db) await this.init()
    await this.save("inspirations", inspiration)
  }

  async deleteInspiration(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.delete("inspirations", id)
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()
    const stores = ["components", "bundles", "presets", "inspirations"]
    for (const store of stores) {
      await this.clearStore(store)
    }
  }

  async exportData(): Promise<string> {
    const data = {
      components: await this.getComponents(),
      bundles: await this.getBundles(),
      presets: await this.getPresets(),
      inspirations: await this.getInspirations(),
    }
    return JSON.stringify(data, null, 2)
  }

  async importData(data: string): Promise<void> {
    const parsed = JSON.parse(data)

    if (parsed.components) {
      for (const component of parsed.components) {
        await this.saveComponent(component)
      }
    }
    if (parsed.bundles) {
      for (const bundle of parsed.bundles) {
        await this.saveBundle(bundle)
      }
    }
    if (parsed.presets) {
      for (const preset of parsed.presets) {
        await this.savePreset(preset)
      }
    }
    if (parsed.inspirations) {
      for (const inspiration of parsed.inspirations) {
        await this.saveInspiration(inspiration)
      }
    }
  }

  private async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  private async save(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getFile(id: string): Promise<any> {
    throw new Error('getFile is not implemented for IndexedDBAdapter')
  }
}

// REST API Adapter
export class RestAPIAdapter implements DatabaseAdapter {
  private baseUrl: string
  private apiKey?: string

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "") // Remove trailing slash
    this.apiKey = config.apiKey
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    
    // Try to get admin token from localStorage for authentication
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin-token')
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`
      }
    }
    
    // Fallback to configured API key
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`
    }
    
    return headers
  }

  async init(): Promise<void> {
    // No initialization needed for REST API
  }

  async testConnection(): Promise<boolean> {
    try {
      await fetch(this.baseUrl + "/components", {
        method: "GET",
        headers: this.getHeaders(),
      })
      return true
    } catch {
      return false
    }
  }

  async getComponents(): Promise<ComponentData[]> {
    const response = await fetch(this.baseUrl + "/components", {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch components")
    return response.json()
  }

  async saveComponent(component: ComponentData): Promise<void> {
    const method = component.id ? "PUT" : "POST"
    const response = await fetch(this.baseUrl + "/components", {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(component),
    })
    if (!response.ok) throw new Error("Failed to save component")
  }

  async deleteComponents(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id) =>
        fetch(this.baseUrl + "/components?id=" + id, {
          method: "DELETE",
          headers: this.getHeaders(),
        })
      )
    )
  }

  async getBundles(): Promise<BundleData[]> {
    const response = await fetch(this.baseUrl + "/bundles", {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch bundles")
    return response.json()
  }

  async saveBundle(bundle: BundleData): Promise<void> {
    const method = bundle.id ? "PUT" : "POST"
    const response = await fetch(this.baseUrl + "/bundles", {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(bundle),
    })
    if (!response.ok) throw new Error("Failed to save bundle")
  }

  async deleteBundle(id: string): Promise<void> {
    const response = await fetch(this.baseUrl + "/bundles?id=" + id, {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete bundle")
  }

  async getPresets(): Promise<PresetData[]> {
    const response = await fetch(this.baseUrl + "/presets", {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch presets")
    return response.json()
  }

  async savePreset(preset: PresetData): Promise<void> {
    const response = await fetch(this.baseUrl + "/presets", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(preset),
    })
    if (!response.ok) throw new Error("Failed to save preset")
  }

  async deletePreset(id: string): Promise<void> {
    const response = await fetch(this.baseUrl + "/presets?id=" + id, {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete preset")
  }

  async getInspirations(): Promise<InspirationData[]> {
    const response = await fetch(this.baseUrl + "/inspirations", {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch inspirations")
    return response.json()
  }

  async saveInspiration(inspiration: InspirationData): Promise<void> {
    const response = await fetch(this.baseUrl + "/inspirations", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(inspiration),
    })
    if (!response.ok) throw new Error("Failed to save inspiration")
  }

  async deleteInspiration(id: string): Promise<void> {
    const response = await fetch(this.baseUrl + "/inspirations?id=" + id, {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete inspiration")
  }

  async clearAll(): Promise<void> {
    const response = await fetch(this.baseUrl + "/clear", {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to clear all data")
  }

  async exportData(): Promise<string> {
    const response = await fetch(this.baseUrl + "/export", {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error("Failed to export data")
    return response.text()
  }

  async importData(data: string): Promise<void> {
    const response = await fetch(this.baseUrl + "/import", {
      method: "POST",
      headers: this.getHeaders(),
      body: data,
    })
    if (!response.ok) throw new Error("Failed to import data")
  }

  async getFile(id: string): Promise<any> {
    const response = await fetch(this.baseUrl + "/files/" + id, {
      method: "GET",
      headers: this.getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch file')
    return response.json()
  }
}
