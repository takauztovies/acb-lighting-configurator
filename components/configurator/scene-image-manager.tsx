"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Upload, Move, ZoomIn, Grid3X3 } from "lucide-react"
import { useConfigurator } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"

interface SceneImageSettings {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number]
  opacity: number
  perspective: number
  depth: number
}

export function SceneImageManager() {
  const { state, dispatch } = useConfigurator()
  const { t } = useTranslation()
  const [imageSettings, setImageSettings] = useState<SceneImageSettings>({
    position: [0, 2, -5],
    rotation: [0, 0, 0],
    scale: [8, 4.5], // More realistic 16:9 aspect ratio
    opacity: 0.8,
    perspective: 1,
    depth: -5,
  })
  const [editMode, setEditMode] = useState<"position" | "scale" | "perspective">("position")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string

        // Validate the result
        if (!result || result === "undefined" || result === "null") {
          console.error("Invalid file read result")
          return
        }

        dispatch({ type: "SET_SCENE_IMAGE", image: result })

        // Auto-detect image dimensions and adjust scale
        const img = new Image()
        img.onload = () => {
          const aspectRatio = img.width / img.height

          // Calculate realistic scale based on aspect ratio
          let baseWidth = 8 // Base width in world units
          let baseHeight = baseWidth / aspectRatio

          // Limit height to reasonable bounds
          if (baseHeight > 6) {
            baseHeight = 6
            baseWidth = baseHeight * aspectRatio
          }

          setImageSettings((prev) => ({
            ...prev,
            scale: [baseWidth, baseHeight],
          }))
        }
        img.onerror = () => {
          console.error("Failed to load uploaded image")
        }
        img.src = result
      }
      reader.onerror = () => {
        console.error("Failed to read file")
      }
      reader.readAsDataURL(file)
    }
  }

  const updateImageSettings = (key: keyof SceneImageSettings, value: any) => {
    setImageSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Preset room configurations
  const roomPresets = [
    {
      name: "Living Room",
      settings: {
        position: [0, 1.5, -6],
        rotation: [0, 0, 0],
        scale: [10, 5.6], // 16:9 ratio
        opacity: 0.7,
        perspective: 1.2,
        depth: -6,
      },
    },
    {
      name: "Kitchen",
      settings: {
        position: [0, 2, -4],
        rotation: [0, 0, 0],
        scale: [6, 4], // 3:2 ratio
        opacity: 0.8,
        perspective: 0.8,
        depth: -4,
      },
    },
    {
      name: "Office",
      settings: {
        position: [0, 1.8, -5],
        rotation: [0, 0, 0],
        scale: [8, 4.5], // 16:9 ratio
        opacity: 0.75,
        perspective: 1,
        depth: -5,
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          {t("sceneImageSettings")}
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3 mr-1" />
            {t("upload")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {state.sceneImage && (
          <>
            {/* Image preview */}
            <div className="relative">
              <img
                src={state.sceneImage || "/placeholder.svg?height=100&width=150&text=No+Image"}
                alt="Scene background"
                className="w-full h-24 object-cover rounded border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=100&width=150&text=Error+Loading"
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                <span className="text-white text-xs font-medium">Scene Background</span>
              </div>
            </div>

            {/* Edit mode selector */}
            <ToggleGroup
              type="single"
              value={editMode}
              onValueChange={(value) => value && setEditMode(value as any)}
              className="w-full"
            >
              <ToggleGroupItem value="position" size="sm">
                <Move className="w-3 h-3 mr-1" />
                Position
              </ToggleGroupItem>
              <ToggleGroupItem value="scale" size="sm">
                <ZoomIn className="w-3 h-3 mr-1" />
                Scale
              </ToggleGroupItem>
              <ToggleGroupItem value="perspective" size="sm">
                <Grid3X3 className="w-3 h-3 mr-1" />
                Perspective
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Position controls */}
            {editMode === "position" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Slider
                    value={[imageSettings.position[0]]}
                    onValueChange={([value]) =>
                      updateImageSettings("position", [value, imageSettings.position[1], imageSettings.position[2]])
                    }
                    min={-10}
                    max={10}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Position (Height)</Label>
                  <Slider
                    value={[imageSettings.position[1]]}
                    onValueChange={([value]) =>
                      updateImageSettings("position", [imageSettings.position[0], value, imageSettings.position[2]])
                    }
                    min={0}
                    max={5}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Depth (Z Position)</Label>
                  <Slider
                    value={[imageSettings.position[2]]}
                    onValueChange={([value]) =>
                      updateImageSettings("position", [imageSettings.position[0], imageSettings.position[1], value])
                    }
                    min={-15}
                    max={-1}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Scale controls */}
            {editMode === "scale" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Slider
                    value={[imageSettings.scale[0]]}
                    onValueChange={([value]) => updateImageSettings("scale", [value, imageSettings.scale[1]])}
                    min={2}
                    max={20}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Slider
                    value={[imageSettings.scale[1]]}
                    onValueChange={([value]) => updateImageSettings("scale", [imageSettings.scale[0], value])}
                    min={2}
                    max={15}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[imageSettings.opacity]}
                    onValueChange={([value]) => updateImageSettings("opacity", value)}
                    min={0.1}
                    max={1}
                    step={0.05}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Perspective controls */}
            {editMode === "perspective" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Perspective Distortion</Label>
                  <Slider
                    value={[imageSettings.perspective]}
                    onValueChange={([value]) => updateImageSettings("perspective", value)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Rotation</Label>
                  <Slider
                    value={[imageSettings.rotation[1]]}
                    onValueChange={([value]) =>
                      updateImageSettings("rotation", [imageSettings.rotation[0], value, imageSettings.rotation[2]])
                    }
                    min={-Math.PI / 4}
                    max={Math.PI / 4}
                    step={0.01}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Room presets */}
            <div>
              <Label className="text-xs mb-2 block">Room Presets</Label>
              <div className="grid grid-cols-1 gap-2">
                {roomPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    size="sm"
                    variant="outline"
                    onClick={() => setImageSettings(preset.settings)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-fit button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (state.sceneImage && state.sceneImage !== "undefined" && state.sceneImage !== "null") {
                  const img = new Image()
                  img.onload = () => {
                    const aspectRatio = img.width / img.height
                    let baseWidth = 8
                    let baseHeight = baseWidth / aspectRatio

                    if (baseHeight > 6) {
                      baseHeight = 6
                      baseWidth = baseHeight * aspectRatio
                    }

                    setImageSettings((prev) => ({
                      ...prev,
                      scale: [baseWidth, baseHeight],
                      position: [0, baseHeight / 2 + 0.5, -5],
                    }))
                  }
                  img.onerror = () => {
                    console.error("Failed to load scene image for auto-fit")
                  }
                  img.src = state.sceneImage
                }
              }}
              className="text-xs w-full"
            >
              Auto-fit Image
            </Button>

            {/* Apply settings button */}
            <Button
              className="w-full"
              onClick={() => {
                // Store the image settings in the global state
                dispatch({
                  type: "SET_SCENE_IMAGE_SETTINGS",
                  settings: imageSettings,
                })
              }}
            >
              Apply Settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
