"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfigurator } from "./configurator-context"
import { Ruler, RotateCcw, Check, X, Plus, Minus } from "lucide-react"

// Room presets with dimensions in meters
const ROOM_PRESETS = {
  "small-office": { width: 4, length: 3, height: 2.7, name: "Small Office" },
  "medium-office": { width: 6, length: 4, height: 3, name: "Medium Office" },
  "large-office": { width: 8, length: 6, height: 3, name: "Large Office" },
  "conference-room": { width: 10, length: 6, height: 3.2, name: "Conference Room" },
  "retail-store": { width: 12, length: 8, height: 3.5, name: "Retail Store" },
  warehouse: { width: 20, length: 15, height: 6, name: "Warehouse" },
  "living-room": { width: 5, length: 4, height: 2.7, name: "Living Room" },
  kitchen: { width: 4, length: 3, height: 2.4, name: "Kitchen" },
}

// Default room dimensions in meters
const DEFAULT_ROOM = { width: 8, length: 6, height: 3 }

export function RoomDimensionsControl() {
  const { state, dispatch } = useConfigurator()
  const [isEditMode, setIsEditMode] = useState(false)

  // Initialize with default values if state.roomDimensions is undefined
  const [dimensions, setDimensions] = useState({
    width: state.roomDimensions?.width || DEFAULT_ROOM.width,
    length: state.roomDimensions?.length || DEFAULT_ROOM.length,
    height: state.roomDimensions?.height || DEFAULT_ROOM.height,
  })

  // Update local state when context state changes
  useEffect(() => {
    if (state.roomDimensions) {
      setDimensions({
        width: state.roomDimensions.width || DEFAULT_ROOM.width,
        length: state.roomDimensions.length || DEFAULT_ROOM.length,
        height: state.roomDimensions.height || DEFAULT_ROOM.height,
      })
    }
  }, [state.roomDimensions])

  // Calculate room area and volume
  const area = dimensions.width * dimensions.length
  const volume = area * dimensions.height

  // Handle dimension changes
  const handleDimensionChange = (dimension: "width" | "length" | "height", value: number) => {
    // Ensure minimum values
    const minValues = { width: 1, length: 1, height: 1 }
    const maxValues = { width: 30, length: 30, height: 10 }

    const newValue = Math.max(minValues[dimension], Math.min(maxValues[dimension], value))

    setDimensions((prev) => ({
      ...prev,
      [dimension]: newValue,
    }))
  }

  // Apply dimensions to the configurator context
  const applyDimensions = () => {
    dispatch({
      type: "SET_ROOM_DIMENSIONS",
      dimensions: {
        width: dimensions.width,
        length: dimensions.length,
        height: dimensions.height,
      },
    })
    setIsEditMode(false)
  }

  // Reset to default dimensions
  const resetDimensions = () => {
    setDimensions(DEFAULT_ROOM)
    dispatch({
      type: "SET_ROOM_DIMENSIONS",
      dimensions: DEFAULT_ROOM,
    })
  }

  // Apply preset room dimensions
  const applyPreset = (presetKey: string) => {
    const preset = ROOM_PRESETS[presetKey as keyof typeof ROOM_PRESETS]
    if (preset) {
      setDimensions(preset)
      dispatch({
        type: "SET_ROOM_DIMENSIONS",
        dimensions: preset,
      })
    }
  }

  return (
    <div className="w-full space-y-6 p-4">
      {!isEditMode ? (
        <>
          {/* Current Dimensions Display */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Width</div>
              <div className="text-3xl font-bold text-black">{dimensions.width}m</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Length</div>
              <div className="text-3xl font-bold text-black">{dimensions.length}m</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Height</div>
              <div className="text-3xl font-bold text-black">{dimensions.height}m</div>
            </div>
          </div>

          {/* Room Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Floor Area</div>
                <div className="text-xl font-semibold text-black">{area.toFixed(1)} m²</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Volume</div>
                <div className="text-xl font-semibold text-black">{volume.toFixed(1)} m³</div>
              </div>
            </div>
          </div>

          {/* Quick Size Adjustments */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const newDims = { ...dimensions, width: dimensions.width + 1, length: dimensions.length + 1 }
                setDimensions(newDims)
                dispatch({ type: "SET_ROOM_DIMENSIONS", dimensions: newDims })
              }}
              className="h-12 border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Larger Room
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const newDims = {
                  width: Math.max(1, dimensions.width - 1),
                  length: Math.max(1, dimensions.length - 1),
                }
                setDimensions({ ...newDims, height: dimensions.height })
                dispatch({ type: "SET_ROOM_DIMENSIONS", dimensions: { ...newDims, height: dimensions.height } })
              }}
              className="h-12 border-gray-300 hover:bg-gray-50"
            >
              <Minus className="h-4 w-4 mr-2" />
              Smaller Room
            </Button>
          </div>

          {/* Room presets */}
          <div className="space-y-2">
            <Label htmlFor="room-preset" className="text-sm font-medium text-black">
              Room Preset
            </Label>
            <Select onValueChange={applyPreset}>
              <SelectTrigger id="room-preset" className="w-full h-12 border-gray-300">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROOM_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name} ({preset.width}×{preset.length}×{preset.height}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setIsEditMode(true)} className="h-12 bg-black text-white hover:bg-gray-800">
              <Ruler className="h-4 w-4 mr-2" />
              Edit Dimensions
            </Button>
            <Button
              variant="outline"
              onClick={resetDimensions}
              className="h-12 border-gray-300 hover:bg-gray-50"
              title="Reset to default"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Editing Mode */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="width" className="text-sm font-medium text-black mb-2 block">
                  Width (m)
                </Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange("width", Number.parseFloat(e.target.value) || 0)}
                  className="h-12 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="length" className="text-sm font-medium text-black mb-2 block">
                  Length (m)
                </Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={dimensions.length}
                  onChange={(e) => handleDimensionChange("length", Number.parseFloat(e.target.value) || 0)}
                  className="h-12 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-sm font-medium text-black mb-2 block">
                  Height (m)
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange("height", Number.parseFloat(e.target.value) || 0)}
                  className="h-12 border-gray-300"
                />
              </div>
            </div>

            {/* Room Presets */}
            <div>
              <Label className="text-sm font-medium text-black mb-3 block">Quick Presets</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(ROOM_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => setDimensions(preset)}
                    className="h-auto p-3 border-gray-300 text-left justify-start hover:bg-gray-50"
                    title={preset.name}
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm text-black">{preset.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {preset.width}×{preset.length}×{preset.height}m
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview Calculations */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-sm font-medium text-black mb-3">Preview</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-600">Area</div>
                  <div className="font-semibold text-black">{(dimensions.width * dimensions.length).toFixed(1)} m²</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Volume</div>
                  <div className="font-semibold text-black">
                    {(dimensions.width * dimensions.length * dimensions.height).toFixed(1)} m³
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={applyDimensions} className="h-12 bg-black text-white hover:bg-gray-800">
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
                className="h-12 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-lg">
        <strong>Tip:</strong> Room dimensions affect lighting calculations and component placement. Standard ceiling
        height is 2.7-3m for offices, 2.4m for residential spaces.
      </div>
    </div>
  )
}
