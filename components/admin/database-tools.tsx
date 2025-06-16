"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/database"
import { Download, Upload, RefreshCw, AlertTriangle, CheckCircle, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DatabaseTools() {
  const [status, setStatus] = useState<string>("")
  const [issues, setIssues] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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

  return (
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
            <input type="file" id="import-file" accept=".json" onChange={importDatabase} style={{ display: "none" }} />
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
          <Alert variant={status.includes("error") ? "destructive" : status === "healthy" ? "default" : "warning"}>
            <div className="flex items-center gap-2">
              {status.includes("error") || status === "issues-found" ? (
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
            <strong>Note:</strong> IndexedDB data is stored in your browser and should persist between page refreshes.
            However, clearing browser data or using private browsing may cause data loss.
          </p>
          <p className="mt-1">
            <strong>Tip:</strong> Use the Export feature to backup your database regularly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
