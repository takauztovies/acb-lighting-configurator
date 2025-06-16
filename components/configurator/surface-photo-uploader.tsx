"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useConfigurator } from "./configurator-context"
import { Upload, X } from "lucide-react"

export function SurfacePhotoUploader() {
  const { state, dispatch } = useConfigurator()
  const [activeUpload, setActiveUpload] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, surface: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string
        dispatch({
          type: "SET_SCENE_IMAGE",
          surface,
          imageData,
        })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleRemoveImage = (surface: string) => {
    dispatch({
      type: "REMOVE_SCENE_IMAGE",
      surface,
    })
  }

  const surfaces = [
    { id: "floor", label: "Floor" },
    { id: "ceiling", label: "Ceiling" },
    { id: "backWall", label: "Back Wall" },
    { id: "leftWall", label: "Left Wall" },
    { id: "rightWall", label: "Right Wall" },
  ]

  return (
    <div className="flex justify-between space-x-4 w-full">
      {surfaces.map((surface) => {
        const hasImage = Boolean(state.sceneImageSettings?.[surface.id])

        return (
          <div key={surface.id} className="relative flex-1">
            <input
              type="file"
              id={`upload-${surface.id}`}
              className="sr-only"
              accept="image/*"
              onChange={(e) => handleFileChange(e, surface.id)}
            />
            <label
              htmlFor={`upload-${surface.id}`}
              className={`flex flex-col items-center justify-center p-3 rounded-md cursor-pointer border w-full h-20 ${
                hasImage ? "border-gray-500 bg-gray-50" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {hasImage ? (
                <>
                  <div className="w-full h-full relative">
                    <img
                      src={state.sceneImageSettings[surface.id] || "/placeholder.svg"}
                      alt={surface.label}
                      className="w-full h-full object-cover rounded"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 bg-white border-gray-300 hover:bg-gray-50"
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemoveImage(surface.id)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1 text-gray-500" />
                  <span className="text-xs text-center text-gray-500">{surface.label}</span>
                </>
              )}
            </label>
          </div>
        )
      })}
    </div>
  )
}
