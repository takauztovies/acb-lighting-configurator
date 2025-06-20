"use client"

import { useState } from "react"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SingleFileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  label: string
}

export function SingleFileUpload({ onUpload, accept, label }: SingleFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setUploadedUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
        headers: {
          // Assuming you have a way to get the admin token
          Authorization: `Bearer ${localStorage.getItem("admin-token") || ""}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await res.json()
      setUploadedUrl(url)
      onUpload(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Input type="file" onChange={handleFileChange} accept={accept} className="flex-grow" />
      <Button onClick={handleUpload} disabled={!file || uploading || !!uploadedUrl}>
        {uploading ? "Uploading..." : <Upload className="w-4 h-4" />}
      </Button>
      {uploadedUrl && <CheckCircle className="w-5 h-5 text-green-500" />}
      {error && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
} 