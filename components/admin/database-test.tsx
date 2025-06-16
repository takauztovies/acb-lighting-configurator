"use client"

import { useEffect } from "react"

// Test different import patterns to find what works
export function DatabaseTest() {
  useEffect(() => {
    console.log("DatabaseTest component mounted")

    // Test 1: Try importing the entire module
    import("@/lib/database")
      .then((module) => {
        console.log("Full database module:", module)
        console.log("Available exports:", Object.keys(module))
        console.log("db export exists:", "db" in module)
        console.log("db type:", typeof module.db)
      })
      .catch((error) => {
        console.error("Error importing database module:", error)
      })

    // Test 2: Try importing specific exports
    import("@/lib/database")
      .then(({ db, ComponentData }) => {
        console.log("Named imports successful:", { db: typeof db, ComponentData: typeof ComponentData })
      })
      .catch((error) => {
        console.error("Error with named imports:", error)
      })
  }, [])

  return (
    <div className="p-4 border rounded">
      <h3>Database Import Test</h3>
      <p>Check the console for import test results</p>
    </div>
  )
}
