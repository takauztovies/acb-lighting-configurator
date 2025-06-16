"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Eye, Edit3 } from "lucide-react"
import type { ComponentData } from "@/lib/database"
import { VisualSnapPointEditor } from "./visual-snap-point-editor"

interface SnapPointManagerProps {
  components: ComponentData[]
  onSnapPointsUpdated: (updatedComponent: ComponentData) => void
}

export function SnapPointManager({ components, onSnapPointsUpdated }: SnapPointManagerProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null)
  const [showVisualEditor, setShowVisualEditor] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")

  const getSnapPointTypeBadgeColor = (type: string) => {
    switch (type) {
      case "power":
        return "bg-red-100 text-red-800"
      case "mechanical":
        return "bg-blue-100 text-blue-800"
      case "data":
        return "bg-green-100 text-green-800"
      case "track":
        return "bg-purple-100 text-purple-800"
      case "mounting":
        return "bg-orange-100 text-orange-800"
      case "accessory":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleOpenVisualEditor = () => {
    if (selectedComponent) {
      setShowVisualEditor(true)
    }
  }

  const handleCloseVisualEditor = () => {
    setShowVisualEditor(false)
  }

  const handleSnapPointsUpdated = (updatedComponent: ComponentData) => {
    setSelectedComponent(updatedComponent)
    onSnapPointsUpdated(updatedComponent)
    setSaveStatus("Component snap points updated successfully!")
    setTimeout(() => setSaveStatus(""), 3000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Visual Snap Point Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveStatus && <div className="mb-4 text-sm p-2 rounded bg-green-100 text-green-700">{saveStatus}</div>}

          {/* Component Selection */}
          <div>
            <Label htmlFor="component-select">Select Component</Label>
            <Select
              value={selectedComponent?.id || ""}
              onValueChange={(value) => {
                const component = components.find((c) => c.id === value)
                setSelectedComponent(component || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a component to manage snap points" />
              </SelectTrigger>
              <SelectContent>
                {components.map((component) => (
                  <SelectItem key={component.id} value={component.id}>
                    {component.name} ({component.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedComponent && (
            <>
              <Separator />

              {/* Component Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium">{selectedComponent.name}</h3>
                <p className="text-sm text-gray-600">Type: {selectedComponent.type}</p>
                <p className="text-sm text-gray-600">Snap Points: {selectedComponent.snapPoints?.length || 0}</p>
              </div>

              {/* Visual Editor Button */}
              <div className="flex gap-2">
                <Button onClick={handleOpenVisualEditor} className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Open Visual Editor
                </Button>

                {selectedComponent.snapPoints && selectedComponent.snapPoints.length > 0 && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Toggle preview mode - this will show all snap points on the component
                      // We can use the existing visual editor for preview
                      setShowVisualEditor(true)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Preview ({selectedComponent.snapPoints.length} points)
                  </Button>
                )}
              </div>

              {/* Snap Points List */}
              {selectedComponent.snapPoints && selectedComponent.snapPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Current Snap Points</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedComponent.snapPoints.map((snapPoint) => (
                      <div key={snapPoint.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{snapPoint.name}</span>
                              <Badge className={getSnapPointTypeBadgeColor(snapPoint.type)}>{snapPoint.type}</Badge>
                              {snapPoint.subtype && <Badge variant="outline">{snapPoint.subtype}</Badge>}
                              {snapPoint.isRequired && <Badge variant="destructive">Required</Badge>}
                            </div>
                            {snapPoint.description && (
                              <p className="text-sm text-gray-600 mb-2">{snapPoint.description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              Position: [{snapPoint.position.map((p) => p.toFixed(2)).join(", ")}] • Max:{" "}
                              {snapPoint.maxConnections === -1 ? "∞" : snapPoint.maxConnections} • Priority:{" "}
                              {snapPoint.priority || 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Visual Editor Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click "Add Snap Point" to enter placement mode</li>
                  <li>• Click on the 3D component to place a snap point</li>
                  <li>• Select a snap point to edit its properties</li>
                  <li>• Use "Edit Position" mode to drag snap points around</li>
                  <li>• Fine-tune positions with the X/Y/Z input fields</li>
                  <li>• Different shapes represent different snap point types</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visual Editor Modal */}
      {showVisualEditor && selectedComponent && (
        <VisualSnapPointEditor
          component={selectedComponent}
          onSnapPointsUpdated={handleSnapPointsUpdated}
          onClose={handleCloseVisualEditor}
        />
      )}
    </div>
  )
}
