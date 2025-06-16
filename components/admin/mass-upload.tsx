"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db, type ComponentData } from "@/lib/database"
import * as XLSX from "xlsx"

interface MassUploadProps {
  onUploadComplete?: () => void
}

interface ComponentRow {
  name: string
  description?: string
  type:
    | "track"
    | "spotlight"
    | "connector"
    | "power-supply"
    | "shade"
    | "diffuser"
    | "mounting"
    | "accessory"
    | "bulb"
    | "driver"
    | "sensor"
    | "dimmer"
    | "lamp"
    | "pendant"
    | "ceiling"
    | "wall"
    | "floor"
    | "table"
    | "strip"
    | "panel"
    | "downlight"
    | "uplight"
  price: number
  specifications: string
  image?: string // Thumbnail for component selection (goes to image field)
  cardImage?: string // Product detail image (goes to cardImage field)
  model3d?: string // 3D model file
  componentUrl?: string
}

// Add notification function
function notifyComponentsUpdated() {
  localStorage.setItem("acb-components-updated", Date.now().toString())
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "acb-components-updated",
      newValue: Date.now().toString(),
    }),
  )
  console.log("MassUpload: Notified components updated")
}

export function MassUpload({ onUploadComplete }: MassUploadProps) {
  const [uploadStatus, setUploadStatus] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  })

  const excelFileRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)

  const validComponentTypes = [
    "track",
    "spotlight",
    "connector",
    "power-supply",
    "shade",
    "diffuser",
    "mounting",
    "accessory",
    "bulb",
    "driver",
    "sensor",
    "dimmer",
    "lamp",
    "pendant",
    "ceiling",
    "wall",
    "floor",
    "table",
    "strip",
    "panel",
    "downlight",
    "uplight",
  ]

  const template = [
    {
      name: "LED Track Light 1m",
      description: "High-quality LED track light with 1 meter length. Energy efficient and dimmable.",
      type: "track",
      price: 45.99,
      specifications: '{"power": "12W", "voltage": "24V", "length": "1m", "color_temperature": "3000K"}',
      image: "track-light-1m-thumb.jpg", // Thumbnail for component selection (goes to image field)
      cardImage: "https://example.com/track-light-1m-large.jpg", // Product detail image (goes to cardImage field)
      model3d: "track-light-1m.obj", // 3D model file
      componentUrl: "https://acblighting.com/products/track-light-1m",
    },
    {
      name: "Adjustable Spotlight",
      description: "Versatile spotlight with adjustable beam angle. Perfect for accent lighting.",
      type: "spotlight",
      price: 29.99,
      specifications: '{"power": "8W", "beam_angle": "30°", "dimming": "Yes", "color_temperature": "3000K"}',
      image: "https://example.com/spotlight-thumb.jpg", // URL for thumbnail
      cardImage: "spotlight-large.jpg", // File for product detail
      model3d: "spotlight.obj",
      componentUrl: "https://acblighting.com/products/spotlight",
    },
    {
      name: "Table Lamp",
      description: "Modern table lamp with adjustable height and dimming function.",
      type: "lamp",
      price: 89.99,
      specifications: '{"height": "45cm", "base_diameter": "20cm", "bulb_type": "E27", "dimming": "Yes"}',
      image: "table-lamp-thumb.jpg",
      cardImage: "https://example.com/table-lamp-large.jpg",
      model3d: "table-lamp.obj",
      componentUrl: "https://acblighting.com/products/table-lamp",
    },
    {
      name: "Pendant Light",
      description: "Elegant pendant light for dining areas and kitchens.",
      type: "pendant",
      price: 129.99,
      specifications: '{"diameter": "30cm", "height": "25cm", "cable_length": "150cm", "bulb_type": "E27"}',
      image: "https://example.com/pendant-light-thumb.jpg",
      cardImage: "pendant-light-large.jpg",
      model3d: "pendant-light.obj",
      componentUrl: "https://acblighting.com/products/pendant-light",
    },
    {
      name: "Ceiling Light",
      description: "Flush mount ceiling light for general room illumination.",
      type: "ceiling",
      price: 79.99,
      specifications: '{"diameter": "40cm", "height": "8cm", "power": "24W", "color_temperature": "3000K"}',
      image: "ceiling-light-thumb.jpg",
      cardImage: "https://example.com/ceiling-light-large.jpg",
      model3d: "ceiling-light.obj",
      componentUrl: "https://acblighting.com/products/ceiling-light",
    },
    {
      name: "LED Strip Light",
      description: "Flexible LED strip for accent and under-cabinet lighting.",
      type: "strip",
      price: 25.99,
      specifications: '{"length": "5m", "power_per_meter": "14.4W", "voltage": "24V", "waterproof": "IP65"}',
      image: "https://example.com/led-strip-thumb.jpg",
      cardImage: "led-strip-large.jpg",
      model3d: "led-strip.obj",
      componentUrl: "https://acblighting.com/products/led-strip",
    },
  ]

  const downloadTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(template)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Components")

      // Set column widths
      ws["!cols"] = [
        { wch: 20 }, // name
        { wch: 40 }, // description
        { wch: 15 }, // type
        { wch: 10 }, // price
        { wch: 50 }, // specifications
        { wch: 25 }, // image
        { wch: 25 }, // cardImage
        { wch: 20 }, // model3d
        { wch: 40 }, // componentUrl
      ]

      // Generate Excel file as array buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Create blob and download
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "acb-lighting-components-template.xlsx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setUploadStatus("Template downloaded successfully!")
    } catch (error) {
      console.error("Error generating template:", error)
      setUploadStatus("Error generating template. Please try again.")
    }
  }

  const handleMassUpload = async () => {
    const excelFile = excelFileRef.current?.files?.[0]
    const assetFiles = filesRef.current?.files

    if (!excelFile) {
      setUploadStatus("Please select an Excel file")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setUploadStatus("Processing Excel file...")
    setResults({ success: 0, failed: 0, errors: [] })

    try {
      // Read Excel file
      const data = await excelFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ComponentRow[]

      console.log("Parsed Excel data:", jsonData)

      // Create file map for quick lookup
      const fileMap = new Map<string, File>()
      if (assetFiles) {
        Array.from(assetFiles).forEach((file) => {
          fileMap.set(file.name.toLowerCase(), file)
        })
      }

      // NEW: Process URL images - download and convert to files
      const urlImageMap = new Map<string, string>()
      for (const row of jsonData) {
        // Check for URL images in both image and cardImage fields
        const imageFields = [row.image, row.cardImage].filter(Boolean)

        for (const imageUrl of imageFields) {
          if (
            imageUrl &&
            (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) &&
            !urlImageMap.has(imageUrl)
          ) {
            try {
              setUploadStatus(`Downloading image: ${imageUrl}`)
              const response = await fetch(imageUrl)
              if (response.ok) {
                const blob = await response.blob()
                const base64Data = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })
                urlImageMap.set(imageUrl, base64Data)
                console.log(`Successfully downloaded image: ${imageUrl}`)
              } else {
                console.warn(`Failed to download image: ${imageUrl}`)
              }
            } catch (error) {
              console.warn(`Error downloading image ${imageUrl}:`, error)
            }
          }
        }
      }

      const totalComponents = jsonData.length
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      // Process each component
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        setProgress(((i + 1) / totalComponents) * 100)
        setUploadStatus(`Processing component ${i + 1}/${totalComponents}: ${row.name}`)

        try {
          // Validate required fields
          if (!row.name || !row.type || row.price === undefined) {
            throw new Error("Missing required fields (name, type, price)")
          }

          // Validate type with expanded list
          if (!validComponentTypes.includes(row.type)) {
            throw new Error(`Invalid type: ${row.type}. Must be one of: ${validComponentTypes.join(", ")}`)
          }

          // Parse specifications
          let specifications = {}
          if (row.specifications) {
            try {
              specifications = JSON.parse(row.specifications)
            } catch {
              console.warn(`Invalid JSON in specifications for ${row.name}`)
            }
          }

          const componentId = `comp-${Date.now()}-${i}`

          // Handle thumbnail image (goes to image field)
          let thumbnailUrl = ""
          if (row.image) {
            if (row.image.startsWith("http://") || row.image.startsWith("https://")) {
              // Check if we downloaded this URL
              if (urlImageMap.has(row.image)) {
                thumbnailUrl = await saveBase64ToDatabase(
                  urlImageMap.get(row.image)!,
                  componentId,
                  "image",
                  `image-${componentId}.jpg`,
                )
              } else {
                thumbnailUrl = row.image // Use URL directly if download failed
              }
            } else {
              const thumbnailFile = fileMap.get(row.image.toLowerCase())
              if (thumbnailFile) {
                thumbnailUrl = await saveFileToDatabase(thumbnailFile, componentId, "image")
              }
            }
          }

          // Handle product detail image (goes to cardImage field)
          let productImageUrl = ""
          if (row.cardImage) {
            if (row.cardImage.startsWith("http://") || row.cardImage.startsWith("https://")) {
              // Check if we downloaded this URL
              if (urlImageMap.has(row.cardImage)) {
                productImageUrl = await saveBase64ToDatabase(
                  urlImageMap.get(row.cardImage)!,
                  componentId,
                  "image",
                  `cardImage-${componentId}.jpg`,
                )
              } else {
                productImageUrl = row.cardImage // Use URL directly if download failed
              }
            } else {
              const productFile = fileMap.get(row.cardImage.toLowerCase())
              if (productFile) {
                productImageUrl = await saveFileToDatabase(productFile, componentId, "image")
              }
            }
          }

          // Handle 3D model file
          let modelUrl = ""
          if (row.model3d) {
            const modelFile = fileMap.get(row.model3d.toLowerCase())
            if (modelFile) {
              modelUrl = await saveFileToDatabase(modelFile, componentId, "model3d")
            }
          }

          // Create component with correct image mapping
          const component: ComponentData = {
            id: componentId,
            name: row.name,
            description: row.description || "",
            type: row.type,
            price: Number(row.price),
            image: thumbnailUrl, // This comes from the 'image' column (thumbnail)
            cardImage: productImageUrl, // This comes from the 'cardImage' column (product detail)
            model3d: modelUrl, // This comes from the 'model3d' column
            componentUrl: row.componentUrl || "",
            specifications,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          await db.saveComponent(component)
          successCount++
          console.log(`Successfully created component: ${row.name}`)
        } catch (error) {
          failedCount++
          const errorMsg = `Row ${i + 1} (${row.name || "Unknown"}): ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      setResults({ success: successCount, failed: failedCount, errors })
      setUploadStatus(`Completed: ${successCount} successful, ${failedCount} failed`)

      if (successCount > 0) {
        notifyComponentsUpdated()
        if (onUploadComplete) {
          onUploadComplete()
        }
      }
    } catch (error) {
      console.error("Mass upload error:", error)
      setUploadStatus(`Error: ${error}`)
      setResults({ success: 0, failed: 0, errors: [`Failed to process file: ${error}`] })
    } finally {
      setIsProcessing(false)
    }
  }

  const saveFileToDatabase = async (
    file: File,
    componentId: string,
    fileType: "image" | "model3d",
  ): Promise<string> => {
    const fileId = `${componentId}-${fileType}-${Date.now()}`

    // Convert file to base64 for storage
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.readAsDataURL(file)
    })

    const fileData = {
      id: fileId,
      componentId,
      type: fileType,
      data: base64Data,
      filename: file.name,
      mimeType: file.type,
      createdAt: new Date(),
      size: file.size,
    }

    await db.saveFile(fileData)
    return `db://${fileId}`
  }

  const saveBase64ToDatabase = async (
    base64Data: string,
    componentId: string,
    fileType: "image" | "model3d",
    filename: string,
  ): Promise<string> => {
    const fileId = `${componentId}-${fileType}-${Date.now()}`

    const fileData = {
      id: fileId,
      componentId,
      type: fileType,
      data: base64Data,
      filename: filename,
      mimeType: base64Data.startsWith("data:image/png") ? "image/png" : "image/jpeg",
      createdAt: new Date(),
      size: Math.round(base64Data.length * 0.75), // Approximate base64 to binary size
    }

    await db.saveFile(fileData)
    return `db://${fileId}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Mass Component Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload multiple components at once using an Excel file. Download the template to see the required format.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Components</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">1. Download Template</label>
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Template
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">2. Upload Filled Excel File</label>
                  <input
                    ref={excelFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    aria-label="Upload filled Excel file"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">3. Upload Asset Files (Images & 3D Models)</label>
                  <input
                    ref={filesRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.obj,.igs,.iges,.step,.stp"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    aria-label="Upload asset files (images and 3D models)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload images (.jpg, .png, .gif, .webp) and 3D models (.obj, .igs, .step, .stp) referenced in your
                    Excel file
                  </p>
                </div>

                <Button onClick={handleMassUpload} disabled={isProcessing} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Upload Components"}
                </Button>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-600">{uploadStatus}</p>
                  </div>
                )}

                {uploadStatus && !isProcessing && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{uploadStatus}</AlertDescription>
                  </Alert>
                )}

                {(results.success > 0 || results.failed > 0) && (
                  <Alert variant={results.failed > 0 ? "destructive" : "default"}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          <strong>Upload Results:</strong> {results.success} successful, {results.failed} failed
                        </p>
                        {results.errors.length > 0 && (
                          <div>
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc pl-5 text-sm max-h-32 overflow-y-auto">
                              {results.errors.slice(0, 10).map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                              {results.errors.length > 10 && <li>... and {results.errors.length - 10} more</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h3>How to use Mass Upload:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Download the template:</strong> Click "Download Excel Template" to get a pre-formatted Excel
                    file with example data.
                  </li>
                  <li>
                    <strong>Fill in your data:</strong> Replace the example data with your component information:
                    <ul className="list-disc pl-5 mt-1">
                      <li>
                        <strong>name:</strong> Component name (required)
                      </li>
                      <li>
                        <strong>description:</strong> Detailed component description (optional)
                      </li>
                      <li>
                        <strong>type:</strong> Component type (required) - see supported types below
                      </li>
                      <li>
                        <strong>price:</strong> Price in euros (required)
                      </li>
                      <li>
                        <strong>specifications:</strong> JSON string with technical specs
                      </li>
                      <li>
                        <strong>image:</strong> Filename of the component thumbnail image or URL
                      </li>
                      <li>
                        <strong>cardImage:</strong> Filename of the product detail image or URL
                      </li>
                      <li>
                        <strong>model3d:</strong> Filename of the 3D model
                      </li>
                      <li>
                        <strong>componentUrl:</strong> Product page URL (optional)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Prepare asset files:</strong> Collect all images and 3D models referenced in your Excel
                    file. Make sure the filenames match exactly what you entered in the Excel file.
                  </li>
                  <li>
                    <strong>Upload:</strong> Select your filled Excel file and all asset files, then click "Upload
                    Components".
                  </li>
                </ol>

                <h4>Supported Component Types:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {validComponentTypes.map((type) => (
                    <div key={type} className="flex items-center">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{type}</span>
                    </div>
                  ))}
                </div>

                <h4>Image and 3D Model References:</h4>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>image:</strong> Small thumbnail image for component selection. Can be a URL (starts with
                    http:// or https://) or filename of uploaded file.
                  </li>
                  <li>
                    <strong>cardImage:</strong> Large detailed image for component details. Can be a URL or filename of
                    uploaded file.
                  </li>
                  <li>
                    <strong>model3d:</strong> Must be the exact filename of an uploaded 3D model file (.obj, .igs,
                    .step, .stp).
                  </li>
                  <li>
                    URLs will be used directly, while filenames must match exactly the files you upload in step 3.
                  </li>
                </ul>

                <h4>Supported file formats:</h4>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Images:</strong> .jpg, .jpeg, .png, .gif, .webp
                  </li>
                  <li>
                    <strong>3D Models:</strong> .obj, .igs, .iges, .step, .stp
                  </li>
                </ul>

                <h4>Tips:</h4>
                <ul className="list-disc pl-5">
                  <li>File names are case-insensitive</li>
                  <li>Specifications should be valid JSON format</li>
                  <li>Missing asset files will be skipped with a warning</li>
                  <li>Invalid rows will be reported in the results</li>
                  <li>Make sure your Excel file has the correct column headers</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
