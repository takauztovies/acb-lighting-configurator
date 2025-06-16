"use client"

export function InspirationCarousel() {
  return (
    <div className="w-full">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <div className="flex-shrink-0 w-64 bg-white rounded-lg border border-gray-200 p-4">
          <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
          <h4 className="font-medium text-gray-900">Modern Living Room</h4>
          <p className="text-sm text-gray-500">Contemporary lighting setup</p>
        </div>
        <div className="flex-shrink-0 w-64 bg-white rounded-lg border border-gray-200 p-4">
          <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
          <h4 className="font-medium text-gray-900">Industrial Kitchen</h4>
          <p className="text-sm text-gray-500">Track lighting system</p>
        </div>
        <div className="flex-shrink-0 w-64 bg-white rounded-lg border border-gray-200 p-4">
          <div className="aspect-video bg-gray-100 rounded-lg mb-3"></div>
          <h4 className="font-medium text-gray-900">Cozy Bedroom</h4>
          <p className="text-sm text-gray-500">Ambient lighting</p>
        </div>
      </div>
    </div>
  )
}
