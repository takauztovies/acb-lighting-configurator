"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Lightbulb, Zap, Link, Power, Package, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConfigurator, type LightComponent } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import { db, type BundleData } from "@/lib/database"
import { Badge } from "@/components/ui/badge"
import { PresetSelector } from "./preset-selector"
import { RoomDimensionsControl } from "./room-dimensions-control"
import { CableCalculator } from "./cable-calculator"

// Extended LightComponent to include bundle data
interface ExtendedLightComponent extends LightComponent {
  bundleData?: BundleData
}

const componentIcons = {
  track: Lightbulb,
  spotlight: Zap,
  connector: Link,
  "power-supply": Power,
  bundle: Package,
  default: Package,
}

export function ConfiguratorSidebar() {
  const { state, dispatch, loadComponentsFromDatabase, refreshComponents } = useConfigurator()
  const { t } = useTranslation()
  const [sceneImageFile, setSceneImageFile] = useState<File | null>(null)
  const [bundleComponents, setBundleComponents] = useState<ExtendedLightComponent[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load bundles when component mounts
  useEffect(() => {
    const loadBundles = async () => {
      try {
        await db.init()
        const bundlesData = await db.getBundles()

        // Convert bundles to component format for display
        const bundleComponents = bundlesData.map((bundle) => ({
          id: `bundle-${bundle.id}`,
          name: bundle.name,
          type: "bundle" as "track" | "spotlight" | "connector" | "power-supply",
          price: bundle.price,
          image: "/placeholder.svg?height=100&width=100&text=Bundle",
          specifications: {
            description: bundle.description,
            components: bundle.components,
            discount: `${bundle.discountPercentage}%`,
          },
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          connections: [],
          connectionPoints: [],
          bundleData: bundle,
        }))

        setBundleComponents(bundleComponents)
        console.log("ConfiguratorSidebar: Loaded bundles:", bundleComponents.length)
      } catch (error) {
        console.error("ConfiguratorSidebar: Error loading bundles:", error)
      }
    }

    loadBundles()
  }, [])

  // Force refresh components
  const handleRefreshComponents = async () => {
    console.log("ConfiguratorSidebar: Manual refresh triggered")
    setLastRefresh(new Date())
    await refreshComponents()
  }

  // Fix the scene image handling
  const handleSceneImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSceneImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // Fix the dispatch call to use the correct action type and parameters
        dispatch({ type: "SET_SCENE_IMAGE", surface: "floor", imageData: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const addComponent = (component: ExtendedLightComponent) => {
    if (component.type === "bundle" && component.bundleData) {
      // For bundles, add all the components in the bundle
      const bundleData = component.bundleData
      let addedCount = 0

      // Get the original components from the bundle
      bundleData.components.forEach(async (item) => {
        try {
          // Find the component in the available components
          const componentToAdd = state.availableComponents.find((c) => c.id === item.componentId)

          if (componentToAdd) {
            // Add each component the specified number of times
            for (let i = 0; i < item.quantity; i++) {
              const newComponent = {
                ...componentToAdd,
                id: `${componentToAdd.id}-${Date.now()}-${i}`,
                position: [
                  Math.random() * 4 - 2 + i * 0.5, // Spread components out
                  0.5,
                  Math.random() * 4 - 2 + i * 0.5,
                ] as [number, number, number],
                rotation: [0, 0, 0] as [number, number, number],
                connections: [],
                connectionPoints: [],
              }
              dispatch({ type: "ADD_COMPONENT", component: newComponent })
              addedCount++
            }
          } else {
            console.warn(`Component ${item.componentId} not found in available components`)
          }
        } catch (error) {
          console.error(`Error adding component ${item.componentId} from bundle:`, error)
        }
      })

      console.log(`Bundle "${component.name}" added ${addedCount} components to configuration`)
    } else {
      // Regular component handling
      const newComponent = {
        ...component,
        id: `${component.id}-${Date.now()}`,
        position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        connections: [],
        connectionPoints: [],
      }
      dispatch({ type: "ADD_COMPONENT", component: newComponent })
    }
  }

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(t("locale"), {
        style: "currency",
        currency: t("currencyCode"),
      }).format(amount)
    } catch (error) {
      return `${t("currencySymbol")}${amount.toFixed(2)}`
    }
  }

  // Combine available components with bundles
  const allComponents = [...(state.availableComponents || []), ...bundleComponents]

  // Safely group components
  const groupedComponents: Record<string, ExtendedLightComponent[]> = {}

  // Only process if allComponents is an array
  if (Array.isArray(allComponents)) {
    allComponents.forEach((component) => {
      if (component && component.type) {
        if (!groupedComponents[component.type]) {
          groupedComponents[component.type] = []
        }
        groupedComponents[component.type].push(component)
      }
    })
  }

  console.log("ConfiguratorSidebar: Rendering with availableComponents:", state.availableComponents?.length || 0)
  console.log("ConfiguratorSidebar: Available component names:", state.availableComponents?.map((c) => c.name) || [])
  console.log("ConfiguratorSidebar: groupedComponents:", Object.keys(groupedComponents))

  // Show loading state with black and white colors
  if (state.isLoadingComponents) {
    return (
      <div className="w-[420px] bg-white border-r border-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">{t("loading")}...</p>
          <p className="text-xs text-gray-500 mt-2">Loading components from database</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (state.componentLoadError) {
    return (
      <div className="w-[420px] bg-white border-r border-gray-200 p-6">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-medium mb-2">{t("errorLoadingComponents")}</p>
          <p className="text-sm text-gray-600 mb-4">{state.componentLoadError}</p>
          <Button
            onClick={handleRefreshComponents}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("retryLoading")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[420px] bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="components" className="text-xs px-2">
            {t("components")}
          </TabsTrigger>
          <TabsTrigger value="room" className="text-xs px-2">
            Room
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-xs px-2">
            {t("presets")}
          </TabsTrigger>
          <TabsTrigger value="cables" className="text-xs px-2">
            Cables
          </TabsTrigger>
          <TabsTrigger value="scene" className="text-xs px-2">
            {t("scene")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          {/* Component refresh section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Component Library</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshComponents}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {Object.keys(groupedComponents).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">{t("noComponentsAvailable")}</p>
              <p className="text-xs text-gray-400 mb-4">{t("addComponentsInAdmin")}</p>
              <Button
                size="sm"
                onClick={handleRefreshComponents}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("refreshComponents")}
              </Button>
            </div>
          ) : (
            Object.entries(groupedComponents).map(([type, components]) => {
              const Icon = componentIcons[type as keyof typeof componentIcons] || componentIcons.default
              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-sm">
                      <Icon className="w-4 h-4 mr-2" />
                      {t(type)}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {components.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {components.map((component) => (
                        <div key={component.id} className="flex flex-col justify-between p-3 border rounded-lg min-w-[170px] max-w-full">
                          <div className="flex items-center space-x-2 mb-2">
                            <img
                              src={component.image || "/placeholder.svg"}
                              alt={component.name}
                              className="w-10 h-10 rounded"
                            />
                            <div>
                              <p className="text-sm font-medium break-words whitespace-normal">{component.name}</p>
                              <div className="flex items-center space-x-2">
                                <p className="text-xs text-gray-500">{formatCurrency(component.price)}</p>
                                {component.type === "bundle" && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t("bundle")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addComponent(component)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="room" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Room Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <RoomDimensionsControl />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <PresetSelector />
        </TabsContent>

        <TabsContent value="cables" className="space-y-4">
          <CableCalculator />
        </TabsContent>

        <TabsContent value="scene" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("sceneBackground")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scene-upload">{t("uploadSceneImage")}</Label>
                <Input
                  id="scene-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleSceneImageUpload}
                  className="mt-1"
                />
              </div>
              {state.sceneImageSettings &&
                Object.entries(state.sceneImageSettings).map(
                  ([surface, imageData]) =>
                    imageData && (
                      <div key={surface} className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">{t(surface)}</p>
                        <img
                          src={imageData || "/placeholder.svg"}
                          alt={`${surface} background`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      </div>
                    ),
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
