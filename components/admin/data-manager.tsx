"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Download,
  Trash2,
  Eye,
  Package,
  FileText,
  ImageIcon,
  Box,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db, type ComponentData, type FileData } from "@/lib/database"
import JSZip from "jszip"

interface DataManagerProps {
  components: ComponentData[]
}

interface FileWithComponent extends FileData {
  componentName?: string
  componentType?: string
  createdAt: Date
}

export function DataManager({ components }: DataManagerProps) {
  const [files, setFiles] = useState<FileWithComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<FileWithComponent | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Database tools state
  const [status, setStatus] = useState<string>("")
  const [issues, setIssues] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [components])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      await db.init()

      // Since we're using in-memory database, create mock file data for demo
      const mockFiles: FileWithComponent[] = [
        {
          id: "file-1",
          filename: "track-system.glb",
          type: "model3d",
          data: "data:application/octet-stream;base64,mock-data",
          mimeType: "model/gltf-binary",
          componentId: "comp-1",
          componentName: "Track System",
          componentType: "track",
          createdAt: new Date(),
        },
        {
          id: "file-2",
          filename: "spotlight.jpg",
          type: "image",
          data: "data:image/jpeg;base64,mock-image-data",
          mimeType: "image/jpeg",
          componentId: "comp-2",
          componentName: "LED Spotlight",
          componentType: "spotlight",
          createdAt: new Date(),
        },
      ]

      setFiles(mockFiles)
      console.log("DataManager: Loaded mock files:", mockFiles.length)
    } catch (error) {
      console.error("Error loading files:", error)
      setFiles([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const getAllFiles = async (): Promise<FileData[]> => {
    // Return empty array since we don't have IndexedDB
    return []
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      // Remove from local state (in real app, would delete from IndexedDB)
      setFiles(files.filter((f) => f.id !== fileId))
      console.log("Deleted file:", fileId)
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Error deleting file")
    }
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

  // Database tools functions
  const verifyDatabase = async () => {
    setIsVerifying(true)
    setStatus("Verifying database...")

    try {
      const result = await db.verifyDatabase()
      setStatus(result.status)
      setIssues(result.issues)
    } catch (error) {
      setStatus("error")
      setIssues([`Error verifying database: ${error}`])
    } finally {
      setIsVerifying(false)
    }
  }

  const exportDatabase = async () => {
    setIsExporting(true)
    setStatus("Exporting database...")

    try {
      const jsonData = await db.exportDatabase()

      // Create a blob and download it
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `acb-lighting-db-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus("Database exported successfully")
    } catch (error) {
      setStatus(`Error exporting database: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const importDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setStatus("Importing database...")

    try {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const jsonData = event.target?.result as string
          await db.importDatabase(jsonData)
          setStatus("Database imported successfully")
          loadFiles() // Reload files after import
        } catch (error) {
          setStatus(`Error importing database: ${error}`)
        } finally {
          setIsImporting(false)
        }
      }

      reader.onerror = () => {
        setStatus("Error reading import file")
        setIsImporting(false)
      }

      reader.readAsText(file)
    } catch (error) {
      setStatus(`Error importing database: ${error}`)
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">File Manager</TabsTrigger>
          <TabsTrigger value="database">Database Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={verifyDatabase} disabled={isVerifying} className="flex items-center gap-2">
                  {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Verify Database
                </Button>

                <Button onClick={exportDatabase} disabled={isExporting} className="flex items-center gap-2">
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Database
                </Button>

                <div>
                  <input
                    type="file"
                    id="import-file"
                    accept=".json"
                    onChange={importDatabase}
                    style={{ display: "none" }}
                    aria-label="Import database JSON file"
                  />
                  <Button
                    onClick={() => document.getElementById("import-file")?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 w-full"
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import Database
                  </Button>
                </div>
              </div>

              {status && (
                <Alert
                  variant={status.includes("error") ? "destructive" : "default"}
                >
                  <div className="flex items-center gap-2">
                    {status.includes("error") ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <AlertTitle>Database Status</AlertTitle>
                  </div>
                  <AlertDescription>
                    {status}
                    {issues.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm">
                        {issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-gray-500">
                <p>
                  <strong>Note:</strong> IndexedDB data is stored in your browser and should persist between page
                  refreshes. However, clearing browser data or using private browsing may cause data loss.
                </p>
                <p className="mt-1">
                  <strong>Tip:</strong> Use the Export feature to backup your database regularly.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
