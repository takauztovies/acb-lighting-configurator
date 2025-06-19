"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Lightbulb, Zap, Link, Power, Package, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useConfigurator, type LightComponent } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import { db, type BundleData } from "@/lib/database"
import { Badge } from "@/components/ui/badge"
import { PresetSelector } from "./preset-selector"
import { RoomDimensionsControl } from "./room-dimensions-control"
import { CableCalculator } from "./cable-calculator"
import { ComponentTileGrid, ComponentTile } from "./ComponentTileGrid"

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
    if (component.bundleData) {
      // For bundles, add all the components in the bundle (once each)
      const bundleData = component.bundleData
      let addedCount = 0
      bundleData.components.forEach((componentId) => {
        try {
          const componentToAdd = state.availableComponents.find((c) => c.id === componentId)
          if (componentToAdd) {
            const newComponent = {
              ...componentToAdd,
              id: `${componentToAdd.id}-${Date.now()}`,
              position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              connections: [],
              connectionPoints: [],
              scale: [1, 1, 1] as [number, number, number],
            }
            dispatch({ type: "ADD_COMPONENT", component: newComponent })
            addedCount++
          } else {
            console.warn(`Component ${componentId} not found in available components`)
          }
        } catch (error) {
          console.error(`Error adding component ${componentId} from bundle:`, error)
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
        scale: [1, 1, 1] as [number, number, number],
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
      {/* Native Tabs Implementation */}
      {(() => {
        const [activeTab, setActiveTab] = useState("components")
        return (
          <>
            <div className="grid w-full grid-cols-5 h-10 mb-2">
              <button className={`text-xs px-2 ${activeTab === "components" ? "font-bold border-b-2 border-black" : ""}`} onClick={() => setActiveTab("components")}>{t("components")}</button>
              <button className={`text-xs px-2 ${activeTab === "room" ? "font-bold border-b-2 border-black" : ""}`} onClick={() => setActiveTab("room")}>Room</button>
              <button className={`text-xs px-2 ${activeTab === "presets" ? "font-bold border-b-2 border-black" : ""}`} onClick={() => setActiveTab("presets")}>{t("presets")}</button>
              <button className={`text-xs px-2 ${activeTab === "cables" ? "font-bold border-b-2 border-black" : ""}`} onClick={() => setActiveTab("cables")}>Cables</button>
              <button className={`text-xs px-2 ${activeTab === "scene" ? "font-bold border-b-2 border-black" : ""}`} onClick={() => setActiveTab("scene")}>{t("scene")}</button>
            </div>
            {activeTab === "components" && (
              <div className="space-y-4">
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

                {allComponents.length === 0 ? (
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
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-sm">
                        {t("Available Components")}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {allComponents.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ComponentTileGrid
                        components={allComponents.map((component) => {
                          const isBundle = Boolean((component as ExtendedLightComponent).bundleData)
                          return {
                            id: component.id,
                            name: component.name,
                            image: component.image,
                            price: component.price,
                            type: component.type,
                            extra: isBundle ? (
                              <Badge variant="secondary" className="text-xs">{t("bundle")}</Badge>
                            ) : null,
                          }
                        })}
                        onSelect={(component) => {
                          const found = allComponents.find((c) => c.id === component.id)
                          if (found) addComponent(found as ExtendedLightComponent)
                        }}
                        showAddButton={false}
                        isFirstComponent={state.currentConfig.components.length === 0}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {activeTab === "room" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Room Dimensions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoomDimensionsControl />
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === "presets" && (
              <div className="space-y-4">
                <PresetSelector />
              </div>
            )}
            {activeTab === "cables" && (
              <div className="space-y-4">
                <CableCalculator />
              </div>
            )}
            {activeTab === "scene" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t("sceneBackground")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="scene-upload" className="block text-sm font-medium mb-1">{t("uploadSceneImage")}</label>
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
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}
