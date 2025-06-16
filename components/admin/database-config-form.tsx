"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, Loader2 } from "lucide-react"

export interface DatabaseConfig {
  type: "indexeddb" | "supabase" | "firebase" | "rest-api"
  url?: string
  apiKey?: string
  projectId?: string
  authToken?: string
  headers?: Record<string, string>
}

export function DatabaseConfigForm() {
  const [config, setConfig] = useState<DatabaseConfig>({
    type: "indexeddb",
  })
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleConfigChange = (field: keyof DatabaseConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsConnected(null) // Reset connection status when config changes
  }

  const testConnection = async () => {
    setIsTesting(true)
    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (config.type === "indexeddb") {
        setIsConnected(true)
      } else if (config.url && config.apiKey) {
        // In a real implementation, you would test the actual connection
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsTesting(false)
    }
  }

  const saveConfig = async () => {
    try {
      // Save configuration to localStorage for now
      localStorage.setItem("database-config", JSON.stringify(config))
      alert("Database configuration saved successfully!")
    } catch (error) {
      alert("Error saving configuration")
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Current Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected === true ? "default" : isConnected === false ? "destructive" : "secondary"}>
              {isConnected === true && <CheckCircle className="w-3 h-3 mr-1" />}
              {isConnected === false && <XCircle className="w-3 h-3 mr-1" />}
              {isConnected === null && <Database className="w-3 h-3 mr-1" />}
              {isConnected === true ? "Connected" : isConnected === false ? "Disconnected" : "Unknown"}
            </Badge>
            <span className="text-sm text-gray-600">
              Using: {config.type === "indexeddb" ? "IndexedDB (Browser Storage)" : config.type.toUpperCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Database Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Database Type</CardTitle>
          <CardDescription>Choose your database backend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="db-type">Database Type</Label>
            <Select value={config.type} onValueChange={(value) => handleConfigChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indexeddb">IndexedDB (Browser Storage)</SelectItem>
                <SelectItem value="supabase">Supabase (PostgreSQL)</SelectItem>
                <SelectItem value="firebase">Firebase (NoSQL)</SelectItem>
                <SelectItem value="rest-api">REST API (Custom Backend)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration fields based on database type */}
          {config.type === "supabase" && (
            <>
              <div>
                <Label htmlFor="supabase-url">Supabase URL</Label>
                <Input
                  id="supabase-url"
                  placeholder="https://your-project.supabase.co"
                  value={config.url || ""}
                  onChange={(e) => handleConfigChange("url", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder="Your Supabase anon key"
                  value={config.apiKey || ""}
                  onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                />
              </div>
            </>
          )}

          {config.type === "firebase" && (
            <>
              <div>
                <Label htmlFor="firebase-project">Firebase Project ID</Label>
                <Input
                  id="firebase-project"
                  placeholder="your-project-id"
                  value={config.projectId || ""}
                  onChange={(e) => handleConfigChange("projectId", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="firebase-key">Firebase API Key</Label>
                <Input
                  id="firebase-key"
                  type="password"
                  placeholder="Your Firebase API key"
                  value={config.apiKey || ""}
                  onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                />
              </div>
            </>
          )}

          {config.type === "rest-api" && (
            <>
              <div>
                <Label htmlFor="api-url">API Base URL</Label>
                <Input
                  id="api-url"
                  placeholder="https://api.yoursite.com"
                  value={config.url || ""}
                  onChange={(e) => handleConfigChange("url", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="api-token">Authentication Token</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Your API authentication token"
                  value={config.authToken || ""}
                  onChange={(e) => handleConfigChange("authToken", e.target.value)}
                />
              </div>
            </>
          )}

          {config.type === "indexeddb" && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                IndexedDB stores data locally in your browser. No additional configuration required. This is perfect for
                development and testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={testConnection} variant="outline" disabled={isTesting}>
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button onClick={saveConfig} disabled={isConnected === false}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle>Database Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">IndexedDB</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Browser-based storage</li>
                <li>• No server required</li>
                <li>• Perfect for development</li>
                <li>• Data stays local</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Supabase</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• PostgreSQL database</li>
                <li>• Real-time features</li>
                <li>• Built-in authentication</li>
                <li>• Scalable and production-ready</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Firebase</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• NoSQL database</li>
                <li>• Real-time sync</li>
                <li>• Google Cloud infrastructure</li>
                <li>• Easy mobile integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">REST API</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Custom backend</li>
                <li>• Full control</li>
                <li>• Any database type</li>
                <li>• Custom business logic</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
