"use client"

import { useState, useEffect } from "react"
import { Download, Trash2, Eye, Package, FileText, ImageIcon, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db, type ComponentData, type FileData } from "@/lib/database"
import JSZip from "jszip"

interface FileManagerProps {
  components: ComponentData[]
}

interface FileWithComponent extends FileData {
  componentName?: string
  componentType?: string
}

export function FileManager({ components }: FileManagerProps) {
  const [files, setFiles] = useState<FileWithComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<FileWithComponent | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [components])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      await db.init()

      // Get all files from IndexedDB
      const allFiles = await getAllFiles()

      // Enhance files with component information
      const filesWithComponents = allFiles.map((file) => {
        const component = components.find((c) => c.id === file.componentId)
        return {
          ...file,
          componentName: component?.name || "Unknown Component",
          componentType: component?.type || "unknown",
        }
      })

      setFiles(filesWithComponents)
      console.log("FileManager: Loaded files:", filesWithComponents.length)
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAllFiles = async (): Promise<FileData[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.db!.transaction(["files"], "readonly")
      const store = transaction.objectStore("files")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  const downloadFile = (file: FileWithComponent) => {
    try {
      // Convert base64 to blob if needed
      let downloadUrl = file.data
      if (file.data.startsWith("data:")) {
        downloadUrl = file.data
      } else {
        // If it's raw base64, add the data URL prefix
        downloadUrl = `data:${file.mimeType || "application/octet-stream"};base64,${file.data}`
      }

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("Downloaded file:", file.filename)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Error downloading file")
    }
  }

  const downloadAllFiles = async () => {
    try {
      const zip = new JSZip()

      // Group files by component
      const filesByComponent = files.reduce(
        (acc, file) => {
          const componentName = file.componentName || "Unknown"
          if (!acc[componentName]) acc[componentName] = []
          acc[componentName].push(file)
          return acc
        },
        {} as Record<string, FileWithComponent[]>,
      )

      // Add files to ZIP organized by component
      for (const [componentName, componentFiles] of Object.entries(filesByComponent)) {
        const folderName = componentName.replace(/[^a-zA-Z0-9]/g, "_")

        for (const file of componentFiles) {
          try {
            // Convert base64 to binary
            let binaryData: string
            if (file.data.startsWith("data:")) {
              binaryData = file.data.split(",")[1]
            } else {
              binaryData = file.data
            }

            zip.file(`${folderName}/${file.filename}`, binaryData, { base64: true })
          } catch (error) {
            console.error(`Error adding file ${file.filename} to ZIP:`, error)
          }
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `acb-lighting-files-${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
      console.log("Downloaded all files as ZIP")
    } catch (error) {
      console.error("Error creating ZIP file:", error)
      alert("Error creating ZIP file")
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const transaction = db.db!.transaction(["files"], "readwrite")
      const store = transaction.objectStore("files")
      await store.delete(fileId)

      setFiles(files.filter((f) => f.id !== fileId))
      console.log("Deleted file:", fileId)
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Error deleting file")
    }
  }

  const previewFileContent = (file: FileWithComponent) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  const getFileIcon = (file: FileWithComponent) => {
    if (file.type === "image") return <ImageIcon className="w-4 h-4" />
    if (file.type === "model3d") return <Box className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getFileSize = (data: string): string => {
    try {
      // Estimate size from base64 data
      const base64Data = data.startsWith("data:") ? data.split(",")[1] : data
      const sizeInBytes = (base64Data.length * 3) / 4

      if (sizeInBytes < 1024) return `${sizeInBytes.toFixed(0)} B`
      if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    } catch {
      return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>File Manager ({files.length} files)</span>
            <div className="flex gap-2">
              <Button onClick={downloadAllFiles} disabled={files.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Download All as ZIP
              </Button>
              <Button variant="outline" onClick={loadFiles}>
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No files found. Upload some files to see them here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <div>
                          <div className="font-medium">{file.filename}</div>
                          <div className="text-xs text-gray-500">{file.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={file.type === "model3d" ? "default" : "secondary"}>
                        {file.type === "model3d" ? "3D Model" : "Image"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{file.componentName}</div>
                        <Badge variant="outline" className="text-xs">
                          {file.componentType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getFileSize(file.data)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => previewFileContent(file)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => downloadFile(file)}>
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>File Preview: {previewFile?.filename}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Filename:</strong> {previewFile.filename}
                </div>
                <div>
                  <strong>Type:</strong> {previewFile.type}
                </div>
                <div>
                  <strong>Component:</strong> {previewFile.componentName}
                </div>
                <div>
                  <strong>Size:</strong> {getFileSize(previewFile.data)}
                </div>
                <div>
                  <strong>MIME Type:</strong> {previewFile.mimeType || "Unknown"}
                </div>
                <div>
                  <strong>ID:</strong> {previewFile.id}
                </div>
              </div>

              {previewFile.type === "image" && (
                <div>
                  <h4 className="font-medium mb-2">Image Preview:</h4>
                  <img
                    src={previewFile.data || "/placeholder.svg"}
                    alt={previewFile.filename}
                    className="max-w-full max-h-96 object-contain border rounded"
                  />
                </div>
              )}

              {previewFile.type === "model3d" && (
                <div>
                  <h4 className="font-medium mb-2">3D Model Info:</h4>
                  <div className="bg-gray-100 p-4 rounded text-sm font-mono">
                    <p>File: {previewFile.filename}</p>
                    <p>Format: {previewFile.filename.split(".").pop()?.toUpperCase()}</p>
                    <p>Used in 3D preview for component: {previewFile.componentName}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => downloadFile(previewFile)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
