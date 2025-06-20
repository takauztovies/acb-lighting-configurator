"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComponentForm } from "./component-form"
import { DataManager } from "./data-manager"
import { BundleManager } from "./bundle-manager"
import { PresetManager } from "./preset-manager"
import { InspirationManager } from "./inspiration-manager"
import { MassUpload } from "./mass-upload"
import { SnapPointManager } from "./snap-point-manager"
import { DatabaseConfig } from "./database-config"
import { ComponentDetailsView } from "./component-details-view"
import { Settings, FileSpreadsheet, Package, Plus, Database, ImageIcon, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db, type ComponentData, type BundleData, type PresetData, type InspirationData } from "@/lib/database"

interface AdminPanelProps {
  onClose?: () => void
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [components, setComponents] = useState<ComponentData[]>([])
  const [bundles, setBundles] = useState<BundleData[]>([])
  const [presets, setPresets] = useState<PresetData[]>([])
  const [inspirations, setInspirations] = useState<InspirationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingComponent, setEditingComponent] = useState<ComponentData | null>(null)
  const [activeTab, setActiveTab] = useState("mass-upload")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await db.init()

      const [componentsData, bundlesData, presetsData, inspirationsData] = await Promise.all([
        db.getComponents(),
        db.getBundles(),
        db.getPresets(),
        db.getInspirations(),
      ])

      setComponents(componentsData)
      setBundles(bundlesData)
      setPresets(presetsData)
      setInspirations(inspirationsData)

      console.log("AdminPanel: Loaded data:", {
        components: componentsData.length,
        bundles: bundlesData.length,
        presets: presetsData.length,
        inspirations: inspirationsData.length,
      })
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComponentSaved = async (data: Partial<ComponentData>) => {
    try {
      let savedComponent: ComponentData;
      if (editingComponent && data.id) {
        // Update existing component
        savedComponent = { ...editingComponent, ...data } as ComponentData;
        await db.saveComponent(savedComponent);
        setComponents(components.map((c) => (c.id === savedComponent.id ? savedComponent : c)));
        setEditingComponent(null);
      } else {
        // Create new component
        const newComponent: ComponentData = {
          id: data.id || `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        } as ComponentData;
        await db.saveComponent(newComponent);
        setComponents([...components, newComponent]);
      }
      notifyComponentsUpdated();
    } catch (error) {
      console.error('Error saving component:', error);
    }
  }

  const handleComponentUpdated = (updatedComponent: ComponentData) => {
    setComponents(components.map((comp) => (comp.id === updatedComponent.id ? updatedComponent : comp)))
    console.log("Component updated:", updatedComponent.id)
  }

  const notifyComponentsUpdated = () => {
    localStorage.setItem("acb-components-updated", Date.now().toString())
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "acb-components-updated",
        newValue: Date.now().toString(),
      }),
    )
    console.log("Components updated notification sent")
  }

  const handleEditComponent = (component: ComponentData) => {
    setEditingComponent(component)
    setActiveTab("add-component")
  }

  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm("Are you sure you want to delete this component?")) return

    try {
      await db.deleteComponents([componentId])
      setComponents(components.filter((c) => c.id !== componentId))
      notifyComponentsUpdated()
      console.log("Component deleted:", componentId)
    } catch (error) {
      console.error("Error deleting component:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
            <TabsTrigger value="mass-upload" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Mass Upload
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Components ({components.length})
            </TabsTrigger>
            <TabsTrigger value="add-component" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {editingComponent ? "Edit Component" : "Add Component"}
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Bundles ({bundles.length})
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Presets ({presets.length})
            </TabsTrigger>
            <TabsTrigger value="inspiration" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Inspiration ({inspirations.length})
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Database Config
            </TabsTrigger>
            <TabsTrigger value="snap-points" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Snap Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mass-upload" className="space-y-4">
            <MassUpload onUploadComplete={loadData} />
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <ComponentDetailsView
              components={components}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="add-component" className="space-y-4">
            <ComponentForm onComponentSaved={handleComponentSaved} editingComponent={editingComponent || undefined} />
            {editingComponent && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingComponent(null)
                  setActiveTab("components")
                }}
              >
                Cancel Edit
              </Button>
            )}
          </TabsContent>

          <TabsContent value="bundles" className="space-y-4">
            <BundleManager
              bundles={bundles}
              components={components}
              onBundleSaved={() => loadData()}
              onBundleDeleted={() => loadData()}
            />
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <PresetManager
              components={components}
              onSave={(preset) => setPresets([...presets, preset])}
              onDelete={(presetId) => setPresets(presets.filter(p => p.id !== presetId))}
            />
          </TabsContent>

          <TabsContent value="inspiration" className="space-y-4">
            <InspirationManager
              onInspirationSaved={() => loadData()}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <DataManager components={components} />
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <DatabaseConfig
              currentConfig={{
                type: "indexeddb",
                config: {},
              }}
              onConfigChange={(config) => console.log("Database config changed:", config)}
              onTestConnection={async (config) => {
                console.log("Testing connection:", config)
                return true
              }}
            />
          </TabsContent>

          <TabsContent value="snap-points" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Snap Point Management</h2>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Components
              </Button>
            </div>
            <SnapPointManager components={components} onSnapPointsUpdated={handleComponentUpdated} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
