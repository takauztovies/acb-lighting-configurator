"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Edit, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db, type BundleData, type ComponentData } from "@/lib/database"

interface BundleManagerProps {
  bundles: BundleData[]
  components: ComponentData[]
  onBundleSaved: () => void
  onBundleDeleted: () => void
}

export function BundleManager({ bundles, components, onBundleSaved, onBundleDeleted }: BundleManagerProps) {
  const [showBundleDialog, setShowBundleDialog] = useState(false)
  const [editingBundle, setEditingBundle] = useState<BundleData | null>(null)

  const handleCreateBundle = () => {
    setEditingBundle(null)
    setShowBundleDialog(true)
  }

  const handleEditBundle = (bundle: BundleData) => {
    setEditingBundle(bundle)
    setShowBundleDialog(true)
  }

  const handleDeleteBundle = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return

    try {
      await db.deleteBundle(bundleId)
      onBundleDeleted()
    } catch (error) {
      console.error("Error deleting bundle:", error)
      alert("Error deleting bundle")
    }
  }

  const handleSaveBundle = async (bundleData: Partial<BundleData>) => {
    try {
      const bundle: BundleData = {
        id: editingBundle?.id || `bundle-${Date.now()}`,
        name: bundleData.name || "",
        description: bundleData.description || "",
        components: bundleData.components || [],
        price: bundleData.price || 0,
        createdAt: editingBundle?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      await db.saveBundle(bundle)
      setShowBundleDialog(false)
      setEditingBundle(null)
      onBundleSaved()
    } catch (error) {
      console.error("Error saving bundle:", error)
      alert("Error saving bundle")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bundle Management
            <Button onClick={handleCreateBundle}>
              <Plus className="w-4 h-4 mr-2" />
              Create Bundle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bundles.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No bundles found. Create bundles to group related components.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bundles.map((bundle) => (
                <Card key={bundle.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{bundle.name}</h3>
                        <p className="text-sm text-gray-600">{bundle.description}</p>
                        <p className="text-sm text-gray-600">{bundle.components.length} components</p>
                        <p className="text-sm font-medium">€{bundle.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditBundle(bundle)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteBundle(bundle.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bundle Creation/Edit Dialog */}
      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? "Edit Bundle" : "Create New Bundle"}</DialogTitle>
          </DialogHeader>
          <BundleForm
            bundle={editingBundle}
            components={components}
            onSave={handleSaveBundle}
            onCancel={() => setShowBundleDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Bundle Form Component
function BundleForm({
  bundle,
  components,
  onSave,
  onCancel,
}: {
  bundle: BundleData | null
  components: ComponentData[]
  onSave: (data: Partial<BundleData>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: bundle?.name || "",
    description: bundle?.description || "",
    components: bundle?.components || [],
    price: bundle?.price || 0,
  })

  const [selectedComponents, setSelectedComponents] = useState<string[]>(bundle?.components || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const totalPrice = selectedComponents.reduce((sum, compId) => {
      const component = components.find((c) => c.id === compId)
      return sum + (component?.price || 0)
    }, 0)

    onSave({
      ...formData,
      components: selectedComponents,
      price: totalPrice,
    })
  }

  const toggleComponent = (componentId: string) => {
    setSelectedComponents((prev) =>
      prev.includes(componentId) ? prev.filter((id) => id !== componentId) : [...prev, componentId],
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bundle-name">Bundle Name</Label>
          <Input
            id="bundle-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Total Price</Label>
          <div className="text-lg font-medium">
            €
            {selectedComponents
              .reduce((sum, compId) => {
                const component = components.find((c) => c.id === compId)
                return sum + (component?.price || 0)
              }, 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="bundle-description">Description</Label>
        <Textarea
          id="bundle-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label>Select Components ({selectedComponents.length} selected)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto border rounded p-2">
          {components.map((component) => (
            <div
              key={component.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedComponents.includes(component.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => toggleComponent(component.id)}
            >
              <div className="text-sm font-medium">{component.name}</div>
              <div className="text-xs text-gray-500">€{component.price}</div>
              <div className="text-xs text-gray-400 capitalize">{component.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name || selectedComponents.length === 0}>
          {bundle ? "Update Bundle" : "Create Bundle"}
        </Button>
      </div>
    </form>
  )
}
