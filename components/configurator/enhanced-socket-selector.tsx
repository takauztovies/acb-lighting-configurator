"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, MapPin, Target, Home, Settings } from "lucide-react"

interface SocketPosition {
  x: number
  y: number
  z: number
  wall: string
  description: string
  distanceFromLeft?: number
  distanceFromBottom?: number
  distanceFromRight?: number
  distanceFromTop?: number
}

interface EnhancedSocketSelectorProps {
  roomDimensions: { width: number; length: number; height: number }
  onPositionSelect: (position: SocketPosition) => void
  selectedPosition: SocketPosition | null
}

export function EnhancedSocketSelector({
  roomDimensions,
  onPositionSelect,
  selectedPosition,
}: EnhancedSocketSelectorProps) {
  const [selectedWall, setSelectedWall] = useState<string>("back")
  const [socketHeight, setSocketHeight] = useState(0.3) // 30cm from floor
  const [customPosition, setCustomPosition] = useState({ x: 0, y: 0 })
  const [positioningMode, setPositioningMode] = useState<"preset" | "custom">("preset")

  const walls = [
      { id: "back", name: "Back Wall", icon: "⬅️", recommended: true, color: "bg-gray-50 border-gray-200" },
  { id: "left", name: "Left Wall", icon: "↖️", color: "bg-gray-50 border-gray-200" },
  { id: "right", name: "Right Wall", icon: "↗️", color: "bg-gray-50 border-gray-200" },
  { id: "front", name: "Front Wall", icon: "➡️", color: "bg-gray-50 border-gray-200" },
  { id: "ceiling", name: "Ceiling", icon: "⬆️", color: "bg-gray-50 border-gray-200" },
  ]

  // Get wall dimensions based on selected wall
  const getWallDimensions = (wall: string) => {
    switch (wall) {
      case "back":
      case "front":
        return { width: roomDimensions.width, height: roomDimensions.height }
      case "left":
      case "right":
        return { width: roomDimensions.length, height: roomDimensions.height }
      case "ceiling":
        return { width: roomDimensions.width, height: roomDimensions.length }
      default:
        return { width: roomDimensions.width, height: roomDimensions.height }
    }
  }

  // Get preset positions for the selected wall
  const getPresetPositions = (wall: string) => {
    const wallDims = getWallDimensions(wall)
    const positions = []

    if (wall === "ceiling") {
      // Ceiling positions
      positions.push(
        { id: "center", name: "Center", x: 0, y: 0, desc: "Room center" },
        { id: "left-center", name: "Left Center", x: -wallDims.width * 0.25, y: 0, desc: "Left of center" },
        { id: "right-center", name: "Right Center", x: wallDims.width * 0.25, y: 0, desc: "Right of center" },
        { id: "back-center", name: "Back Center", x: 0, y: -wallDims.height * 0.25, desc: "Back of center" },
        { id: "front-center", name: "Front Center", x: 0, y: wallDims.height * 0.25, desc: "Front of center" },
      )
    } else {
      // Wall positions
      positions.push(
        { id: "left-low", name: "Left Low", x: -wallDims.width * 0.3, y: 0.3, desc: "Left side, standard height" },
        { id: "left-high", name: "Left High", x: -wallDims.width * 0.3, y: 1.2, desc: "Left side, counter height" },
        { id: "center-low", name: "Center Low", x: 0, y: 0.3, desc: "Center, standard height" },
        { id: "center-high", name: "Center High", x: 0, y: 1.2, desc: "Center, counter height" },
        { id: "right-low", name: "Right Low", x: wallDims.width * 0.3, y: 0.3, desc: "Right side, standard height" },
        { id: "right-high", name: "Right High", x: wallDims.width * 0.3, y: 1.2, desc: "Right side, counter height" },
      )
    }

    return positions
  }

  // Convert wall coordinates to 3D room coordinates
  const convertToRoomCoordinates = (wallX: number, wallY: number, wall: string): SocketPosition => {
    const wallDims = getWallDimensions(wall)
    let position: SocketPosition

    switch (wall) {
      case "back":
        position = {
          x: wallX,
          y: wallY,
          z: -roomDimensions.length / 2,
          wall: "back",
          description: `${wallX > 0 ? "Right" : wallX < 0 ? "Left" : "Center"} side`,
          distanceFromLeft: wallX + roomDimensions.width / 2,
          distanceFromRight: roomDimensions.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: roomDimensions.height - wallY,
        }
        break
      case "front":
        position = {
          x: wallX,
          y: wallY,
          z: roomDimensions.length / 2,
          wall: "front",
          description: `${wallX > 0 ? "Right" : wallX < 0 ? "Left" : "Center"} side`,
          distanceFromLeft: wallX + roomDimensions.width / 2,
          distanceFromRight: roomDimensions.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: roomDimensions.height - wallY,
        }
        break
      case "left":
        position = {
          x: -roomDimensions.width / 2,
          y: wallY,
          z: wallX,
          wall: "left",
          description: `${wallX > 0 ? "Front" : wallX < 0 ? "Back" : "Center"} side`,
          distanceFromLeft: wallX + roomDimensions.length / 2,
          distanceFromRight: roomDimensions.length / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: roomDimensions.height - wallY,
        }
        break
      case "right":
        position = {
          x: roomDimensions.width / 2,
          y: wallY,
          z: wallX,
          wall: "right",
          description: `${wallX > 0 ? "Front" : wallX < 0 ? "Back" : "Center"} side`,
          distanceFromLeft: wallX + roomDimensions.length / 2,
          distanceFromRight: roomDimensions.length / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: roomDimensions.height - wallY,
        }
        break
      case "ceiling":
        position = {
          x: wallX,
          y: roomDimensions.height - 0.1,
          z: wallY,
          wall: "ceiling",
          description: "Ceiling mount",
          distanceFromLeft: wallX + roomDimensions.width / 2,
          distanceFromRight: roomDimensions.width / 2 - wallX,
          distanceFromBottom: wallY + roomDimensions.length / 2, // This is actually distance from back wall
          distanceFromTop: roomDimensions.length / 2 - wallY, // This is actually distance from front wall
        }
        break
      default:
        position = {
          x: wallX,
          y: wallY,
          z: 0,
          wall: wall,
          description: "Custom position",
        }
    }

    return position
  }

  // Handle preset position selection
  const handlePresetSelect = (preset: any) => {
    const position = convertToRoomCoordinates(preset.x, preset.y, selectedWall)
    onPositionSelect(position)
  }

  // Handle custom wall click
  const handleWallClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (positioningMode !== "custom") return

      const rect = event.currentTarget.getBoundingClientRect()
      const wallDims = getWallDimensions(selectedWall)

      // Convert click position to wall coordinates
      const clickX = ((event.clientX - rect.left) / rect.width - 0.5) * wallDims.width
      const clickY =
        selectedWall === "ceiling"
          ? ((event.clientY - rect.top) / rect.height - 0.5) * wallDims.height
          : (1 - (event.clientY - rect.top) / rect.height) * wallDims.height

      setCustomPosition({ x: clickX, y: clickY })
      const position = convertToRoomCoordinates(clickX, clickY, selectedWall)
      onPositionSelect(position)
    },
    [selectedWall, positioningMode, roomDimensions],
  )

  // Handle manual coordinate input
  const handleManualInput = (axis: "x" | "y", value: number) => {
    const newPos = { ...customPosition, [axis]: value }
    setCustomPosition(newPos)
    const position = convertToRoomCoordinates(newPos.x, newPos.y, selectedWall)
    onPositionSelect(position)
  }

  const wallDims = getWallDimensions(selectedWall)
  const presetPositions = getPresetPositions(selectedWall)
  const currentWall = walls.find((w) => w.id === selectedWall)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Zap className="h-12 w-12 mx-auto mb-4 text-gray-900" />
        <h3 className="text-xl font-semibold mb-2">Position Your Power Socket</h3>
        <p className="text-gray-600">Choose the wall and exact position for your electrical socket.</p>
      </div>

      {/* Wall Selection */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Select Wall</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {walls.map((wall) => (
            <Button
              key={wall.id}
              variant={selectedWall === wall.id ? "default" : "outline"}
              onClick={() => setSelectedWall(wall.id)}
              className={`h-auto p-3 text-center ${selectedWall === wall.id ? "bg-gray-900 text-white" : ""}`}
            >
              <div>
                {wall.recommended && <Badge className="mb-1 bg-gray-100 text-gray-800 text-xs">Best</Badge>}
                <div className="text-lg mb-1">{wall.icon}</div>
                <div className="font-medium text-sm">{wall.name}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Positioning Mode */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Positioning Method</h4>
        <Tabs value={positioningMode} onValueChange={(value) => setPositioningMode(value as "preset" | "custom")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Standard Positions
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Position
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {presetPositions.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all ${
                    selectedPosition &&
                    Math.abs(selectedPosition.x - convertToRoomCoordinates(preset.x, preset.y, selectedWall).x) < 0.1 &&
                    Math.abs(selectedPosition.y - convertToRoomCoordinates(preset.x, preset.y, selectedWall).y) < 0.1
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <CardContent className="p-3 text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                    <h5 className="font-medium text-sm mb-1">{preset.name}</h5>
                    <p className="text-xs text-gray-600">{preset.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="socket-x" className="text-sm font-medium">
                  {selectedWall === "ceiling" ? "X Position (m)" : "Horizontal Position (m)"}
                </Label>
                <Input
                  id="socket-x"
                  type="number"
                  step="0.1"
                  value={customPosition.x.toFixed(1)}
                  onChange={(e) => handleManualInput("x", Number.parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="socket-y" className="text-sm font-medium">
                  {selectedWall === "ceiling" ? "Y Position (m)" : "Height (m)"}
                </Label>
                <Input
                  id="socket-y"
                  type="number"
                  step="0.1"
                  value={customPosition.y.toFixed(1)}
                  onChange={(e) => handleManualInput("y", Number.parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Wall Layout View */}
      <Card className={`${currentWall?.color || "bg-gray-50 border-gray-200"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{currentWall?.icon}</span>
            {currentWall?.name} Layout
            <Badge variant="outline" className="ml-auto">
              {wallDims.width.toFixed(1)}m × {wallDims.height.toFixed(1)}m
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Wall visualization */}
            <div
              className="relative bg-white border-2 border-dashed border-gray-400 rounded-lg cursor-crosshair mx-auto"
              style={{
                width: "100%",
                height: "300px",
                maxWidth: `${Math.min(400, wallDims.width * 50)}px`,
              }}
              onClick={handleWallClick}
            >
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 grid-rows-6 h-full">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border border-gray-300" />
                  ))}
                </div>
              </div>

              {/* Wall outline */}
              <div className="absolute inset-2 border-2 border-gray-600 rounded bg-gray-50 bg-opacity-50" />

              {/* Socket position indicator */}
              {selectedPosition && selectedPosition.wall === selectedWall && (
                <div
                  className="absolute w-4 h-4 bg-yellow-500 border-2 border-yellow-700 rounded-full transform -translate-x-2 -translate-y-2 shadow-lg z-10"
                  style={{
                    left: `${((customPosition.x + wallDims.width / 2) / wallDims.width) * 100}%`,
                    top:
                      selectedWall === "ceiling"
                        ? `${((customPosition.y + wallDims.height / 2) / wallDims.height) * 100}%`
                        : `${(1 - customPosition.y / wallDims.height) * 100}%`,
                  }}
                >
                  <Zap className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                </div>
              )}

              {/* Measurement lines and labels */}
              {selectedPosition && selectedPosition.wall === selectedWall && (
                <>
                  {/* Horizontal measurement */}
                  <div
                    className="absolute border-t-2 border-blue-500 opacity-75"
                    style={{
                      left: "10px",
                      right: `${100 - ((customPosition.x + wallDims.width / 2) / wallDims.width) * 100}%`,
                      bottom: "10px",
                    }}
                  />
                  <div
                    className="absolute text-xs bg-blue-500 text-white px-1 rounded transform -translate-x-1/2"
                    style={{
                      left: `${((customPosition.x + wallDims.width / 2) / wallDims.width) * 50}%`,
                      bottom: "5px",
                    }}
                  >
                    {selectedPosition.distanceFromLeft?.toFixed(2)}m
                  </div>

                  {/* Vertical measurement */}
                  {selectedWall !== "ceiling" && (
                    <>
                      <div
                        className="absolute border-l-2 border-green-500 opacity-75"
                        style={{
                          left: "10px",
                          bottom: "10px",
                          top: `${(1 - customPosition.y / wallDims.height) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute text-xs bg-green-500 text-white px-1 rounded transform -translate-y-1/2 -rotate-90"
                        style={{
                          left: "5px",
                          top: `${(1 - customPosition.y / wallDims.height) * 50 + 50}%`,
                        }}
                      >
                        {selectedPosition.distanceFromBottom?.toFixed(2)}m
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Instructions overlay */}
              {positioningMode === "custom" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 text-center">Click to place socket</p>
                  </div>
                </div>
              )}
            </div>

            {/* Measurements display */}
            {selectedPosition && selectedPosition.wall === selectedWall && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-gray-800 font-medium">From Left</div>
                  <div className="text-gray-900">{selectedPosition.distanceFromLeft?.toFixed(2)}m</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-gray-800 font-medium">From Right</div>
                  <div className="text-gray-900">{selectedPosition.distanceFromRight?.toFixed(2)}m</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-gray-800 font-medium">
                    {selectedWall === "ceiling" ? "From Back" : "From Bottom"}
                  </div>
                  <div className="text-gray-900">{selectedPosition.distanceFromBottom?.toFixed(2)}m</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-gray-800 font-medium">
                    {selectedWall === "ceiling" ? "From Front" : "From Top"}
                  </div>
                  <div className="text-gray-900">{selectedPosition.distanceFromTop?.toFixed(2)}m</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Layout Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Room Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative bg-gray-100 border-2 border-gray-300 rounded-lg mx-auto"
            style={{ aspectRatio: `${roomDimensions.width}/${roomDimensions.length}`, height: "200px" }}
          >
            {/* Room outline */}
            <div className="absolute inset-4 border-2 border-gray-600 rounded bg-gray-50">
              {/* Wall labels */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-xs text-gray-600">
                Back Wall ({roomDimensions.width}m)
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-gray-600">
                Front Wall ({roomDimensions.width}m)
              </div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-16 text-xs text-gray-600 -rotate-90">
                Left Wall ({roomDimensions.length}m)
              </div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-16 text-xs text-gray-600 rotate-90">
                Right Wall ({roomDimensions.length}m)
              </div>

              {/* Socket indicator in room view */}
              {selectedPosition && (
                <div
                  className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 ${
                    selectedPosition.wall === selectedWall
                      ? "bg-yellow-500 border-yellow-700"
                      : "bg-gray-400 border-gray-600"
                  }`}
                  style={{
                    left: `${((selectedPosition.x + roomDimensions.width / 2) / roomDimensions.width) * 100}%`,
                    top: `${((selectedPosition.z + roomDimensions.length / 2) / roomDimensions.length) * 100}%`,
                  }}
                >
                  <Zap className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                </div>
              )}

              {/* Wall highlighting */}
              {selectedWall !== "ceiling" && (
                <div
                  className={`absolute border-4 ${
                    selectedWall === "back"
                      ? "border-blue-500 top-0 left-0 right-0 h-1"
                      : selectedWall === "front"
                        ? "border-orange-500 bottom-0 left-0 right-0 h-1"
                        : selectedWall === "left"
                          ? "border-green-500 left-0 top-0 bottom-0 w-1"
                          : selectedWall === "right"
                            ? "border-purple-500 right-0 top-0 bottom-0 w-1"
                            : ""
                  } opacity-75`}
                />
              )}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            Room: {roomDimensions.width}m × {roomDimensions.length}m × {roomDimensions.height}m
            {selectedPosition && (
              <span className="ml-4">
                Socket: {selectedPosition.wall} wall at ({selectedPosition.x.toFixed(1)},{" "}
                {selectedPosition.y.toFixed(1)}, {selectedPosition.z.toFixed(1)})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <strong>💡 Tips:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Standard socket height is 30cm from floor for general use, 120cm for counters</li>
          <li>Center positions provide the most flexibility for cable routing</li>
          <li>Ceiling sockets are ideal for direct-mount track systems</li>
          <li>Consider furniture placement when positioning wall sockets</li>
        </ul>
      </div>
    </div>
  )
}
