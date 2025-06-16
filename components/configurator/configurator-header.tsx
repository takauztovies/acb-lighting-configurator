"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Globe, ShoppingCart, RotateCcw } from "lucide-react"
import { useConfigurator } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import Image from "next/image"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "sk", name: "Slovenčina", flag: "🇸🇰" },
]

interface ConfiguratorHeaderProps {
  onAdminClick: () => void
  showAdminButton: boolean
  onStartOver?: () => void
}

export function ConfiguratorHeader({ onAdminClick, showAdminButton, onStartOver }: ConfiguratorHeaderProps) {
  const { state, dispatch } = useConfigurator()
  const { t, selectedLanguage, setSelectedLanguage } = useTranslation()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    dispatch({ type: "SET_LANGUAGE", language: languageCode })
    setShowLanguageMenu(false)
  }

  const handleAdminClick = () => {
    console.log("🔧 Header: Admin button clicked!")
    onAdminClick()
  }

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(t("locale"), {
        style: "currency",
        currency: t("currencyCode"),
      }).format(amount)
    } catch (error) {
      return `${t("currencySymbol")}${amount.toFixed(2)}`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* New SVG Logo */}
            <div className="h-10 w-auto">
              <Image
                src="/images/logo-negro.svg"
                alt="ACB Lighting"
                width={52}
                height={46}
                priority
                className="h-full w-auto"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{t("easyLinkConfigurator")}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">{currentLanguage.flag}</span>
              <span className="text-sm">{currentLanguage.name}</span>
            </Button>

            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                      language.code === selectedLanguage ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start Over Button */}
          {onStartOver && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartOver}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          )}

          {/* Cart Summary */}
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{formatCurrency(state.currentConfig.totalPrice)}</span>
          </div>

          {/* Admin Panel Toggle - Always visible for debugging */}
          {showAdminButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdminClick}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("admin")} ({t("debug")})
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
