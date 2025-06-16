"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useConfigurator } from "./configurator-context"

interface SceneBackground2DProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  scale: number
  pan: { x: number; y: number }
}

export function SceneBackground2D({ canvasRef, scale, pan }: SceneBackground2DProps) {
  const { state } = useConfigurator()
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (state.sceneImage && !imageRef.current) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        imageRef.current = img
      }
      img.src = state.sceneImage
    }
  }, [state.sceneImage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current || !state.sceneImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const settings = state.sceneImageSettings || {
      position: [0, 2, -5],
      rotation: [0, 0, 0],
      scale: [10, 6],
      opacity: 0.8,
      perspective: 1,
      depth: -5,
    }

    // Calculate image position and size in 2D canvas
    const imageWidth = settings.scale[0] * scale
    const imageHeight = settings.scale[1] * scale
    const imageX = canvas.width / 2 + pan.x - imageWidth / 2
    const imageY = canvas.height / 2 + pan.y - imageHeight / 2

    // Save context for opacity
    ctx.save()
    ctx.globalAlpha = settings.opacity

    // Draw the background image
    ctx.drawImage(imageRef.current, imageX, imageY, imageWidth, imageHeight)

    // Draw perspective grid overlay
    ctx.globalAlpha = 0.2
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1

    const gridSize = scale * 0.5
    for (let x = imageX; x < imageX + imageWidth; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, imageY)
      ctx.lineTo(x, imageY + imageHeight)
      ctx.stroke()
    }

    for (let y = imageY; y < imageY + imageHeight; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(imageX, y)
      ctx.lineTo(imageX + imageWidth, y)
      ctx.stroke()
    }

    ctx.restore()
  }, [state.sceneImage, state.sceneImageSettings, scale, pan, canvasRef])

  return null // This component only draws on the canvas
}
