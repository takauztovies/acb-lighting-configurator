"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Lightbulb, Home, Zap, Link, Settings } from "lucide-react"
import { StandaloneRoomDimensions } from "./standalone-room-dimensions"
import { SocketPositionSelector } from "./socket-position-selector"

interface SimpleGuidedSetupProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (setupData: any) => void
}

interface HangingOption {
  id: string
  name: string
  desc: string
  recommended?: boolean
  heightRange: string
  defaultHeight: number
  power: string
}

interface SetupData {
  roomDimensions: {
    width: number
    length: number
    height: number
  }
  powerSource: string | null
  socketPosition: {
    wall: string
    distanceFromLeft: number
    distanceFromBottom: number
  } | null
  hangingType: string | null
  hangingHeight: number
  trackLayout: {
    type: string
    orientation: string
  } | null
}

export function SimpleGuidedSetup({ isOpen, onClose, onComplete }: SimpleGuidedSetupProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState<SetupData>({
    roomDimensions: { width: 8, length: 6, height: 3 },
    powerSource: null,
    socketPosition: null,
    hangingType: null,
    hangingHeight: 2.6, // Default hanging height
    trackLayout: null,
  })

  const steps = [
    {
      id: "room",
      title: "Room Setup",
      description: "Set room dimensions",
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: "socket",
      title: "Socket Position",
      description: "Place power socket",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: "hanging",
      title: "Hanging Type",
      description: "Choose system type",
      icon: <Link className="h-5 w-5" />,
    },
    {
      id: "layout",
      title: "Track Layout",
      description: "Configure layout",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  // Use useCallback to prevent infinite loops
  const handleDimensionsChange = useCallback((dimensions: { width: number; length: number; height: number }) => {
    setSetupData((prev) => ({ ...prev, roomDimensions: dimensions }))
  }, [])

  const handlePositionSelect = useCallback((position: any) => {
    setSetupData((prev) => ({ ...prev, socketPosition: position }))
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(setupData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return setupData.roomDimensions.width > 0 && setupData.roomDimensions.length > 0
      case 1:
        return setupData.socketPosition !== null
      case 2:
        return setupData.hangingType !== null
      case 3:
        return setupData.trackLayout !== null
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Home className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Set Up Your Room</h3>
              <p className="text-gray-600">Configure your room dimensions for accurate lighting placement.</p>
            </div>
            <StandaloneRoomDimensions
              initialDimensions={setupData.roomDimensions}
              onDimensionsChange={handleDimensionsChange}
            />
          </div>
        )

      case 1:
        return (
          <SocketPositionSelector
            roomDimensions={setupData.roomDimensions}
            onPositionSelect={handlePositionSelect}
            selectedPosition={setupData.socketPosition}
          />
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Link className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Choose Hanging Type & Height</h3>
              <p className="text-gray-600">Select the type of lighting system and installation height.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "track",
                  name: "Track System",
                  desc: "Flexible track with adjustable spotlights",
                  recommended: true,
                  heightRange: "2.4-2.8m",
                  defaultHeight: 2.6,
                  power: "Direct connection to socket",
                },
                {
                  id: "pendant",
                  name: "Pendant Lights",
                  desc: "Individual hanging lights",
                  heightRange: "1.8-2.2m",
                  defaultHeight: 2.0,
                  power: "Cable to socket",
                },
                {
                  id: "linear",
                  name: "Linear System",
                  desc: "Continuous linear LED lighting",
                  heightRange: "2.5-3.0m",
                  defaultHeight: 2.7,
                  power: "Driver box near socket",
                },
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    setupData.hangingType === option.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setSetupData((prev) => ({
                      ...prev,
                      hangingType: option.id,
                      hangingHeight: option.defaultHeight,
                    }))
                  }
                >
                  <CardContent className="p-4 text-center">
                    {option.recommended && <Badge className="mb-2 bg-green-100 text-green-800">Recommended</Badge>}
                    <h4 className="font-medium mb-2">{option.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{option.desc}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Height: {option.heightRange}</div>
                      <div>Default: {option.defaultHeight}m</div>
                      <div>Power: {option.power}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Height adjustment */}
            {setupData.hangingType && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Adjust Hanging Height</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">Current height:</span>
                      <span className="font-medium text-blue-900">{setupData.hangingHeight}m</span>
                    </div>
                    <input
                      type="range"
                      min={
                        setupData.hangingType === "pendant" ? "1.8" : setupData.hangingType === "track" ? "2.4" : "2.5"
                      }
                      max={
                        setupData.hangingType === "pendant" ? "2.2" : setupData.hangingType === "track" ? "2.8" : "3.0"
                      }
                      step="0.1"
                      value={setupData.hangingHeight}
                      onChange={(e) =>
                        setSetupData((prev) => ({ ...prev, hangingHeight: Number.parseFloat(e.target.value) }))
                      }
                      className="w-full"
                    />
                    <div className="text-xs text-blue-700">
                      Recommended range:{" "}
                      {setupData.hangingType === "pendant"
                        ? "1.8-2.2m"
                        : setupData.hangingType === "track"
                          ? "2.4-2.8m"
                          : "2.5-3.0m"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {setupData.socketPosition && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Based on your socket position:</h4>
                <p className="text-sm text-blue-800">
                  Socket on {setupData.socketPosition.wall} wall, {setupData.socketPosition.description.toLowerCase()} -
                  {setupData.socketPosition.wall === "ceiling"
                    ? " Perfect for direct ceiling mount systems"
                    : " Track system recommended for flexible lighting"}
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Configure Layout</h3>
              <p className="text-gray-600">
                Set up your {setupData.hangingType} layout at {setupData.hangingHeight}m height.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "straight",
                  name: "Straight Track",
                  desc: "Simple straight line configuration",
                  length: `${Math.min(setupData.roomDimensions.width, setupData.roomDimensions.length) * 0.8}m`,
                  spots: "2-4 spotlights",
                  type: "preset",
                },
                {
                  id: "l-shape",
                  name: "L-Shaped",
                  desc: "Corner configuration for better coverage",
                  length: `${setupData.roomDimensions.width * 0.6 + setupData.roomDimensions.length * 0.6}m`,
                  spots: "3-6 spotlights",
                  type: "preset",
                },
                {
                  id: "custom",
                  name: "Custom Layout",
                  desc: "Design your own configuration step by step",
                  length: "Variable",
                  spots: "As needed",
                  type: "custom",
                },
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    setupData.trackLayout === option.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSetupData((prev) => ({ ...prev, trackLayout: option.id }))}
                >
                  <CardContent className="p-4 text-center">
                    <Badge
                      className={`mb-2 ${option.type === "preset" ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"}`}
                    >
                      {option.type === "preset" ? "Preset" : "Custom"}
                    </Badge>
                    <h4 className="font-medium mb-2">{option.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{option.desc}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Length: {option.length}</div>
                      <div>Lights: {option.spots}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {setupData.trackLayout && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Configuration Summary:</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>
                    Room: {setupData.roomDimensions.width}m × {setupData.roomDimensions.length}m ×{" "}
                    {setupData.roomDimensions.height}m
                  </div>
                  <div>
                    Socket: {setupData.socketPosition?.wall} wall at{" "}
                    {setupData.socketPosition?.distanceFromLeft?.toFixed(1)}m from left,{" "}
                    {setupData.socketPosition?.distanceFromBottom?.toFixed(1)}m from bottom
                  </div>
                  <div>
                    System: {setupData.hangingType} at {setupData.hangingHeight}m height with {setupData.trackLayout}{" "}
                    layout
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Guided Lighting Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Overview */}
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded text-center text-xs ${
                  index === currentStep
                    ? "bg-blue-100 border-2 border-blue-500"
                    : index < currentStep
                      ? "bg-green-100 border border-green-500"
                      : "bg-gray-100 border border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="font-medium">{step.title}</div>
                <div className="text-gray-600 mt-1">{step.description}</div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button onClick={handleNext} disabled={!canProceed()}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Start Building"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
