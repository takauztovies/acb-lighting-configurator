"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Cable, Calculator } from "lucide-react"
import { useConfigurator } from "./configurator-context"

export function CableCalculator() {
  const { state, dispatch } = useConfigurator()

  const handlePricingUpdate = (type: "power" | "data", price: number) => {
    const newPricing = { ...state.cablePricing, [type]: price }
    dispatch({ type: "UPDATE_CABLE_PRICING", pricing: newPricing })
  }

  const totalCableCost = state.cableCalculations.reduce((sum, cable) => sum + cable.totalPrice, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cable className="h-5 w-5" />
          Cable Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cable Pricing Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="power-cable-price">Power Cable (€/m)</Label>
            <Input
              id="power-cable-price"
              type="number"
              step="0.1"
              value={state.cablePricing.power}
              onChange={(e) => handlePricingUpdate("power", Number.parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="data-cable-price">Data Cable (€/m)</Label>
            <Input
              id="data-cable-price"
              type="number"
              step="0.1"
              value={state.cablePricing.data}
              onChange={(e) => handlePricingUpdate("data", Number.parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Socket Position Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Socket Position:</span>
            {state.socketPosition ? (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                Set ({state.socketPosition.x.toFixed(1)}, {state.socketPosition.y.toFixed(1)},{" "}
                {state.socketPosition.z.toFixed(1)})
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                Not Set
              </Badge>
            )}
          </div>
        </div>

        {/* Cable Calculations */}
        {state.cableCalculations.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Required Cables:</h4>
            {state.cableCalculations.map((cable, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cable.description}</span>
                  <Badge variant={cable.type === "power" ? "default" : "secondary"}>{cable.type}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Length:</span> {cable.length}m
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span> €{cable.pricePerMeter}/m
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span> €{cable.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            {/* Total Cable Cost */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Total Cable Cost:</span>
                <span className="font-bold text-gray-900">€{totalCableCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Set socket position and add components to calculate cable requirements</p>
          </div>
        )}

        {/* Recalculate Button */}
        <Button
          onClick={() => dispatch({ type: "CALCULATE_CABLES" })}
          variant="outline"
          className="w-full"
          disabled={!state.socketPosition || state.currentConfig.components.length === 0}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Recalculate Cables
        </Button>

        {/* Tips */}
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-lg">
          <strong>💡 Tips:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Cable length includes 10% safety margin</li>
            <li>Power cables connect socket to first power component</li>
            <li>Prices are automatically updated when you change components</li>
            <li>Set socket position in guided setup for accurate calculations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
