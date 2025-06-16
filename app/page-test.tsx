"use client"

import { useState } from "react"

export default function ConfiguratorApp() {
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">ACB Lighting Configurator</h1>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Test page with minimal imports</p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <p>Testing step by step...</p>
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Toggle: {showAdminPanel ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
