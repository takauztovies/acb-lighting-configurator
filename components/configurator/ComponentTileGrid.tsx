import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export interface ComponentTile {
  id: string
  name: string
  image?: string
  price: number
  type?: string
  extra?: React.ReactNode
}

interface ComponentTileGridProps {
  components: ComponentTile[]
  onSelect: (component: ComponentTile) => void
  buttonLabel?: string
  buttonRender?: (component: ComponentTile) => React.ReactNode
  tileClassName?: string
  showAddButton?: boolean
}

export const ComponentTileGrid: React.FC<ComponentTileGridProps> = ({
  components,
  onSelect,
  buttonLabel = "Add",
  buttonRender,
  tileClassName = "",
  showAddButton = true,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {components.map((component) => (
        <Card
          key={component.id}
          className={`relative overflow-hidden min-w-[180px] max-w-[220px] h-56 flex flex-col ${tileClassName}`}
        >
          <CardContent className="flex flex-col flex-1 justify-between items-center text-center p-4 space-y-3 h-full">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={component.image || "/placeholder.svg"}
                alt={component.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="text-sm font-medium break-words w-full line-clamp-2 min-h-[2.5rem]">{component.name}</div>
            <div className="text-xs text-gray-500 w-full">€{component.price.toFixed(2)}</div>
            {component.extra}
            <div className="w-full flex justify-center mt-auto pt-2">
              {showAddButton && (buttonRender ? (
                buttonRender(component)
              ) : (
                <Badge 
                  variant="secondary"
                  className="inline-flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-blue-200 transition-colors w-full max-w-[120px] justify-center"
                  onClick={() => onSelect(component)}
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs truncate">{buttonLabel}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 