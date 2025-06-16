"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Loader2 } from "lucide-react"

export interface DatabaseConfig {
  type: "indexeddb" | "rest-api" | "supabase" | "firebase"
  config: {
    baseUrl?: string
    apiKey?: string
    projectId?: string
    databaseUrl?: string
  }
}

interface DatabaseConfigProps {
  currentConfig: DatabaseConfig
  onConfigChange: (config: DatabaseConfig) => void
  onTestConnection: (config: DatabaseConfig) => Promise<boolean>
}

export function DatabaseConfig({ currentConfig, onConfigChange, onTestConnection }: DatabaseConfigProps) {
  const [config, setConfig] = useState<DatabaseConfig>(currentConfig)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  const handleTypeChange = (type: DatabaseConfig["type"]) => {
    setConfig({
      type,
      config: {},
    })
    setConnectionStatus("idle")
  }

  const handleConfigChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }))
    setConnectionStatus("idle")
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      const success = await onTestConnection(config)
      setConnectionStatus(success ? "success" : "error")
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionStatus("error")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSaveConfig = () => {
    onConfigChange(config)
  }

  const renderConfigFields = () => {
    switch (config.type) {
      case "indexeddb":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              IndexedDB stores data locally in your browser. No additional configuration required.
            </p>
          </div>
        )

      case "rest-api":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseUrl">API Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://api.example.com"
                value={config.config.baseUrl || ""}
                onChange={(e) => handleConfigChange("baseUrl", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Your API key"
                value={config.config.apiKey || ""}
                onChange={(e) => handleConfigChange("apiKey", e.target.value)}
              />
            </div>
          </div>
        )

      case "supabase":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input
                id="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                value={config.config.baseUrl || ""}
                onChange={(e) => handleConfigChange("baseUrl", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
              <Input
                id="supabaseKey"
                type="password"
                placeholder="Your Supabase anon key"
                value={config.config.apiKey || ""}
                onChange={(e) => handleConfigChange("apiKey", e.target.value)}
              />
            </div>
          </div>
        )

      case "firebase":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectId">Firebase Project ID</Label>
              <Input
                id="projectId"
                placeholder="your-project-id"
                value={config.config.projectId || ""}
                onChange={(e) => handleConfigChange("projectId", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="databaseUrl">Database URL</Label>
              <Input
                id="databaseUrl"
                placeholder="https://your-project.firebaseio.com"
                value={config.config.databaseUrl || ""}
                onChange={(e) => handleConfigChange("databaseUrl", e.target.value)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Connection Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Configuration
          {getConnectionStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="database-type">Database Type</Label>
          <Select value={config.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indexeddb">IndexedDB (Browser Storage)</SelectItem>
              <SelectItem value="rest-api">REST API</SelectItem>
              <SelectItem value="supabase">Supabase (PostgreSQL)</SelectItem>
              <SelectItem value="firebase">Firebase (NoSQL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderConfigFields()}

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleTestConnection} variant="outline" disabled={isTestingConnection}>
            {isTestingConnection ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>

          <Button onClick={handleSaveConfig} disabled={connectionStatus !== "success" && config.type !== "indexeddb"}>
            Save Configuration
          </Button>
        </div>

        {config.type === "indexeddb" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">IndexedDB Information</h4>
            <p className="text-sm text-blue-700">
              IndexedDB is perfect for development and small deployments. Data is stored locally in the browser. For
              production use with multiple users, consider using Supabase or a REST API.
            </p>
          </div>
        )}

        {config.type === "supabase" && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Supabase Setup</h4>
            <p className="text-sm text-green-700">
              Supabase provides a PostgreSQL database with real-time features. Create a project at supabase.com and get
              your URL and anon key from the project settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
