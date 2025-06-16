"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ruler } from "lucide-react"

interface RoomDimensions {
  width: number
  length: number
  height: number
}

interface StandaloneRoomDimensionsProps {
  initialDimensions: RoomDimensions
  onDimensionsChange?: (dimensions: RoomDimensions) => void
}

export function StandaloneRoomDimensions({ initialDimensions, onDimensionsChange }: StandaloneRoomDimensionsProps) {
  const [dimensions, setDimensions] = useState<RoomDimensions>(initialDimensions)
  const prevDimensionsRef = useRef<RoomDimensions>(initialDimensions)

  // Handle dimension changes
  const handleChange = (dimension: keyof RoomDimensions, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setDimensions((prev) => ({ ...prev, [dimension]: numValue }))
    }
  }

  // Update parent when dimensions change
  useEffect(() => {
    const prevDimensions = prevDimensionsRef.current
    if (
      dimensions.width !== prevDimensions.width ||
      dimensions.length !== prevDimensions.length ||
      dimensions.height !== prevDimensions.height
    ) {
      prevDimensionsRef.current = dimensions
      onDimensionsChange?.(dimensions)
    }
  }, [dimensions])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-blue-600" />
              <Label htmlFor="room-width" className="font-medium">
                Room Width (m)
              </Label>
            </div>
            <Input
              id="room-width"
              type="number"
              min="1"
              step="0.1"
              value={dimensions.width}
              onChange={(e) => handleChange("width", e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Width of the room from left to right</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-green-600" />
              <Label htmlFor="room-length" className="font-medium">
                Room Length (m)
              </Label>
            </div>
            <Input
              id="room-length"
              type="number"
              min="1"
              step="0.1"
              value={dimensions.length}
              onChange={(e) => handleChange("length", e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Length of the room from front to back</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-purple-600" />
              <Label htmlFor="room-height" className="font-medium">
                Ceiling Height (m)
              </Label>
            </div>
            <Input
              id="room-height"
              type="number"
              min="1"
              step="0.1"
              value={dimensions.height}
              onChange={(e) => handleChange("height", e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Height from floor to ceiling</p>
          </CardContent>
        </Card>
      </div>

      {/* Room visualization */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Room Preview</h3>
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs">
              <div
                className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4"
                style={{
                  aspectRatio: `${Math.max(dimensions.width, dimensions.length)}/${Math.min(dimensions.width, dimensions.length)}`,
                  maxHeight: "160px",
                }}
              >
                {/* Room outline */}
                <div className="relative w-full h-full border-2 border-gray-600 rounded bg-gray-50">
                  {/* Dimension labels inside the room */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                    {dimensions.width}m
                  </div>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                    {dimensions.width}m
                  </div>
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-700 -rotate-90">
                    {dimensions.length}m
                  </div>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-700 rotate-90">
                    {dimensions.length}m
                  </div>

                  {/* Height indicator */}
                  <div className="absolute top-1 right-1 px-1 py-0.5 bg-purple-100 border border-purple-300 rounded text-xs">
                    H: {dimensions.height}m
                  </div>
                </div>
              </div>

              {/* Room stats below */}
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-center">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium text-blue-800">Area</div>
                  <div>{(dimensions.width * dimensions.length).toFixed(1)} m²</div>
                </div>
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">Volume</div>
                  <div>{(dimensions.width * dimensions.length * dimensions.height).toFixed(1)} m³</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <strong>💡 Tips:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Standard room height is typically 2.4m to 3m</li>
          <li>For accurate lighting placement, measure your room carefully</li>
          <li>Consider furniture placement when planning your lighting</li>
        </ul>
      </div>
    </div>
  )
}
