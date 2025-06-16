"use client"

import { useState, useEffect } from "react"
import { ConfiguratorProvider } from "@/components/configurator/configurator-context"
import { TranslationProvider } from "@/hooks/use-translation"
import { ConfiguratorHeader } from "@/components/configurator/configurator-header"
import { ConfiguratorSidebar } from "@/components/configurator/configurator-sidebar"
import { ConfiguratorViewer } from "@/components/configurator/configurator-viewer"
import { ConfiguratorFooter } from "@/components/configurator/configurator-footer"
import { InspirationCarousel } from "@/components/configurator/inspiration-carousel"
import { AdminPanel } from "@/components/admin/admin-panel"
import { EnhancedGuidedSetup } from "@/components/configurator/enhanced-guided-setup"
import { GuidedComponentPlacement } from "@/components/configurator/guided-component-placement"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/database"
import { ErrorHandler } from "@/lib/error-handler"

export default function ConfiguratorApp() {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<string>("Initializing...")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [guidedSetupCompleted, setGuidedSetupCompleted] = useState(false)
  const [showGuidedSetup, setShowGuidedSetup] = useState(false)
  const [showGuidedPlacement, setShowGuidedPlacement] = useState(false)
  const [guidedSetupData, setGuidedSetupData] = useState<any>(null)
  const { isAdmin } = useAuth()

  // Initialize error handler on mount
  useEffect(() => {
    ErrorHandler.init()
    console.log("🛡️ Error handler initialized")
  }, [])

  // Enhanced initialization with progress tracking
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const initializeApp = async () => {
      try {
        console.log("🚀 Main App: Starting initialization...")
        setDbStatus("Initializing database...")
        setLoadingProgress(10)

        // Add timeout protection
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("⚠️ Database initialization timeout")
            setDbStatus("Database timeout - using fallback")
            setLoadingProgress(100)
            setIsLoading(false)
            // Show guided setup after loading completes
            setShowGuidedSetup(true)
          }
        }, 15000) // 15 second timeout

        // Initialize database with progress updates
        setDbStatus("Setting up database schema...")
        setLoadingProgress(25)
        await db.init()

        if (!mounted) return

        setDbStatus("Loading components...")
        setLoadingProgress(50)

        // Load initial data
        try {
          await Promise.all([db.getComponents(), db.getBundles(), db.getPresets(), db.getInspirations()])
          setLoadingProgress(75)
        } catch (dataError) {
          console.warn("Some data failed to load, continuing with defaults:", dataError)
        }

        if (!mounted) return

        console.log("✅ Main App: Database initialized")
        setDbStatus("Finalizing setup...")
        setLoadingProgress(90)

        // Small delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Clear timeout since we succeeded
        clearTimeout(timeoutId)

        console.log("✅ Main App: App initialized successfully")
        setDbStatus("Ready")
        setLoadingProgress(100)

        // Small delay before hiding loading screen
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        if (!mounted) return

        console.error("App initialization error:", error)
        setLoadingError("Failed to initialize application. Please refresh the page.")
        setDbStatus("Error")
        setLoadingProgress(0)
        clearTimeout(timeoutId)
      } finally {
        if (mounted) {
          setIsLoading(false)
          // Show guided setup by default after loading
          setShowGuidedSetup(true)
        }
      }
    }

    initializeApp()

    // Cleanup function
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  // Admin panel toggle handler
  const handleAdminToggle = () => {
    console.log("🔧 Admin button clicked! Current state:", showAdminPanel)
    setShowAdminPanel(!showAdminPanel)
  }

  // Handle guided setup completion
  const handleGuidedSetupComplete = (setupData: any) => {
    console.log("✅ Guided setup completed with data:", setupData)
    setGuidedSetupData(setupData)
    setGuidedSetupCompleted(true)
    setShowGuidedSetup(false)
    setShowGuidedPlacement(true)
  }

  // Handle guided placement completion
  const handleGuidedPlacementComplete = () => {
    setShowGuidedPlacement(false)
    console.log("✅ Guided placement completed, showing main configurator")
  }

  // Handle starting over with guided setup
  const handleStartGuidedSetup = () => {
    setGuidedSetupCompleted(false)
    setShowGuidedSetup(true)
    setShowGuidedPlacement(false)
    setGuidedSetupData(null)
    console.log("🔄 Starting guided setup")
  }

  // Enhanced loading screen with black and white colors
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ACB Lighting</h1>
            <p className="text-gray-600">Configurator</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{loadingProgress}% Complete</p>
          </div>

          {/* Animated Spinner */}
          <div className="mb-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black mx-auto"></div>
              <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-r-gray-400 mx-auto animate-pulse"></div>
            </div>
          </div>

          {/* Status Text */}
          <div className="mb-6">
            <p className="text-lg font-medium text-gray-900 mb-2">Preparing your lighting configurator...</p>
            <p className="text-sm text-gray-600 animate-pulse">{dbStatus}</p>
          </div>

          {/* Loading Steps */}
          <div className="text-left bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-2 text-xs">
              <div className={`flex items-center ${loadingProgress >= 10 ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${loadingProgress >= 10 ? "bg-black" : "bg-gray-300"}`} />
                Initialize system
              </div>
              <div className={`flex items-center ${loadingProgress >= 25 ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${loadingProgress >= 25 ? "bg-black" : "bg-gray-300"}`} />
                Setup database
              </div>
              <div className={`flex items-center ${loadingProgress >= 50 ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${loadingProgress >= 50 ? "bg-black" : "bg-gray-300"}`} />
                Load components
              </div>
              <div className={`flex items-center ${loadingProgress >= 75 ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${loadingProgress >= 75 ? "bg-black" : "bg-gray-300"}`} />
                Load content
              </div>
              <div className={`flex items-center ${loadingProgress >= 90 ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${loadingProgress >= 90 ? "bg-black" : "bg-gray-300"}`} />
                Prepare guided setup
              </div>
            </div>
          </div>

          {/* Fallback Button */}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 text-sm text-gray-700 hover:text-black underline transition-colors"
          >
            Taking too long? Click to refresh
          </button>
        </div>
      </div>
    )
  }

  // Enhanced error screen
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Error</h2>
            <p className="text-gray-600 mb-6">{loadingError}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h3 className="font-medium text-gray-900 mb-3">What you can try:</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• Check your internet connection</li>
              <li>• Clear your browser cache</li>
              <li>• Try a different browser</li>
              <li>• Refresh the page</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                setLoadingError(null)
                setIsLoading(true)
                setLoadingProgress(0)
              }}
              className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ConfiguratorProvider>
      <TranslationProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Debug info bar */}
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="text-xs text-blue-600 flex items-center justify-between">
              <span>
                DB Status: {dbStatus} | Admin: {isAdmin ? "Yes" : "No"} | Setup:{" "}
                {guidedSetupCompleted ? "Complete" : "Pending"}
              </span>
              <div className="flex items-center space-x-3">
                {guidedSetupCompleted && (
                  <button
                    onClick={handleStartGuidedSetup}
                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    Start Over
                  </button>
                )}
                <button
                  onClick={handleAdminToggle}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 font-medium"
                >
                  {showAdminPanel ? "← Back to Configurator" : "🔧 ADMIN PANEL"}
                </button>
              </div>
            </div>
          </div>

          {/* Show Enhanced Guided Setup by default */}
          {showGuidedSetup && (
            <EnhancedGuidedSetup
              isOpen={showGuidedSetup}
              onClose={() => setShowGuidedSetup(false)}
              onComplete={handleGuidedSetupComplete}
            />
          )}

          {/* Show Guided Component Placement after setup */}
          {showGuidedPlacement && guidedSetupData && (
            <div className="flex-1 flex">
              {/* 3D Viewer takes most space */}
              <div className="flex-1">
                <ConfiguratorViewer />
              </div>

              {/* Guided placement panel on the right */}
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Component Placement</h2>
                  <p className="text-sm text-gray-600">Click on highlighted snap points to place components</p>
                </div>
                <GuidedComponentPlacement setupData={guidedSetupData} onComplete={handleGuidedPlacementComplete} />
              </div>
            </div>
          )}

          {/* Show Admin Panel if requested */}
          {showAdminPanel ? (
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          ) : (
            <>
              {/* Only show main configurator after guided setup is completed */}
              {guidedSetupCompleted && !showGuidedPlacement ? (
                <>
                  <ConfiguratorHeader onAdminClick={handleAdminToggle} showAdminButton={true} />

                  <div className="flex-1 flex">
                    <ConfiguratorSidebar />
                    <ConfiguratorViewer />
                  </div>

                  {/* Inspiration Carousel - Full Width Overlapping Left Sidebar */}
                  <div className="bg-gray-50 border-t border-gray-200 w-full">
                    <div className="p-4">
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-5 h-5 text-amber-500 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M16.24 7.76L19.07 4.93"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M16.24 16.24L19.07 19.07"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M4.93 19.07L7.76 16.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <h3 className="text-lg font-medium">Lighting Inspiration</h3>
                        <span className="text-sm text-gray-500 ml-3">Discover possibilities for your space</span>
                        <div className="ml-auto text-sm text-gray-500">5 of 5</div>
                      </div>
                      <InspirationCarousel />
                    </div>
                  </div>

                  <ConfiguratorFooter />
                </>
              ) : !showGuidedSetup && !showGuidedPlacement ? (
                /* Welcome screen when guided setup is not shown */
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center max-w-lg mx-auto p-8">
                    <div className="mb-8">
                      <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-xl flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M16.24 7.76L19.07 4.93"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M16.24 16.24L19.07 19.07"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M4.93 19.07L7.76 16.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ACB Lighting Configurator</h1>
                      <p className="text-lg text-gray-600 mb-8">
                        Let's create the perfect lighting solution for your space with our step-by-step guided setup.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                      <h3 className="font-semibold text-gray-900 mb-4">What we'll help you with:</h3>
                      <ul className="text-left text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                          Configure your room dimensions
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                          Position your power socket precisely
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                          Choose hanging type and height
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                          Select track layout (preset or custom)
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                          Place components with guided snap points
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={handleStartGuidedSetup}
                      className="bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
                    >
                      Start Guided Setup
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </TranslationProvider>
    </ConfiguratorProvider>
  )
}
