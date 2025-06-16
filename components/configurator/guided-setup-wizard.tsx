"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Lightbulb, Home, Zap, Link, Settings } from "lucide-react"
import { useConfigurator } from "./configurator-context"
import { RoomDimensionsControl } from "./room-dimensions-control"

interface GuidedSetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
  isComplete: boolean
  canSkip: boolean
}

interface GuidedSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function GuidedSetupWizard({ isOpen, onClose, onComplete }: GuidedSetupWizardProps) {
  const { state, dispatch } = useConfigurator()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [setupData, setSetupData] = useState({
    roomDimensions: null,
    powerSource: null,
    hangingType: null,
    trackSystem: null,
    components: [],
  })

  // Room Dimensions Step
  const RoomSetupStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Home className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-xl font-semibold mb-2">Set Up Your Room</h3>
        <p className="text-gray-600">First, let's configure your room dimensions for accurate lighting placement.</p>
      </div>
      <RoomDimensionsControl />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">Room Setup Tips:</div>
            <ul className="text-blue-800 space-y-1">
              <li>• Measure your room accurately for best results</li>
              <li>• Consider ceiling height for proper lighting coverage</li>
              <li>• Account for furniture and obstacles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  // Power Source Selection Step
  const PowerSourceStep = () => {
    const powerOptions = [
      {
        id: "ceiling-outlet",
        name: "Ceiling Outlet",
        description: "Standard ceiling electrical outlet",
        image: "/placeholder.svg?height=80&width=80&text=Outlet",
        recommended: true,
      },
      {
        id: "wall-outlet",
        name: "Wall Outlet",
        description: "Wall-mounted electrical outlet with extension",
        image: "/placeholder.svg?height=80&width=80&text=Wall",
      },
      {
        id: "junction-box",
        name: "Junction Box",
        description: "Hardwired junction box connection",
        image: "/placeholder.svg?height=80&width=80&text=Junction",
      },
    ]

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h3 className="text-xl font-semibold mb-2">Choose Power Source</h3>
          <p className="text-gray-600">Select how you'll power your lighting system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {powerOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                setupData.powerSource === option.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setSetupData((prev) => ({ ...prev, powerSource: option.id }))}
            >
              <CardContent className="p-4 text-center">
                {option.recommended && <Badge className="mb-2 bg-green-100 text-green-800">Recommended</Badge>}
                <img
                  src={option.image || "/placeholder.svg"}
                  alt={option.name}
                  className="w-16 h-16 mx-auto mb-3 rounded"
                />
                <h4 className="font-medium mb-2">{option.name}</h4>
                <p className="text-sm text-gray-600">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-900 mb-1">Power Safety:</div>
              <div className="text-yellow-800">
                Always ensure power is turned off before installation. Consider hiring a qualified electrician for
                hardwired connections.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Hanging Type Selection Step
  const HangingTypeStep = () => {
    const hangingOptions = [
      {
        id: "track-system",
        name: "Track System",
        description: "Flexible track with adjustable spotlights",
        image: "/placeholder.svg?height=80&width=80&text=Track",
        recommended: true,
        features: ["Adjustable positioning", "Multiple light types", "Easy expansion"],
      },
      {
        id: "pendant-lights",
        name: "Pendant Lights",
        description: "Individual hanging lights",
        image: "/placeholder.svg?height=80&width=80&text=Pendant",
        features: ["Focused lighting", "Decorative options", "Simple installation"],
      },
      {
        id: "linear-system",
        name: "Linear System",
        description: "Continuous linear lighting",
        image: "/placeholder.svg?height=80&width=80&text=Linear",
        features: ["Uniform lighting", "Modern appearance", "Energy efficient"],
      },
    ]

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Link className="h-12 w-12 mx-auto mb-4 text-purple-600" />
          <h3 className="text-xl font-semibold mb-2">Select Hanging Type</h3>
          <p className="text-gray-600">Choose the type of lighting system that best fits your needs.</p>
        </div>

        <div className="space-y-4">
          {hangingOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                setupData.hangingType === option.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setSetupData((prev) => ({ ...prev, hangingType: option.id }))}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <img src={option.image || "/placeholder.svg"} alt={option.name} className="w-16 h-16 rounded" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{option.name}</h4>
                      {option.recommended && <Badge className="bg-green-100 text-green-800">Recommended</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Track System Configuration Step
  const TrackSystemStep = () => {
    const trackOptions = [
      {
        id: "straight-track",
        name: "Straight Track",
        description: "Simple straight track system",
        length: "1m, 2m, 3m options",
        image: "/placeholder.svg?height=60&width=120&text=Straight",
      },
      {
        id: "l-shaped-track",
        name: "L-Shaped Track",
        description: "Corner track system",
        length: "Customizable lengths",
        image: "/placeholder.svg?height=60&width=120&text=L-Shape",
      },
      {
        id: "flexible-track",
        name: "Flexible Track",
        description: "Bendable track for curves",
        length: "2m flexible sections",
        image: "/placeholder.svg?height=60&width=120&text=Flexible",
      },
    ]

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Settings className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-xl font-semibold mb-2">Configure Track System</h3>
          <p className="text-gray-600">Select the track configuration for your lighting system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trackOptions.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                setupData.trackSystem === option.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => setSetupData((prev) => ({ ...prev, trackSystem: option.id }))}
            >
              <CardContent className="p-4 text-center">
                <img
                  src={option.image || "/placeholder.svg"}
                  alt={option.name}
                  className="w-full h-12 mx-auto mb-3 rounded"
                />
                <h4 className="font-medium mb-2">{option.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                <Badge variant="outline" className="text-xs">
                  {option.length}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-green-900 mb-1">Track System Benefits:</div>
              <div className="text-green-800">
                Track systems offer maximum flexibility for adjusting light positions and adding components later.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Interactive Assembly Step
  const InteractiveAssemblyStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-xl font-semibold mb-2">Build Your System</h3>
        <p className="text-gray-600">
          Now let's build your lighting system step by step. Click on snap points to add compatible components.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm space-y-2">
          <div className="font-medium text-blue-900">Interactive Assembly Instructions:</div>
          <div className="text-blue-800 space-y-1">
            <div>1. We'll start by placing your power source</div>
            <div>2. Click on snap points (colored dots) to add compatible components</div>
            <div>3. Components will automatically rotate and attach magnetically</div>
            <div>4. Follow the suggested order for best results</div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={() => {
            // Start the interactive assembly mode
            dispatch({ type: "SET_GUIDED_ASSEMBLY_MODE", enabled: true })
            onComplete()
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Start Interactive Assembly
        </Button>
      </div>
    </div>
  )

  const steps: GuidedSetupStep[] = [
    {
      id: "room-setup",
      title: "Room Setup",
      description: "Configure room dimensions",
      icon: <Home className="h-5 w-5" />,
      component: <RoomSetupStep />,
      isComplete: !!state.roomDimensions,
      canSkip: false,
    },
    {
      id: "power-source",
      title: "Power Source",
      description: "Select power connection",
      icon: <Zap className="h-5 w-5" />,
      component: <PowerSourceStep />,
      isComplete: !!setupData.powerSource,
      canSkip: false,
    },
    {
      id: "hanging-type",
      title: "Hanging Type",
      description: "Choose lighting system type",
      icon: <Link className="h-5 w-5" />,
      component: <HangingTypeStep />,
      isComplete: !!setupData.hangingType,
      canSkip: false,
    },
    {
      id: "track-system",
      title: "Track System",
      description: "Configure track layout",
      icon: <Settings className="h-5 w-5" />,
      component: <TrackSystemStep />,
      isComplete: !!setupData.trackSystem,
      canSkip: setupData.hangingType !== "track-system",
    },
    {
      id: "interactive-assembly",
      title: "Interactive Assembly",
      description: "Build your lighting system",
      icon: <Lightbulb className="h-5 w-5" />,
      component: <InteractiveAssemblyStep />,
      isComplete: false,
      canSkip: false,
    },
  ]

  const currentStep = steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const canProceed = currentStep.isComplete || currentStep.canSkip

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Guided Lighting Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded text-center text-xs ${
                  index === currentStepIndex
                    ? "bg-blue-100 border-2 border-blue-500"
                    : step.isComplete
                      ? "bg-green-100 border border-green-500"
                      : "bg-gray-100 border border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {step.isComplete ? (
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

          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep.icon}
                {currentStep.title}
              </CardTitle>
            </CardHeader>
            <CardContent>{currentStep.component}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStepIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep.canSkip && !currentStep.isComplete && (
                <Button variant="outline" onClick={handleNext}>
                  Skip Step
                </Button>
              )}

              {currentStepIndex < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onComplete} disabled={!canProceed}>
                  Start Building
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
