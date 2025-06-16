"use client"

import { MousePointer, Move, RotateCw, Ruler } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface InteractionToolbarProps {
  mode: "select" | "move" | "rotate" | "measure"
  onModeChange: (mode: "select" | "move" | "rotate" | "measure") => void
  snapToGrid: boolean
  onSnapToggle: () => void
}

export function InteractionToolbar({ mode, onModeChange, snapToGrid, onSnapToggle }: InteractionToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      <ToggleGroup type="single" value={mode} onValueChange={(value) => value && onModeChange(value as any)}>
        <ToggleGroupItem value="select" aria-label="Select mode" title="Select Mode">
          <MousePointer className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="move" aria-label="Move mode" title="Move Mode">
          <Move className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="rotate" aria-label="Rotate mode" title="Rotate Mode">
          <RotateCw className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="measure" aria-label="Measure mode" title="Measure Mode">
          <Ruler className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="text-xs font-medium text-gray-700 ml-2">{mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</div>
    </div>
  )
}
