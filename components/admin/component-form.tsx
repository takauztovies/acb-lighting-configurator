"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link, X, ImageIcon, Box, FileIcon } from "lucide-react"
import { db, type ComponentData, type FileData } from "@/lib/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModelPreview } from "./model-preview"

interface ComponentFormProps {
  onComponentSaved?: (component: ComponentData) => void
  editingComponent?: ComponentData | null
}

// Extend FileData to include url for backend compatibility
interface BackendFileData extends FileData {
  url?: string;
}

// Make sure this is exported as a named export
export function ComponentForm({ onComponentSaved, editingComponent }: ComponentFormProps) {
  const [formData, setFormData] = useState({
    name: editingComponent?.name || "",
    type: editingComponent?.type || "track",
    price: editingComponent?.price || 0,
    componentUrl: editingComponent?.componentUrl || "",
    specifications: editingComponent?.specifications || {},
  })

  // FIXED: Swapped image and cardImage usage
  // Main image handling (for detailed view)
  const [imageMethod, setImageMethod] = useState<"url" | "upload" | "browse">("url")
  const [imageUrl, setImageUrl] = useState(editingComponent?.cardImage || "") // FIXED: Use cardImage for main image
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editingComponent?.cardImage || null) // FIXED

  // Thumbnail image handling (for component selection)
  const [cardImageMethod, setCardImageMethod] = useState<"url" | "upload" | "browse">("url")
  const [cardImageUrl, setCardImageUrl] = useState(editingComponent?.image || "") // FIXED: Use image for thumbnail
  const [cardImageFile, setCardImageFile] = useState<File | null>(null)
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(editingComponent?.image || null) // FIXED

  // 3D model handling
  const [modelMethod, setModelMethod] = useState<"url" | "upload" | "browse">("url")
  const [modelUrl, setModelUrl] = useState(editingComponent?.model3d || "")
  const [modelFile, setModelFile] = useState<File | null>(null)

  // File browser state
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [fileBrowserType, setFileBrowserType] = useState<"image" | "cardImage" | "model3d">("image")
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")

  // Load uploaded files
  useEffect(() => {
    loadUploadedFiles()
  }, [])

  const loadUploadedFiles = async () => {
    try {
      setIsLoadingFiles(true)
      // Fetch files from backend API
      const res = await fetch('/api/files')
      if (!res.ok) throw new Error('Failed to fetch files')
      let files = await res.json()
      // Add type property for compatibility with file browser
      files = files.map((file: any) => ({
        ...file,
        type: file.mimetype && file.mimetype.startsWith('model/') ? 'model3d'
          : file.mimetype && file.mimetype.startsWith('image/') ? 'image'
          : file.filename.match(/\.(obj|igs|iges|step|stp)$/i) ? 'model3d'
          : file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'image'
          : undefined,
      }))
      setUploadedFiles(files)
      setUploadStatus("")
      console.log("ComponentForm: File loading completed from backend API")
    } catch (error) {
      console.error("Error loading files:", error)
      setUploadedFiles([]) // Fallback to empty array
      setUploadStatus("File browser not available (API error)")
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const getAllFiles = async (): Promise<FileData[]> => {
    // Return empty array since we're using in-memory database
    // In a real implementation, this would query IndexedDB
    return []
  }

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "cardImage") => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveStatus("Please select a valid image file")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === "image") {
        setImageFile(file)
        setImagePreview(result)
      } else {
        setCardImageFile(file)
        setCardImagePreview(result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle 3D model file selection
  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validExtensions = [".obj", ".igs", ".iges", ".step", ".stp"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validExtensions.includes(fileExtension)) {
      setSaveStatus("Please select a valid 3D model file (.obj, .igs, .iges, .step, .stp)")
      return
    }

    setModelFile(file)
    setSaveStatus(`Selected 3D model: ${file.name}`)
  }

  // Open file browser
  const openFileBrowser = (type: "image" | "cardImage" | "model3d") => {
    setFileBrowserType(type)
    setShowFileBrowser(true)
    loadUploadedFiles() // Refresh files when opening browser
  }

  // Select file from browser
  const selectFile = (file: BackendFileData) => {
    if (fileBrowserType === "image") {
      setImageUrl(file.url || file.data)
      setImagePreview(file.url || file.data)
      setImageMethod("url")
    } else if (fileBrowserType === "cardImage") {
      setCardImageUrl(file.url || file.data)
      setCardImagePreview(file.url || file.data)
      setCardImageMethod("url")
    } else if (fileBrowserType === "model3d") {
      setModelUrl(file.url ? file.url : `db://${file.id}`)
      setModelMethod("url")
      setSaveStatus(`Selected 3D model: ${file.filename}`)
    }
    setShowFileBrowser(false)
  }

  const uploadFileToBackend = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await res.json();
      if (!data.url) {
        throw new Error('Invalid response from server');
      }
      
      return data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const saveFileToDatabase = async (
    file: File,
    componentId: string,
    fileType: "image" | "model3d",
  ): Promise<string> => {
    try {
      const uploadedFile = await uploadFileToBackend(file);
      return uploadedFile.url;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save file');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus("Saving component...")

    try {
      let componentId = editingComponent?.id
      let isEdit = !!editingComponent

      // Prepare image URLs
      let finalImageUrl = ""
      let finalCardImageUrl = ""
      let finalModelUrl = ""

      // FIXED: Swapped the assignments
      // Handle main image (detailed view) - goes to cardImage field
      if (imageMethod === "upload" && imageFile) {
        finalCardImageUrl = await saveFileToDatabase(imageFile, componentId || '', "image")
        setSaveStatus("Saving main image...")
      } else if (imageMethod === "url" && imageUrl) {
        finalCardImageUrl = imageUrl
      }

      // Handle thumbnail image (selection) - goes to image field
      if (cardImageMethod === "upload" && cardImageFile) {
        finalImageUrl = await saveFileToDatabase(cardImageFile, componentId || '', "image")
        setSaveStatus("Saving thumbnail image...")
      } else if (cardImageMethod === "url" && cardImageUrl) {
        finalImageUrl = cardImageUrl
      }

      // Handle 3D model
      if (modelMethod === "upload" && modelFile) {
        finalModelUrl = await saveFileToDatabase(modelFile, componentId || '', "model3d")
        setSaveStatus("Saving 3D model...")
      } else if (modelMethod === "url" && modelUrl) {
        finalModelUrl = modelUrl
      }

      // Prepare component data
      let component: any = {
        name: formData.name,
        type: formData.type as "track" | "spotlight" | "connector" | "power-supply",
        price: Number(formData.price),
        image: finalImageUrl, // Thumbnail for selection
        cardImage: finalCardImageUrl, // Main detailed image
        model3d: finalModelUrl,
        componentUrl: formData.componentUrl,
        specifications: formData.specifications,
        createdAt: editingComponent?.createdAt || new Date(),
        updatedAt: new Date(),
      }
      if (isEdit && componentId) {
        component.id = componentId
      }

      // Save component (POST for create, PUT for update)
      await db.saveComponent(component)
      setSaveStatus("Component saved successfully!")

      // If creating, fetch the new id from backend (if possible)
      if (!isEdit) {
        // Optionally, you could fetch the latest component list and get the id of the newly created one
        // For now, we skip setting id on the frontend for new components
      }

      // Notify that components have been updated
      localStorage.setItem("acb-components-updated", Date.now().toString())
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "acb-components-updated",
          newValue: Date.now().toString(),
        }),
      )
      console.log("ComponentForm: Notified components updated")

      if (onComponentSaved) {
        onComponentSaved(component)
      }

      // Reset form if not editing
      if (!editingComponent) {
        setFormData({
          name: "",
          type: "track",
          price: 0,
          componentUrl: "",
          specifications: {},
        })
        setImageUrl("")
        setCardImageUrl("")
        setModelUrl("")
        setImageFile(null)
        setCardImageFile(null)
        setModelFile(null)
        setImagePreview(null)
        setCardImagePreview(null)
      }
    } catch (error) {
      console.error("Error saving component:", error)
      setSaveStatus(`Error: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  const removeFile = (type: "image" | "cardImage" | "model") => {
    if (type === "image") {
      setImageFile(null)
      setImagePreview(null)
      setImageUrl("")
    } else if (type === "cardImage") {
      setCardImageFile(null)
      setCardImagePreview(null)
      setCardImageUrl("")
    } else {
      setModelFile(null)
      setModelUrl("")
    }
  }

  const getFileSize = (file: FileData): string => {
    if (!file.data) return "Unknown"
    // Estimate size from base64 data
    const sizeInBytes = (file.data.length * 3) / 4
    if (sizeInBytes < 1024) return `${sizeInBytes.toFixed(0)} B`
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingComponent ? "Edit Component" : "Add New Component"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="type">Component Type</Label>
              <Select value={formData.type as ComponentData["type"]} onValueChange={(value) => setFormData({ ...formData, type: value as ComponentData["type"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="track">Track</SelectItem>
                  <SelectItem value="spotlight">Spotlight</SelectItem>
                  <SelectItem value="connector">Connector</SelectItem>
                  <SelectItem value="power-supply">Power Supply</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="componentUrl">Product Page URL (optional)</Label>
              <Input
                id="componentUrl"
                value={formData.componentUrl}
                onChange={(e) => setFormData({ ...formData, componentUrl: e.target.value })}
                placeholder="https://acblighting.com/products/..."
              />
            </div>
          </div>

          {/* FIXED: Swapped labels and descriptions */}
          {/* Main Product Image */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Product Image (detailed view)
            </Label>
            <Tabs value={imageMethod} onValueChange={(value) => setImageMethod(value as "url" | "upload" | "browse")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4" />
                  Browse Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2">
                <Input
                  placeholder="https://example.com/product-image.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    setImagePreview(e.target.value)
                  }}
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, "image")}
                    className="flex-1"
                  />
                  {imageFile && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFile("image")}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {imageFile && <p className="text-sm text-gray-600">Selected: {imageFile.name}</p>}
              </TabsContent>

              <TabsContent value="browse" className="space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => openFileBrowser("image")}>
                  <FileIcon className="w-4 h-4 mr-2" />
                  Browse Uploaded Images
                </Button>
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Thumbnail Image */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Thumbnail Image (for component selection)
            </Label>
            <Tabs
              value={cardImageMethod}
              onValueChange={(value) => setCardImageMethod(value as "url" | "upload" | "browse")}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4" />
                  Browse Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2">
                <Input
                  placeholder="https://example.com/thumbnail.jpg"
                  value={cardImageUrl}
                  onChange={(e) => {
                    setCardImageUrl(e.target.value)
                    setCardImagePreview(e.target.value)
                  }}
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, "cardImage")}
                    className="flex-1"
                  />
                  {cardImageFile && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFile("cardImage")}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {cardImageFile && <p className="text-sm text-gray-600">Selected: {cardImageFile.name}</p>}
              </TabsContent>

              <TabsContent value="browse" className="space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => openFileBrowser("cardImage")}>
                  <FileIcon className="w-4 h-4 mr-2" />
                  Browse Uploaded Images
                </Button>
              </TabsContent>
            </Tabs>

            {cardImagePreview && (
              <div className="mt-2">
                <img
                  src={cardImagePreview || "/placeholder.svg"}
                  alt="Card Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* 3D Model */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2">
              <Box className="w-4 h-4" />
              3D Model File
            </Label>
            <Tabs value={modelMethod} onValueChange={(value) => setModelMethod(value as "url" | "upload" | "browse")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4" />
                  Browse Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2">
                <Input
                  placeholder="https://example.com/3d-model.obj"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".obj,.igs,.iges,.step,.stp"
                    onChange={handleModelFileChange}
                    className="flex-1"
                  />
                  {modelFile && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFile("model")}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {modelFile && <p className="text-sm text-gray-600">Selected: {modelFile.name}</p>}
                <p className="text-xs text-gray-500">Supported: .obj, .igs, .iges, .step, .stp</p>
              </TabsContent>

              <TabsContent value="browse" className="space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => openFileBrowser("model3d")}>
                  <FileIcon className="w-4 h-4 mr-2" />
                  Browse Uploaded 3D Models
                </Button>
              </TabsContent>
            </Tabs>

            {modelUrl && modelUrl.startsWith("db://") && (
              <div className="mt-2 p-2 bg-gray-50 border rounded">
                <p className="text-sm font-medium">Selected 3D Model:</p>
                <p className="text-xs text-gray-600">{modelUrl.replace("db://", "")}</p>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div>
            <Label htmlFor="specifications">Technical Specifications</Label>
            <Textarea
              id="specifications"
              value={JSON.stringify(formData.specifications, null, 2)}
              onChange={(e) => {
                try {
                  const specs = JSON.parse(e.target.value)
                  setFormData({ ...formData, specifications: specs })
                } catch {
                  // Invalid JSON, keep the text but don't update formData
                }
              }}
              placeholder='{"power": "12W", "voltage": "24V", "beam_angle": "30°"}'
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter technical specifications as JSON format. Example:{" "}
              {'{"power": "12W", "voltage": "24V", "beam_angle": "30°"}'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving || !formData.name}>
              {isSaving ? "Saving..." : editingComponent ? "Update Component" : "Save Component"}
            </Button>

            {saveStatus && (
              <p className={`text-sm ${saveStatus.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                {saveStatus}
              </p>
            )}
          </div>
        </form>
      </CardContent>

      {/* File Browser Dialog */}
      <Dialog open={showFileBrowser} onOpenChange={setShowFileBrowser}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{fileBrowserType === "model3d" ? "Select 3D Model" : "Select Image"}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">
                {isLoadingFiles ? "Loading files..." : `${uploadedFiles.length} files available`}
              </h3>
              <Button size="sm" variant="outline" onClick={loadUploadedFiles}>
                Refresh
              </Button>
            </div>

            {isLoadingFiles ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No files uploaded yet</p>
                <p className="text-xs text-gray-400">Use URL or Upload tabs to add images and 3D models</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="mb-4 text-xs text-gray-500">
                  Debug: Total files: {uploadedFiles.length}, Looking for type: {fileBrowserType}, Filtered files:{" "}
                  {
                    uploadedFiles.filter((file: BackendFileData) => {
                      console.log(`File: ${file.filename}, Type: ${file.type}, Browser type: ${fileBrowserType}`)
                      if (fileBrowserType === "model3d") {
                        return file.type === "model3d" || file.filename.match(/\.(obj|igs|iges|step|stp)$/i)
                      } else {
                        return file.type === "image" || file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
                      }
                    }).length
                  }
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedFiles
                    .filter((file: BackendFileData) => {
                      // More flexible filtering based on filename and type
                      if (fileBrowserType === "model3d") {
                        return file.type === "model3d" || file.filename.match(/\.(obj|igs|iges|step|stp)$/i)
                      } else {
                        return file.type === "image" || file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
                      }
                    })
                    .map((file: BackendFileData) => (
                      <div
                        key={file.id}
                        className="border rounded-md p-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        onClick={() => selectFile(file)}
                      >
                        <div className="aspect-square overflow-hidden rounded mb-2">
                          {file.type === "image" || file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                            <img
                              src={file.url || file.data || "/placeholder.svg"}
                              alt={file.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ModelPreview
                              modelData={file.url || file.data}
                              filename={file.filename}
                              className="w-full h-full rounded"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium truncate" title={file.filename}>
                            {file.filename}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Type: {file.type}</span>
                            <span>{getFileSize(file)}</span>
                          </div>
                          {file.createdAt && (
                            <div className="text-xs text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowFileBrowser(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
