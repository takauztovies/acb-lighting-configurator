"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, File, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileProcessor } from "@/lib/file-processor"
import { db } from "@/lib/database"

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<{ name: string; success: boolean }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    console.log(
      "FileUpload: Files selected:",
      fileArray.map((f) => `${f.name} (${f.type || "no MIME type"})`),
    )

    setSelectedFiles(fileArray)
    setUploadStatus("")
    setProcessedFiles([])

    // Validate files
    const validFiles = fileArray.filter((file) => FileProcessor.validateFile(file))
    const invalidFiles = fileArray.filter((file) => !FileProcessor.validateFile(file))

    if (invalidFiles.length > 0) {
      setUploadStatus(`Selected ${validFiles.length} valid files, ${invalidFiles.length} invalid files`)
    } else {
      setUploadStatus(`Selected ${validFiles.length} valid files`)
    }

    if (onFilesSelected) {
      onFilesSelected(validFiles)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelection(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)

    if (onFilesSelected) {
      const validFiles = newFiles.filter((file) => FileProcessor.validateFile(file))
      onFilesSelected(validFiles)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus("Please select files to upload")
      return
    }

    setUploadStatus("Processing files...")
    setProcessedFiles([])

    try {
      let processedCount = 0
      const results = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        console.log(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name}`)

        try {
          if (FileProcessor.validateFile(file)) {
            // For 3D models
            if (
              file.name.endsWith(".obj") ||
              file.name.endsWith(".igs") ||
              file.name.endsWith(".iges") ||
              file.name.endsWith(".step") ||
              file.name.endsWith(".stp")
            ) {
              // Save directly to database
              await saveFileToDatabase(file, "model3d")
              results.push({ name: file.name, success: true })
              processedCount++
            }
            // For archives
            else if (file.name.endsWith(".zip") || file.name.endsWith(".rar")) {
              const processedFiles = await FileProcessor.processRarFile(file)

              // Save each extracted file
              for (const extractedFile of processedFiles) {
                const extractedFileType = extractedFile.name.match(/\.(obj|igs|iges|step|stp)$/i) ? "model3d" : "image"
                await saveFileToDatabase(extractedFile, extractedFileType)
                results.push({ name: extractedFile.name, success: true })
              }

              processedCount++
            }
            // For images
            else if (file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
              await saveFileToDatabase(file, "image")
              results.push({ name: file.name, success: true })
              processedCount++
            }
          } else {
            results.push({ name: file.name, success: false })
            console.warn(`Skipping unsupported file: ${file.name}`)
          }
        } catch (error) {
          results.push({ name: file.name, success: false })
          console.error(`Error processing file ${file.name}:`, error)
        }

        setUploadStatus(`Processed ${i + 1}/${selectedFiles.length} files (${processedCount} successful)`)
        setProcessedFiles(results)
      }

      setUploadStatus(`Completed: ${processedCount}/${selectedFiles.length} files processed successfully`)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus(`Error processing files: ${error}`)
    }
  }

  const saveFileToDatabase = async (file: File, fileType: "image" | "model3d") => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Convert file to base64 for storage
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.readAsDataURL(file)
    })

    // Determine file type more accurately
    let actualFileType: "image" | "model3d" = fileType
    if (file.type.startsWith("image/")) {
      actualFileType = "image"
    } else if (file.name.match(/\.(obj|igs|iges|step|stp)$/i)) {
      actualFileType = "model3d"
    }

    const fileData = {
      id: fileId,
      componentId: "library", // Generic library file not tied to a specific component yet
      type: actualFileType,
      data: base64Data,
      filename: file.name,
      mimeType: file.type,
    }

    await db.saveFile(fileData)

    console.log(`File saved to database: ${file.name} (${fileId}) as type: ${actualFileType}`)
    return fileId
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3D Model & Image Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".obj,.igs,.iges,.step,.stp,.rar,.zip,application/zip,application/x-rar-compressed,application/octet-stream,text/plain,image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />

        {/* Drag and drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: .obj, .igs, .iges, .step, .stp, .rar, .zip, images
          </p>
          <Button onClick={openFileDialog} variant="outline">
            Browse Files
          </Button>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Selected Files:</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded border ${
                    FileProcessor.validateFile(file) ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {FileProcessor.validateFile(file) ? " ✓" : " ✗ Unsupported format"}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeFile(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processed files results */}
        {processedFiles.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Processing Results:</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {processedFiles.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded border ${
                    result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <p className="text-sm">{result.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button and status */}
        <div className="space-y-2">
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Process Upload ({selectedFiles.filter((f) => FileProcessor.validateFile(f)).length} files)
          </Button>

          {uploadStatus && (
            <p
              className={`text-sm ${
                uploadStatus.includes("Error")
                  ? "text-red-600"
                  : uploadStatus.includes("invalid")
                    ? "text-yellow-600"
                    : "text-blue-600"
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* File format info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Tip:</strong> You can drag and drop files directly onto this area.
          </p>
          <p>
            <strong>Note:</strong> Uploaded files will be available in the file browser when creating components.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
