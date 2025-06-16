"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useConfigurator } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"

export function ComponentProperties() {
  const { state, dispatch } = useConfigurator()
  const { t } = useTranslation()
  const selectedComponent = state.currentConfig.components.find((c) => c.id === state.selectedComponentId)

  const updateComponentPosition = (axis: "x" | "y" | "z", value: number) => {
    if (!selectedComponent) return

    const newPosition = [...selectedComponent.position] as [number, number, number]
    const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2
    newPosition[axisIndex] = value

    dispatch({
      type: "UPDATE_COMPONENT",
      componentId: selectedComponent.id,
      updates: { position: newPosition },
    })
  }

  const updateComponentRotation = (axis: "x" | "y" | "z", value: number) => {
    if (!selectedComponent) return

    const newRotation = [...selectedComponent.rotation] as [number, number, number]
    const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2
    newRotation[axisIndex] = (value * Math.PI) / 180 // Convert to radians

    dispatch({
      type: "UPDATE_COMPONENT",
      componentId: selectedComponent.id,
      updates: { rotation: newRotation },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("componentProperties")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedComponent ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{t("noComponentSelected")}</p>
            <p className="text-xs text-gray-400 mt-2">{t("selectComponentToEdit")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Component Info */}
            <div className="flex items-center space-x-2">
              <img
                src={selectedComponent.image || "/placeholder.svg"}
                alt={selectedComponent.name}
                className="w-8 h-8 rounded"
              />
              <div>
                <p className="text-sm font-medium">{selectedComponent.name}</p>
                <p className="text-xs text-gray-500">{t(selectedComponent.type)}</p>
              </div>
            </div>

            {/* Position Controls */}
            <div>
              <Label className="text-xs font-medium text-gray-700">{t("position")}</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <Label htmlFor="pos-x" className="text-xs text-gray-500">
                    X
                  </Label>
                  <Input
                    id="pos-x"
                    type="number"
                    step="0.1"
                    value={selectedComponent.position[0].toFixed(1)}
                    onChange={(e) => updateComponentPosition("x", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y" className="text-xs text-gray-500">
                    Y
                  </Label>
                  <Input
                    id="pos-y"
                    type="number"
                    step="0.1"
                    value={selectedComponent.position[1].toFixed(1)}
                    onChange={(e) => updateComponentPosition("y", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pos-z" className="text-xs text-gray-500">
                    Z
                  </Label>
                  <Input
                    id="pos-z"
                    type="number"
                    step="0.1"
                    value={selectedComponent.position[2].toFixed(1)}
                    onChange={(e) => updateComponentPosition("z", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Rotation Controls */}
            <div>
              <Label className="text-xs font-medium text-gray-700">{t("rotation")}</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <Label htmlFor="rot-x" className="text-xs text-gray-500">
                    X°
                  </Label>
                  <Input
                    id="rot-x"
                    type="number"
                    step="15"
                    value={Math.round((selectedComponent.rotation[0] * 180) / Math.PI)}
                    onChange={(e) => updateComponentRotation("x", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="rot-y" className="text-xs text-gray-500">
                    Y°
                  </Label>
                  <Input
                    id="rot-y"
                    type="number"
                    step="15"
                    value={Math.round((selectedComponent.rotation[1] * 180) / Math.PI)}
                    onChange={(e) => updateComponentRotation("y", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="rot-z" className="text-xs text-gray-500">
                    Z°
                  </Label>
                  <Input
                    id="rot-z"
                    type="number"
                    step="15"
                    value={Math.round((selectedComponent.rotation[2] * 180) / Math.PI)}
                    onChange={(e) => updateComponentRotation("z", Number.parseFloat(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Connections */}
            <div>
              <Label className="text-xs font-medium text-gray-700">{t("connections")}</Label>
              <div className="mt-1">
                {selectedComponent.connections.length === 0 ? (
                  <p className="text-xs text-gray-500">{t("clickConnectionPoints")}</p>
                ) : (
                  <div className="space-y-1">
                    {selectedComponent.connections.map((connection, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        → {connection}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Movement Instructions */}
            <div className="pt-2 border-t border-gray-200">
              <Label className="text-xs font-medium text-gray-700">{t("movementControls")}</Label>
              <div className="mt-1 space-y-1 text-xs text-gray-500">
                <p>• {t("useArrowKeys")}</p>
                <p>• {t("holdShiftFaster")}</p>
                <p>• {t("holdCtrlPrecise")}</p>
                <p>• {t("altUpDown")}</p>
              </div>
            </div>

            {/* Multi-Selection Instructions */}
            {state.selectedComponents && state.selectedComponents.length > 1 && (
              <div className="pt-2 border-t border-gray-200">
                <Label className="text-xs font-medium text-gray-700">{t("multiSelectionInstructions")}</Label>
                <div className="mt-1 space-y-1 text-xs text-gray-500">
                  <p>• {t("ctrlClickToAdd")}</p>
                  <p>• {t("dragSelectionBox")}</p>
                  <p>• {t("arrowKeysMove")}</p>
                  <p>• {t("shiftArrowFast")}</p>
                  <p>• {t("ctrlArrowPrecise")}</p>
                  <p>• {t("deleteKey")}</p>
                  <p>• {t("escapeKey")}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
