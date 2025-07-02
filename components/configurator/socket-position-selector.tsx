"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, MapPin } from "lucide-react"

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

interface SocketPositionSelectorProps {
  roomDimensions: { width: number; length: number; height: number }
  onPositionSelect: (position: SocketPosition) => void
  selectedPosition: SocketPosition | null
}

export function SocketPositionSelector({
  roomDimensions,
  onPositionSelect,
  selectedPosition,
}: SocketPositionSelectorProps) {
  const [selectedWall, setSelectedWall] = useState<string>(selectedPosition?.wall || "back")
  const [customPosition, setCustomPosition] = useState({
    x: selectedPosition?.x || 0,
    y: selectedPosition?.y || 0.3,
  })

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
          distanceFromLeft: wallX + wallDims.width / 2,
          distanceFromRight: wallDims.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: wallDims.height - wallY,
        }
        break
      case "front":
        position = {
          x: wallX,
          y: wallY,
          z: roomDimensions.length / 2,
          wall: "front",
          description: `${wallX > 0 ? "Right" : wallX < 0 ? "Left" : "Center"} side`,
          distanceFromLeft: wallX + wallDims.width / 2,
          distanceFromRight: wallDims.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: wallDims.height - wallY,
        }
        break
      case "left":
        position = {
          x: -roomDimensions.width / 2,
          y: wallY,
          z: wallX,
          wall: "left",
          description: `${wallX > 0 ? "Front" : wallX < 0 ? "Back" : "Center"} side`,
          distanceFromLeft: wallX + wallDims.width / 2,
          distanceFromRight: wallDims.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: wallDims.height - wallY,
        }
        break
      case "right":
        position = {
          x: roomDimensions.width / 2,
          y: wallY,
          z: wallX,
          wall: "right",
          description: `${wallX > 0 ? "Front" : wallX < 0 ? "Back" : "Center"} side`,
          distanceFromLeft: wallX + wallDims.width / 2,
          distanceFromRight: wallDims.width / 2 - wallX,
          distanceFromBottom: wallY,
          distanceFromTop: wallDims.height - wallY,
        }
        break
      case "ceiling":
        position = {
          x: wallX,
          y: roomDimensions.height - 0.1,
          z: wallY,
          wall: "ceiling",
          description: "Ceiling mount",
          distanceFromLeft: wallX + wallDims.width / 2,
          distanceFromRight: wallDims.width / 2 - wallX,
          distanceFromBottom: wallY + wallDims.height / 2, // Distance from back wall
          distanceFromTop: wallDims.height / 2 - wallY, // Distance from front wall
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

  // Handle wall click for custom positioning
  const handleWallClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
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
    [selectedWall, roomDimensions, onPositionSelect],
  )

  // Handle manual coordinate input
  const handleManualInput = (axis: "x" | "y", value: number) => {
    const newPos = { ...customPosition, [axis]: value }
    setCustomPosition(newPos)
    const position = convertToRoomCoordinates(newPos.x, newPos.y, selectedWall)
    onPositionSelect(position)
  }

  // Handle wall selection
  const handleWallSelect = (wall: string) => {
    setSelectedWall(wall)
    // Update position for the new wall
    const position = convertToRoomCoordinates(customPosition.x, customPosition.y, wall)
    onPositionSelect(position)
  }

  const wallDims = getWallDimensions(selectedWall)
  const wallColors: Record<string, string> = {
    back: "bg-gray-50 border-gray-200",
    front: "bg-gray-50 border-gray-200",
    left: "bg-gray-50 border-gray-200",
    right: "bg-gray-50 border-gray-200",
    ceiling: "bg-gray-50 border-gray-200",
  }

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
          {[
            { id: "back", name: "Back Wall", icon: "⬅️" },
            { id: "left", name: "Left Wall", icon: "↖️" },
            { id: "right", name: "Right Wall", icon: "↗️" },
            { id: "front", name: "Front Wall", icon: "➡️" },
            { id: "ceiling", name: "Ceiling", icon: "⬆️" },
          ].map((wall) => (
            <Button
              key={wall.id}
              variant={selectedWall === wall.id ? "default" : "outline"}
              onClick={() => handleWallSelect(wall.id)}
              className={`h-auto p-3 text-center ${selectedWall === wall.id ? "bg-gray-900 text-white" : ""}`}
            >
              <div>
                <div className="text-lg mb-1">{wall.icon}</div>
                <div className="font-medium text-sm">{wall.name}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Layouts Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wall Layout */}
        <Card className={wallColors[selectedWall] || "bg-gray-50"}>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center justify-between">
              <span>Wall Layout</span>
              <span className="text-xs text-gray-500">
                {wallDims.width.toFixed(1)}m × {wallDims.height.toFixed(1)}m
              </span>
            </h4>

            {/* Wall visualization with click-to-place */}
            <div
              className="relative bg-white border-2 border-dashed border-gray-400 rounded-lg cursor-crosshair"
              style={{
                height: "200px",
                aspectRatio: selectedWall === "ceiling" ? `${wallDims.width}/${wallDims.height}` : undefined,
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
              {selectedPosition && (
                <div
                  className="absolute w-4 h-4 bg-gray-900 border-2 border-gray-700 rounded-full transform -translate-x-2 -translate-y-2 shadow-lg z-10"
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

              {/* Measurement lines */}
              {selectedPosition && (
                <>
                  {/* Horizontal measurement */}
                  <div
                    className="absolute border-t-2 border-gray-900 opacity-75"
                    style={{
                      left: "10px",
                      right: `${100 - ((customPosition.x + wallDims.width / 2) / wallDims.width) * 100}%`,
                      bottom: "10px",
                    }}
                  />
                  <div
                    className="absolute text-xs bg-gray-900 text-white px-1 rounded transform -translate-x-1/2"
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
                        className="absolute border-l-2 border-gray-900 opacity-75"
                        style={{
                          left: "10px",
                          bottom: "10px",
                          top: `${(1 - customPosition.y / wallDims.height) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute text-xs bg-gray-900 text-white px-1 rounded transform -translate-y-1/2"
                        style={{
                          left: "5px",
                          top: `${(1 - customPosition.y / wallDims.height) * 100}%`,
                        }}
                      >
                        {selectedPosition.distanceFromBottom?.toFixed(2)}m
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Instructions overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 text-center">Click anywhere to place socket</p>
                </div>
              </div>
            </div>

            {/* Manual position controls */}
            <div className="grid grid-cols-2 gap-4 mt-4">
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
          </CardContent>
        </Card>

        {/* Room Layout */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center justify-between">
              <span>Room Overview</span>
              <span className="text-xs text-gray-500">
                {roomDimensions.width.toFixed(1)}m × {roomDimensions.length.toFixed(1)}m
              </span>
            </h4>

            <div
              className="relative bg-gray-100 border-2 border-gray-300 rounded-lg mx-auto"
              style={{ aspectRatio: `${roomDimensions.width}/${roomDimensions.length}`, height: "200px" }}
            >
              {/* Room outline */}
              <div className="absolute inset-4 border-2 border-gray-600 rounded bg-gray-50">
                {/* Wall labels */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-xs text-gray-600">
                  Back Wall
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-gray-600">
                  Front Wall
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 text-xs text-gray-600 -rotate-90">
                  Left Wall
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 text-xs text-gray-600 rotate-90">
                  Right Wall
                </div>

                {/* Socket indicator in room view */}
                {selectedPosition && (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-gray-900 border-2 border-gray-700 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${((selectedPosition.x + roomDimensions.width / 2) / roomDimensions.width) * 100}%`,
                      top: `${((selectedPosition.z + roomDimensions.length / 2) / roomDimensions.length) * 100}%`,
                    }}
                  >
                    <Zap className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
                  </div>
                )}

                {/* Wall highlighting */}
                <div
                  className={`absolute border-4 ${
                    selectedWall === "back"
                      ? "border-gray-900 top-0 left-0 right-0 h-1"
                      : selectedWall === "front"
                        ? "border-gray-900 bottom-0 left-0 right-0 h-1"
                        : selectedWall === "left"
                          ? "border-gray-900 left-0 top-0 bottom-0 w-1"
                          : selectedWall === "right"
                            ? "border-gray-900 right-0 top-0 bottom-0 w-1"
                            : selectedWall === "ceiling"
                              ? "border-gray-900 inset-0 opacity-20"
                              : ""
                  } opacity-75`}
                />
              </div>
            </div>

            {/* Position details */}
            {selectedPosition && (
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800">Wall</div>
                  <div>{selectedPosition.wall}</div>
                </div>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800">Position</div>
                  <div>{selectedPosition.description}</div>
                </div>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800">From Left</div>
                  <div>{selectedPosition.distanceFromLeft?.toFixed(2)}m</div>
                </div>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800">
                    {selectedPosition.wall === "ceiling" ? "From Back" : "From Bottom"}
                  </div>
                  <div>{selectedPosition.distanceFromBottom?.toFixed(2)}m</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common socket positions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Common Socket Positions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: "Standard Height", x: 0, y: 0.3, desc: "30cm from floor" },
            { name: "Counter Height", x: 0, y: 1.2, desc: "120cm from floor" },
            { name: "Left Side", x: -wallDims.width * 0.3, y: 0.3, desc: "Left side, standard height" },
            { name: "Right Side", x: wallDims.width * 0.3, y: 0.3, desc: "Right side, standard height" },
          ].map((preset, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => {
                setCustomPosition({ x: preset.x, y: preset.y })
                onPositionSelect(convertToRoomCoordinates(preset.x, preset.y, selectedWall))
              }}
              className="h-auto p-3 text-center justify-start flex-col items-start"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{preset.name}</span>
              </div>
              <span className="text-xs text-gray-500 mt-1">{preset.desc}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-lg">
        <strong>💡 Tips:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Click anywhere on the wall layout to place the socket precisely</li>
          <li>Standard socket height is 30cm from floor for general use</li>
          <li>Counter height (120cm) is ideal for areas above countertops</li>
          <li>Use the manual controls for precise positioning</li>
        </ul>
      </div>
    </div>
  )
}
