"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2, Save, X, Settings } from "lucide-react"
// NOTE: NOT importing db or ComponentData to test if that's the issue
import { type SnapPoint, getDefaultSnapPoint } from "@/lib/snap-system"

// Define ComponentData locally to avoid import issues
interface ComponentData {
  id: string
  name: string
  type: string
  snapPoints?: SnapPoint[]
  updatedAt: Date
  [key: string]: any
}

interface SnapPointManagerProps {
  components: ComponentData[]
  onSnapPointsUpdated: (component: ComponentData) => void
}

export function SnapPointManagerSafe({ components, onSnapPointsUpdated }: SnapPointManagerProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null)
  const [editingSnapPoint, setEditingSnapPoint] = useState<SnapPoint | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<SnapPoint>>({})
  const [saveStatus, setSaveStatus] = useState("")

  const resetForm = () => {
    setFormData({})
    setEditingSnapPoint(null)
    setIsCreating(false)
    setSaveStatus("")
  }

  const handleCreateSnapPoint = () => {
    setIsCreating(true)
    setFormData(getDefaultSnapPoint())
  }

  const handleEditSnapPoint = (snapPoint: SnapPoint) => {
    setEditingSnapPoint(snapPoint)
    setFormData({ ...snapPoint })
  }

  const handleSaveSnapPoint = async () => {
    if (!selectedComponent || !formData.name) {
      setSaveStatus("Please fill in all required fields")
      return
    }

    try {
      const snapPoint: SnapPoint = {
        id: editingSnapPoint?.id || `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name || "",
        description: formData.description,
        position: formData.position || [0, 0, 0],
        rotation: formData.rotation || [0, 0, 0],
        type: formData.type || "mechanical",
        subtype: formData.subtype,
        maxConnections: formData.maxConnections || 1,
        compatibleComponents: formData.compatibleComponents || [],
        compatibleSnapTypes: formData.compatibleSnapTypes || [],
        visualIndicator: formData.visualIndicator || {
          shape: "sphere",
          color: "#3b82f6",
          size: 0.1,
          opacity: 0.8,
        },
        isRequired: formData.isRequired || false,
        priority: formData.priority || 1,
        createdAt: editingSnapPoint?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      // Update component with new/updated snap point
      const updatedSnapPoints = editingSnapPoint
        ? (selectedComponent.snapPoints || []).map((sp) => (sp.id === editingSnapPoint.id ? snapPoint : sp))
        : [...(selectedComponent.snapPoints || []), snapPoint]

      const updatedComponent: ComponentData = {
        ...selectedComponent,
        snapPoints: updatedSnapPoints,
        updatedAt: new Date(),
      }

      // Instead of using db directly, use dynamic import
      try {
        const { db } = await import("@/lib/database")
        await db.saveComponent(updatedComponent)
        setSaveStatus("Snap point saved successfully!")
      } catch (dbError) {
        console.error("Database save error:", dbError)
        setSaveStatus("Saved locally (database unavailable)")
      }

      // Update local state
      setSelectedComponent(updatedComponent)
      onSnapPointsUpdated(updatedComponent)
      resetForm()

      setTimeout(() => setSaveStatus(""), 3000)
      console.log("Snap point saved:", snapPoint)
    } catch (error) {
      console.error("Error saving snap point:", error)
      setSaveStatus(`Error saving snap point: ${error}`)
    }
  }

  const handleDeleteSnapPoint = async (snapPointId: string) => {
    if (!selectedComponent || !confirm("Are you sure you want to delete this snap point?")) return

    try {
      const updatedSnapPoints = (selectedComponent.snapPoints || []).filter((sp) => sp.id !== snapPointId)

      const updatedComponent: ComponentData = {
        ...selectedComponent,
        snapPoints: updatedSnapPoints,
        updatedAt: new Date(),
      }

      // Use dynamic import for database
      try {
        const { db } = await import("@/lib/database")
        await db.saveComponent(updatedComponent)
        setSaveStatus("Snap point deleted successfully!")
      } catch (dbError) {
        console.error("Database delete error:", dbError)
        setSaveStatus("Deleted locally (database unavailable)")
      }

      setSelectedComponent(updatedComponent)
      onSnapPointsUpdated(updatedComponent)
      setTimeout(() => setSaveStatus(""), 3000)

      console.log("Snap point deleted:", snapPointId)
    } catch (error) {
      console.error("Error deleting snap point:", error)
      setSaveStatus(`Error deleting snap point: ${error}`)
    }
  }

  const getSnapPointTypeBadgeColor = (type: SnapPoint["type"]) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Snap Point Management (Safe Mode)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveStatus && (
            <div
              className={`mb-4 text-sm p-2 rounded ${
                saveStatus.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {saveStatus}
            </div>
          )}

          {/* Component Selection */}
          <div>
            <Label htmlFor="component-select">Select Component</Label>
            <Select
              value={selectedComponent?.id || ""}
              onValueChange={(value) => {
                const component = components.find((c) => c.id === value)
                setSelectedComponent(component || null)
                resetForm()
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

              {/* Snap Points List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Snap Points</h4>
                  <Button onClick={handleCreateSnapPoint} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Snap Point
                  </Button>
                </div>

                {selectedComponent.snapPoints && selectedComponent.snapPoints.length > 0 ? (
                  <div className="space-y-2">
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
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleEditSnapPoint(snapPoint)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteSnapPoint(snapPoint.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No snap points defined for this component</p>
                )}
              </div>

              {/* Snap Point Form */}
              {(isCreating || editingSnapPoint) && (
                <>
                  <Separator />
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {isCreating ? "Create New Snap Point" : "Edit Snap Point"}
                        <Button onClick={resetForm} size="sm" variant="outline">
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="snap-name">Name *</Label>
                          <Input
                            id="snap-name"
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Power Input, Track Connection"
                          />
                        </div>
                        <div>
                          <Label htmlFor="snap-type">Type *</Label>
                          <Select
                            value={formData.type || "mechanical"}
                            onValueChange={(value) => setFormData({ ...formData, type: value as SnapPoint["type"] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="power">Power</SelectItem>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="data">Data</SelectItem>
                              <SelectItem value="track">Track</SelectItem>
                              <SelectItem value="mounting">Mounting</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="snap-description">Description</Label>
                        <Textarea
                          id="snap-description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Optional description of this snap point"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>Position X</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.position?.[0] || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                position: [
                                  Number.parseFloat(e.target.value) || 0,
                                  formData.position?.[1] || 0,
                                  formData.position?.[2] || 0,
                                ],
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Position Y</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.position?.[1] || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                position: [
                                  formData.position?.[0] || 0,
                                  Number.parseFloat(e.target.value) || 0,
                                  formData.position?.[2] || 0,
                                ],
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Position Z</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.position?.[2] || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                position: [
                                  formData.position?.[0] || 0,
                                  formData.position?.[1] || 0,
                                  Number.parseFloat(e.target.value) || 0,
                                ],
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button onClick={resetForm} variant="outline">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSnapPoint}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Snap Point
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
