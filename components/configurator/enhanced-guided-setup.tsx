"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Home,
  Zap,
  Link,
  Settings,
  Grid,
  Palette,
  Loader2,
} from "lucide-react"
import { StandaloneRoomDimensions } from "./standalone-room-dimensions"
import { SocketPositionSelector } from "./socket-position-selector"
import { db, type PresetData } from "@/lib/database"
import { useConfigurator } from "./configurator-context"

// Hanging type configurations with heights
const HANGING_TYPES = {
  track: {
    name: "Track System",
    description: "Flexible track with adjustable spotlights",
    height: 0.0, // meters from ceiling (flush mounted by default)
    heightRange: [0.0, 0.4], // 0cm to 40cm from ceiling
    recommended: true,
    components: ["power-supply", "track", "connector", "spotlight"],
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" className="mx-auto mb-3">
        {/* Track base */}
        <rect x="4" y="14" width="40" height="4" fill="#374151" rx="2"/>
        {/* Spotlights */}
        <circle cx="12" cy="16" r="3" fill="#6B7280"/>
        <circle cx="24" cy="16" r="3" fill="#6B7280"/>
        <circle cx="36" cy="16" r="3" fill="#6B7280"/>
        {/* Light beams */}
        <polygon points="10,22 14,22 12,28" fill="#F3F4F6" opacity="0.8"/>
        <polygon points="22,22 26,22 24,28" fill="#F3F4F6" opacity="0.8"/>
        <polygon points="34,22 38,22 36,28" fill="#F3F4F6" opacity="0.8"/>
      </svg>
    ),
  },
  pendant: {
    name: "Pendant Lights",
    description: "Individual hanging lights",
    height: 1.0, // 1m from ceiling
    heightRange: [0.8, 1.2], // 80cm to 120cm from ceiling
    recommended: false,
    components: ["pendant-light", "power-supply", "connector"],
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" className="mx-auto mb-3">
        {/* Pendant cables */}
        <line x1="12" y1="2" x2="12" y2="12" stroke="#6B7280" strokeWidth="1"/>
        <line x1="24" y1="2" x2="24" y2="12" stroke="#6B7280" strokeWidth="1"/>
        <line x1="36" y1="2" x2="36" y2="12" stroke="#6B7280" strokeWidth="1"/>
        {/* Pendant shades */}
        <ellipse cx="12" cy="15" rx="4" ry="3" fill="#374151"/>
        <ellipse cx="24" cy="15" rx="4" ry="3" fill="#374151"/>
        <ellipse cx="36" cy="15" rx="4" ry="3" fill="#374151"/>
        {/* Light beams */}
        <polygon points="8,18 16,18 14,28 10,28" fill="#F3F4F6" opacity="0.8"/>
        <polygon points="20,18 28,18 26,28 22,28" fill="#F3F4F6" opacity="0.8"/>
        <polygon points="32,18 40,18 38,28 34,28" fill="#F3F4F6" opacity="0.8"/>
      </svg>
    ),
  },
  linear: {
    name: "Linear System",
    description: "Continuous linear LED lighting",
    height: 0.3, // 30cm from ceiling
    heightRange: [0.0, 0.5], // 0cm to 50cm from ceiling
    recommended: false,
    components: ["linear-light", "power-supply", "driver"],
    icon: (
      <svg width="48" height="32" viewBox="0 0 48 32" className="mx-auto mb-3">
        {/* Linear LED strip */}
        <rect x="6" y="12" width="36" height="6" fill="#374151" rx="3"/>
        {/* LED points */}
        <circle cx="12" cy="15" r="1.5" fill="#D1D5DB"/>
        <circle cx="18" cy="15" r="1.5" fill="#D1D5DB"/>
        <circle cx="24" cy="15" r="1.5" fill="#D1D5DB"/>
        <circle cx="30" cy="15" r="1.5" fill="#D1D5DB"/>
        <circle cx="36" cy="15" r="1.5" fill="#D1D5DB"/>
        {/* Uniform light beam */}
        <rect x="8" y="20" width="32" height="8" fill="#F3F4F6" opacity="0.8" rx="1"/>
      </svg>
    ),
  },
}

interface EnhancedGuidedSetupProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (setupData: any) => void
}

interface SocketPosition {
  wall: string;
  description: string;
  x: number;
  y: number;
  z: number;
}

interface SetupData {
  roomDimensions: { width: number; length: number; height: number };
  socketPosition: SocketPosition | null;
  hangingType: string | null;
  hangingHeight: number;
  trackLayout: {
    type: string;
    preset: string | null;
    customComponents: any[];
  };
}

export function EnhancedGuidedSetup({ isOpen, onClose, onComplete }: EnhancedGuidedSetupProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [trackPresets, setTrackPresets] = useState<PresetData[]>([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const { dispatch } = useConfigurator()
  const [setupData, setSetupData] = useState<SetupData>({
    roomDimensions: { width: 8, length: 6, height: 3 },
    socketPosition: { wall: 'ceiling', description: 'Socket on Ceiling', x: 4, y: 3, z: 3 },
    hangingType: "track",
    hangingHeight: HANGING_TYPES.track.height,
    trackLayout: {
      type: "custom",
      preset: null,
      customComponents: [],
    },
  })

  const steps = [
    { id: "room", title: "Room Setup", description: "Set room dimensions", icon: <Home className="h-5 w-5" /> },
    { id: "socket", title: "Socket Position", description: "Place power socket", icon: <Zap className="h-5 w-5" /> },
    { id: "hanging", title: "Hanging Type", description: "Choose system type", icon: <Link className="h-5 w-5" /> },
    { id: "layout", title: "Track Layout", description: "Configure layout", icon: <Settings className="h-5 w-5" /> },
  ]

  // Load track layout presets from database
  useEffect(() => {
    const loadTrackPresets = async () => {
      if (currentStep === 3) {
        // Only load when we reach the layout step
        setLoadingPresets(true)
        try {
          await db.init()
          let presets: PresetData[] = [];
          if (typeof db.getPresets === 'function') {
            // TODO: Filter by category if needed
            presets = await db.getPresets();
          }
          setTrackPresets(presets)
          console.log("Loaded track presets:", presets.length)
        } catch (error) {
          console.error("Error loading track presets:", error)
        } finally {
          setLoadingPresets(false)
        }
      }
    }

    loadTrackPresets()
  }, [currentStep])

  const handleDimensionsChange = useCallback((dimensions: { width: number; length: number; height: number }) => {
    setSetupData((prev) => ({ ...prev, roomDimensions: dimensions }))
  }, [])

  const handlePositionSelect = useCallback(
    (position: any) => {
      setSetupData((prev) => ({ ...prev, socketPosition: position }))

      // Also update the socket position in the context for cable calculations
      if (position) {
        dispatch({
          type: "SET_SOCKET_POSITION",
          position: {
            x: position.x || 0,
            y: position.y || 0,
            z: position.z || 0,
          },
        })
      }
    },
    [dispatch],
  )

  const handleHangingTypeSelect = (typeId: string) => {
    const hangingType = HANGING_TYPES[typeId as keyof typeof HANGING_TYPES]
    setSetupData((prev) => ({
      ...prev,
      hangingType: typeId,
      hangingHeight: hangingType.height,
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Calculate final component positions based on ceiling drop distance
      const finalSetupData = {
        ...setupData,
        componentHeight: setupData.roomDimensions.height - setupData.hangingHeight, // Convert ceiling drop to floor height
        socketPosition: setupData.socketPosition,
        guidedMode: true,
      }
      onComplete(finalSetupData)
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
        return setupData.trackLayout.type === "custom" || setupData.trackLayout.preset !== null
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
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-900" />
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
            selectedPosition={setupData.socketPosition as SocketPosition | null}
          />
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Link className="h-12 w-12 mx-auto mb-4 text-gray-900" />
              <h3 className="text-xl font-semibold mb-2">Choose Hanging Type & Height</h3>
              <p className="text-gray-600">Select the lighting system and set the hanging height.</p>
            </div>

            {/* Hanging Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(HANGING_TYPES).map(([typeId, type]) => (
                <Card
                  key={typeId}
                  className={`cursor-pointer transition-all ${
                    setupData.hangingType === typeId ? "ring-2 ring-gray-900 bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleHangingTypeSelect(typeId)}
                >
                  <CardContent className="p-4 text-center">
                    {"recommended" in type && type.recommended && (
                      <Badge className="mb-2 bg-gray-100 text-gray-800">Recommended</Badge>
                    )}
                    {type.icon}
                    <h4 className="font-medium mb-2">{type.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Default Drop: {type.height}m from ceiling</div>
                      <div>
                        Range: {type.heightRange[0]}m - {type.heightRange[1]}m from ceiling
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Height Adjustment */}
            {setupData.hangingType && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Adjust Drop Distance from Ceiling</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Drop from ceiling:</span>
                    <span className="font-medium">{setupData.hangingHeight}m</span>
                  </div>
                  <input
                    type="range"
                    min={HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].heightRange[0]}
                    max={HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].heightRange[1]}
                    step="0.1"
                    value={setupData.hangingHeight}
                    onChange={(e) =>
                      setSetupData((prev) => ({ ...prev, hangingHeight: Number.parseFloat(e.target.value) }))
                    }
                    className="w-full"
                    title="Adjust drop distance from ceiling"
                    placeholder="Adjust drop distance from ceiling"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].heightRange[0]}m</span>
                    <span>{HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].heightRange[1]}m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Socket Position Context */}
            {setupData.socketPosition && setupData.hangingType && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Configuration Preview:</h4>
                <div className="text-sm text-gray-800 space-y-1">
                  <div>
                    Socket: {setupData.socketPosition.wall} wall, {setupData.socketPosition.description?.toLowerCase()}
                  </div>
                  <div>
                    System: {HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].name} at{" "}
                    {setupData.hangingHeight}m from ceiling
                  </div>
                  <div>
                    Final height: {(setupData.roomDimensions.height - setupData.hangingHeight).toFixed(1)}m from floor
                  </div>
                  <div>
                    Cable run: ~
                    {setupData.socketPosition.wall === "ceiling"
                      ? `${setupData.hangingHeight.toFixed(1)}m`
                      : `${(setupData.roomDimensions.height - (setupData.socketPosition?.y || 0) + setupData.hangingHeight).toFixed(1)}m`}{" "}
                    from socket
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-900" />
              <h3 className="text-xl font-semibold mb-2">Configure Track Layout</h3>
              <p className="text-gray-600">Choose a preset created by admins or create a custom layout.</p>
            </div>

            {/* Layout Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card
                className={`cursor-pointer transition-all ${
                  setupData.trackLayout.type === "preset" ? "ring-2 ring-gray-900 bg-gray-50" : "hover:bg-gray-50"
                }`}
                onClick={() =>
                  setSetupData((prev) => ({ ...prev, trackLayout: { ...prev.trackLayout, type: "preset" } }))
                }
              >
                <CardContent className="p-4 text-center">
                  <Grid className="h-8 w-8 mx-auto mb-2 text-gray-900" />
                  <h4 className="font-medium mb-1">Use Admin Preset</h4>
                  <p className="text-sm text-gray-600">Start with a pre-designed layout</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  setupData.trackLayout.type === "custom" ? "ring-2 ring-gray-900 bg-gray-50" : "hover:bg-gray-50"
                }`}
                onClick={() =>
                  setSetupData((prev) => ({ ...prev, trackLayout: { ...prev.trackLayout, type: "custom" } }))
                }
              >
                <CardContent className="p-4 text-center">
                  <Palette className="h-8 w-8 mx-auto mb-2 text-gray-900" />
                  <h4 className="font-medium mb-1">Custom Layout</h4>
                  <p className="text-sm text-gray-600">Build your own configuration</p>
                </CardContent>
              </Card>
            </div>

            {/* Preset Selection */}
            {setupData.trackLayout.type === "preset" && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Choose an Admin-Created Preset Layout</h4>

                {loadingPresets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading preset layouts...</span>
                  </div>
                ) : trackPresets.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-2">No preset layouts available</p>
                    <p className="text-sm text-gray-400">
                      Ask your admin to create some preset layouts in the admin panel.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {trackPresets.map((preset) => (
                      <Card
                        key={preset.id}
                        className={`cursor-pointer transition-all ${
                          setupData.trackLayout.preset === preset.id
                            ? "ring-2 ring-gray-900 bg-gray-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          setSetupData((prev) => ({ ...prev, trackLayout: { ...prev.trackLayout, preset: preset.id } }))
                        }
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-medium mb-2">{preset.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Components: {preset.components.length}</div>
                            <div>Created: {preset.createdAt.toLocaleDateString()}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {setupData.trackLayout.preset && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Preset Selected: {trackPresets.find((p) => p.id === setupData.trackLayout.preset)?.name}
                    </h4>
                    <p className="text-sm text-gray-800 mb-3">
                      {trackPresets.find((p) => p.id === setupData.trackLayout.preset)?.description}
                    </p>
                    <div className="text-xs text-gray-700">
                      You can customize this preset after setup by adding, removing, or repositioning components.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Layout Info */}
            {setupData.trackLayout.type === "custom" && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Custom Layout Mode</h4>
                <p className="text-sm text-gray-800 mb-3">
                  You'll start with an empty canvas and build your lighting system component by component.
                </p>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>• Select components from the sidebar</div>
                  <div>• Click on highlighted snap points to place components</div>
                  <div>• Connect components using the snap system</div>
                  <div>• Adjust positions and rotations as needed</div>
                </div>
              </div>
            )}

            {/* Final Summary */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Setup Summary:</h4>
              <div className="text-sm text-gray-800 space-y-1">
                <div>
                  Room: {setupData.roomDimensions.width}m × {setupData.roomDimensions.length}m ×{" "}
                  {setupData.roomDimensions.height}m
                </div>
                <div>
                  Socket: {setupData.socketPosition?.wall} wall, {setupData.socketPosition?.description?.toLowerCase()}
                </div>
                <div>
                  System:{" "}
                  {setupData.hangingType && HANGING_TYPES[setupData.hangingType as keyof typeof HANGING_TYPES].name} at{" "}
                  {setupData.hangingHeight}m from ceiling
                </div>
                <div>
                  Layout:{" "}
                  {setupData.trackLayout.type === "preset"
                    ? `Admin Preset - ${trackPresets.find((p) => p.id === setupData.trackLayout.preset)?.name || "Selected"}`
                    : "Custom build"}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    isOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">&times;</button>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5" />
            <span className="text-lg font-semibold">Enhanced Lighting Setup</span>
          </div>
          <div className="relative flex flex-col h-full justify-center space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <progress value={progress} max={100} className="w-full h-2 rounded bg-gray-200" />
            </div>
            {/* Step Overview */}
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded text-center text-xs ${
                    index === currentStep
                      ? "bg-gray-100 border-2 border-gray-900"
                      : index < currentStep
                        ? "bg-gray-50 border border-gray-900"
                        : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4 text-gray-900" />
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
            {/* Navigation - fixed in gray overlay, vertically centered */}
            {isOpen && (
              <>
                <div
                  className="fixed left-8 top-1/2 z-50"
                  style={{ transform: 'translateY(-50%)' }}
                  aria-label="Previous Step"
                >
                  <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                </div>
                <div
                  className="fixed right-8 top-1/2 z-50"
                  style={{ transform: 'translateY(-50%)' }}
                  aria-label="Next Step"
                >
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
              </>
            )}
          </div>
        </div>
      </div>
    ) : null
  )
}
