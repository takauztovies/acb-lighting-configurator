"use client"

export function ConfiguratorFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">© 2024 ACB Lighting. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <button className="text-sm text-gray-500 hover:text-gray-700">Help</button>
          <button className="text-sm text-gray-500 hover:text-gray-700">Support</button>
        </div>
      </div>
    </footer>
  )
}
