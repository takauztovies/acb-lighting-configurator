"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Heart, Share2, Download, Lightbulb, Info, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { db, type InspirationData } from "@/lib/database"

interface InspirationCanvasProps {
  inspirationId?: string
  onClose?: () => void
  onApplyToConfiguration?: (inspiration: InspirationData) => void
}

interface CanvasState {
  zoom: number
  pan: { x: number; y: number }
  rotation: number
  brightness: number
  contrast: number
  showGrid: boolean
  showHotspots: boolean
}

interface LightingHotspot {
  id: string
  x: number // percentage
  y: number // percentage
  type: "track" | "spotlight" | "pendant" | "ambient"
  description: string
  suggestedComponent?: string
}

export function InspirationCanvas({ inspirationId, onClose, onApplyToConfiguration }: InspirationCanvasProps) {
  const [inspiration, setInspiration] = useState<InspirationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>("")
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 100,
    pan: { x: 0, y: 0 },
    rotation: 0,
    brightness: 100,
    contrast: 100,
    showGrid: false,
    showHotspots: true,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isLiked, setIsLiked] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Sample lighting hotspots (in a real app, these would come from the inspiration data)
  const [lightingHotspots] = useState<LightingHotspot[]>([
    {
      id: "1",
      x: 25,
      y: 30,
      type: "track",
      description: "Track lighting system for accent lighting",
      suggestedComponent: "track-system-modern",
    },
    {
      id: "2",
      x: 60,
      y: 45,
      type: "pendant",
      description: "Pendant lights over dining area",
      suggestedComponent: "pendant-industrial",
    },
    {
      id: "3",
      x: 80,
      y: 25,
      type: "spotlight",
      description: "Recessed spotlights for task lighting",
      suggestedComponent: "spotlight-led",
    },
  ])

  useEffect(() => {
    loadInspiration()
  }, [inspirationId])

  useEffect(() => {
    const resolveImage = async () => {
      if (inspiration?.image) {
        try {
          if (inspiration.image.startsWith("db://")) {
            const fileId = inspiration.image.replace("db://", "")
            const file = await db.getFile(fileId)
            const url = file.url || file.data
            setResolvedImageUrl(url)
          }
        } catch (error) {
          console.error("Error resolving inspiration image:", error)
          setResolvedImageUrl("/placeholder.svg?height=600&width=800&text=Error+Loading+Image")
        }
      }
    }

    if (inspiration) {
      resolveImage()
    }
  }, [inspiration])

  const loadInspiration = async () => {
    if (!inspirationId) return

    try {
      setIsLoading(true)
      const inspirations = await db.getInspirations()
      const found = inspirations.find((insp) => insp.id === inspirationId)
      setInspiration(found || null)
    } catch (error) {
      console.error("Error loading inspiration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCanvasState((prev) => ({
        ...prev,
        pan: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        },
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -10 : 10
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.max(25, Math.min(400, prev.zoom + delta)),
    }))
  }

  const resetView = () => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: 100,
      pan: { x: 0, y: 0 },
      rotation: 0,
    }))
  }

  const handleDownload = async () => {
    if (resolvedImageUrl && inspiration) {
      try {
        const response = await fetch(resolvedImageUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${inspiration.title.replace(/\s+/g, "-").toLowerCase()}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Error downloading image:", error)
      }
    }
  }

  const handleShare = async () => {
    if (navigator.share && inspiration) {
      try {
        await navigator.share({
          title: inspiration.title,
          text: inspiration.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const getHotspotIcon = (type: string) => {
    switch (type) {
      case "track":
        return "🔆"
      case "spotlight":
        return "💡"
      case "pendant":
        return "🏮"
      case "ambient":
        return "✨"
      default:
        return "💡"
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading inspiration...</p>
        </div>
      </div>
    )
  }

  if (!inspiration) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p className="mb-4">Inspiration not found</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-white text-xl font-semibold">{inspiration.title}</h2>
          <Badge variant="secondary">{inspiration.category}</Badge>
          {inspiration.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-white border-white">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px)`,
              }}
            >
              <div
                className="relative"
                style={{
                  transform: `scale(${canvasState.zoom / 100}) rotate(${canvasState.rotation}deg)`,
                  filter: `brightness(${canvasState.brightness}%) contrast(${canvasState.contrast}%)`,
                }}
              >
                <img
                  ref={imageRef}
                  src={resolvedImageUrl || "/placeholder.svg"}
                  alt={inspiration.title}
                  className="max-w-none max-h-none"
                  style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=600&width=800&text=Error+Loading+Image"
                  }}
                />

                {/* Grid Overlay */}
                {canvasState.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
                      `,
                      backgroundSize: "50px 50px",
                    }}
                  />
                )}

                {/* Lighting Hotspots */}
                {canvasState.showHotspots &&
                  lightingHotspots.map((hotspot) => (
                    <div
                      key={hotspot.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                      }}
                    >
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg animate-pulse shadow-lg">
                        {getHotspotIcon(hotspot.type)}
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {hotspot.description}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Controls */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">View Controls</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Zoom</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCanvasState((prev) => ({ ...prev, zoom: Math.max(25, prev.zoom - 25) }))}
                    >
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <span className="text-sm w-12 text-center">{canvasState.zoom}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCanvasState((prev) => ({ ...prev, zoom: Math.min(400, prev.zoom + 25) }))}
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-2">Brightness: {canvasState.brightness}%</label>
                  <Slider
                    value={[canvasState.brightness]}
                    onValueChange={(value) => setCanvasState((prev) => ({ ...prev, brightness: value[0] }))}
                    min={50}
                    max={150}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-sm block mb-2">Contrast: {canvasState.contrast}%</label>
                  <Slider
                    value={[canvasState.contrast]}
                    onValueChange={(value) => setCanvasState((prev) => ({ ...prev, contrast: value[0] }))}
                    min={50}
                    max={150}
                    step={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Grid</span>
                  <Button
                    variant={canvasState.showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCanvasState((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
                  >
                    <Grid3X3 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Lighting</span>
                  <Button
                    variant={canvasState.showHotspots ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCanvasState((prev) => ({ ...prev, showHotspots: !prev.showHotspots }))}
                  >
                    <Lightbulb className="w-3 h-3" />
                  </Button>
                </div>

                <Button variant="outline" onClick={resetView} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lighting Analysis */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Lighting Analysis</h3>
              <div className="space-y-3">
                {lightingHotspots.map((hotspot) => (
                  <div key={hotspot.id} className="flex items-start space-x-3 p-2 rounded border">
                    <div className="text-lg">{getHotspotIcon(hotspot.type)}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">{hotspot.type} Lighting</div>
                      <div className="text-xs text-gray-600">{hotspot.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          {showDetails && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> {inspiration.category}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-600">{inspiration.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inspiration.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply to Configuration */}
          {onApplyToConfiguration && (
            <div className="mt-4">
              <Button onClick={() => onApplyToConfiguration(inspiration)} className="w-full" size="lg">
                <Lightbulb className="w-4 h-4 mr-2" />
                Apply This Lighting Setup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
