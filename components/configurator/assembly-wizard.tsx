"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react"
import type { AssemblyWorkflow } from "@/lib/snap-system"
import { useConfigurator } from "./configurator-context"

interface AssemblyWizardProps {
  isOpen: boolean
  onClose: () => void
  workflow?: AssemblyWorkflow
}

export function AssemblyWizard({ isOpen, onClose, workflow }: AssemblyWizardProps) {
  const { state, dispatch } = useConfigurator()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  // Default workflow if none provided
  const defaultWorkflow: AssemblyWorkflow = {
    id: "basic-track-system",
    name: "Basic Track Lighting System",
    description: "Step-by-step guide to build a basic track lighting system",
    startingComponent: "track",
    steps: [
      {
        id: "step-1",
        title: "Install Main Track",
        description:
          "Start by placing the main track on the ceiling. This will be the backbone of your lighting system.",
        availableComponents: ["track"],
        targetSnapPoints: [],
        isOptional: false,
        nextSteps: ["step-2"],
      },
      {
        id: "step-2",
        title: "Add Power Supply",
        description: "Connect the power supply to one end of the track. Look for the power input snap point.",
        baseComponent: "track",
        availableComponents: ["power-supply"],
        targetSnapPoints: ["power-input"],
        isOptional: false,
        nextSteps: ["step-3"],
      },
      {
        id: "step-3",
        title: "Install Spotlights",
        description: "Add spotlights along the track. You can add multiple spotlights as needed.",
        baseComponent: "track",
        availableComponents: ["spotlight"],
        targetSnapPoints: ["track-mount"],
        isOptional: false,
        nextSteps: ["step-4"],
      },
      {
        id: "step-4",
        title: "Add Connectors (Optional)",
        description: "If you need to extend the track or create corners, add connectors between track segments.",
        baseComponent: "track",
        availableComponents: ["connector"],
        targetSnapPoints: ["track-connection"],
        isOptional: true,
        nextSteps: [],
      },
    ],
  }

  const activeWorkflow = workflow || defaultWorkflow
  const currentStep = activeWorkflow.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / activeWorkflow.steps.length) * 100

  useEffect(() => {
    if (isOpen) {
      // Reset wizard state when opened
      setCurrentStepIndex(0)
      setCompletedSteps(new Set())
      setSelectedComponent(null)
    }
  }, [isOpen])

  const handleComponentSelect = (componentType: string) => {
    setSelectedComponent(componentType)

    // Find the component in available components
    const component = state.availableComponents.find((c) => c.type === componentType)
    if (component) {
      // Add component to configuration
      const newComponent = {
        ...component,
        id: `${component.id}-${Date.now()}`,
        position: [0, 1.5, 0] as [number, number, number], // Default ceiling position
        rotation: [0, 0, 0] as [number, number, number],
        connections: [],
        connectionPoints: [],
      }

      dispatch({ type: "ADD_COMPONENT", component: newComponent })
    }
  }

  const handleStepComplete = () => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(currentStep.id)
    setCompletedSteps(newCompleted)

    // Move to next step if available
    if (currentStepIndex < activeWorkflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleNextStep = () => {
    if (currentStepIndex < activeWorkflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const isStepCompleted = (stepId: string) => completedSteps.has(stepId)
  const canProceed = isStepCompleted(currentStep.id) || currentStep.isOptional

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {activeWorkflow.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStepIndex + 1} of {activeWorkflow.steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {activeWorkflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-2 rounded text-center text-xs ${
                  index === currentStepIndex
                    ? "bg-blue-100 border-2 border-blue-500"
                    : isStepCompleted(step.id)
                      ? "bg-green-100 border border-green-500"
                      : "bg-gray-100 border border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isStepCompleted(step.id) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="font-medium">{step.title}</div>
                {step.isOptional && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Optional
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentStep.title}</span>
                {currentStep.isOptional && <Badge variant="outline">Optional</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{currentStep.description}</p>

              {/* Available Components */}
              <div>
                <h4 className="font-medium mb-2">Available Components:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {currentStep.availableComponents.map((componentType) => {
                    const component = state.availableComponents.find((c) => c.type === componentType)
                    if (!component) return null

                    return (
                      <Card
                        key={componentType}
                        className={`cursor-pointer transition-colors ${
                          selectedComponent === componentType ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleComponentSelect(componentType)}
                      >
                        <CardContent className="p-3 text-center">
                          <img
                            src={component.image || "/placeholder.svg"}
                            alt={component.name}
                            className="w-12 h-12 mx-auto mb-2 rounded"
                          />
                          <div className="text-sm font-medium">{component.name}</div>
                          <div className="text-xs text-gray-500">€{component.price}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Target Snap Points */}
              {currentStep.targetSnapPoints.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Look for these connection points:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentStep.targetSnapPoints.map((snapPointType) => (
                      <Badge key={snapPointType} variant="outline">
                        {snapPointType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Tip:</div>
                    <div className="text-blue-800">
                      {currentStepIndex === 0 &&
                        "Start by placing the component in the 3D view. You can move it around to find the best position."}
                      {currentStepIndex === 1 &&
                        "Look for glowing snap points on the track. The power supply will automatically align when you get close."}
                      {currentStepIndex === 2 &&
                        "Spotlights can be placed anywhere along the track. Try adding multiple for better lighting coverage."}
                      {currentStepIndex === 3 &&
                        "Connectors allow you to create L-shapes or extend tracks. This step is optional for basic setups."}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep} disabled={currentStepIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!isStepCompleted(currentStep.id) && (
                <Button onClick={handleStepComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}

              {currentStepIndex < activeWorkflow.steps.length - 1 ? (
                <Button onClick={handleNextStep} disabled={!canProceed}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onClose}>Finish</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
