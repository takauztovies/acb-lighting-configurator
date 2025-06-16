"use client"

import { createContext, useContext, type ReactNode } from "react"

interface TranslationContextType {
  t: (key: string) => string
  language: string
  setLanguage: (lang: string) => void
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const translations = {
  en: {
    "app.title": "ACB Lighting Configurator",
    "app.loading": "Loading...",
    "app.error": "Error occurred",
    // Main UI
    easyLinkConfigurator: "Easy Link Configurator",
    admin: "Admin",
    debug: "Debug",
    components: "Components",
    presets: "Presets",
    scene: "Scene",

    // Component Types
    track: "Track Rails",
    spotlight: "Spotlights",
    connector: "Connectors",
    "power-supply": "Power Supplies",
    bundle: "Component Bundles",

    // Preset Management
    presetConfigurations: "Preset Configurations",
    noPresetsAvailable: "No presets available",
    createPreset: "Create Preset",
    presetDescription: "Manage pre-configured lighting setups for customers",

    // Scene Management
    sceneBackground: "Scene Background",
    uploadSceneImage: "Upload Scene Image",
    "2dView": "2D View",
    "3dView": "3D View",
    "2dViewPlaceholder": "2D View",
    "2dViewDescription": "Top-down view of your lighting configuration",

    // Configuration
    totalComponents: "Total Components",
    totalPrice: "Total Price",
    currentConfiguration: "Current Configuration",
    noComponentsAdded: "No components added yet",
    total: "Total",
    addToCart: "Add to Cart",

    // Admin Panel
    adminPanel: "Admin Panel",
    close: "Close",
    bundles: "Bundles",
    import: "Import",
    componentManagement: "Component Management",
    addComponent: "Add Component",
    addNewComponent: "Add New Component",

    // Component Properties
    componentName: "Component Name",
    enterComponentName: "Enter component name",
    componentType: "Component Type",
    enterComponentType: "Enter component type",
    price: "Price",
    componentImage: "Component Image",
    "3dModel": "3D Model",
    saveComponent: "Save Component",
    name: "Name",
    type: "Type",
    actions: "Actions",

    // Bundle Configuration
    bundleConfiguration: "Bundle Configuration",
    bundleDescription: "Configure component bundles and required combinations",
    bundleName: "Bundle Name",
    discount: "Discount",

    // Data Import
    dataImport: "Data Import",
    uploadExcelFile: "Upload Excel File",
    excelFormatDescription: "Excel file should contain columns: Name, Type, Price, Image URL, 3D Model URL",
    processImport: "Process Import",
    downloadTemplate: "Download Template",
    fileSelected: "File selected",

    // Component Properties Panel
    componentProperties: "Component Properties",
    selectComponentToEdit: "Select a component to edit its properties",
    noComponentSelected: "No component selected",
    position: "Position",
    rotation: "Rotation",
    connections: "Connections",

    // Interaction Instructions
    dragToMove: "Drag to move",
    shiftDragToRotate: "Shift + Drag to rotate",
    clickConnectionPoints: "Click red dots to connect components",

    // Modes
    selectMode: "Select",
    moveMode: "Move",
    rotateMode: "Rotate",
    snapToGrid: "Snap to Grid",
    transformControls: "Transform Controls",
    clickConnectionPoint: "Click another connection point to complete",

    // Camera Controls
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    panView: "Pan View",
    resetView: "Reset View",

    // Actions
    save: "Save",
    share: "Share",
    export: "Export",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",

    // Labels and Display
    showLabels: "Show Labels",
    hideLabels: "Hide Labels",
    toggleLabels: "Toggle Labels",

    // Multi-selection
    multiSelection: "Multi-Selection",
    groupActions: "Group Actions",
    deleteAll: "Delete All",
    clearSelection: "Clear Selection",
    groupMovement: "Group Movement",

    // Instructions
    multiSelectionInstructions: "Multi-Selection Instructions",
    ctrlClickToAdd: "Ctrl+Click: Add/remove components from selection",
    dragSelectionBox: "Drag Selection Box: Click and drag on empty space to select multiple",
    arrowKeysMove: "Arrow Keys: Move all selected components together",
    shiftArrowFast: "Shift+Arrow: Fast group movement",
    ctrlArrowPrecise: "Ctrl+Arrow: Precise group movement",
    deleteKey: "Delete: Remove all selected components",
    escapeKey: "Escape: Clear selection",

    // Movement Controls
    movementControls: "Movement Controls",
    useArrowKeys: "Use arrow keys to move component",
    holdShiftFaster: "Hold Shift for faster movement",
    holdCtrlPrecise: "Hold Ctrl for precise movement",
    altUpDown: "Alt + Up/Down for vertical movement",
    cmdClickMac: "Cmd+Click on Mac (Ctrl+Click on PC) to multi-select",

    // File Upload
    uploadFiles: "Upload Files",
    dragDropFiles: "Drag and drop files here or click to browse",
    supportedFormats: "Supported formats",
    fileProcessing: "File Processing",

    // Error Messages
    errorLoadingComponents: "Error Loading Components",
    retryLoading: "Retry Loading",
    noComponentsAvailable: "No components available",
    addComponentsInAdmin: "Add components in the Admin Panel to see them here",
    refreshComponents: "Refresh Components",

    // Status Messages
    componentsLoaded: "Components Loaded",
    database: "Database",
    loading: "Loading",
    ready: "Ready",
    error: "Error",

    // Localization
    locale: "en-US",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  es: {
    "app.title": "Configurador de Iluminación ACB",
    "app.loading": "Cargando...",
    "app.error": "Ocurrió un error",
    // Main UI
    easyLinkConfigurator: "Configurador Easy Link",
    admin: "Administrador",
    debug: "Depuración",
    components: "Componentes",
    presets: "Preajustes",
    scene: "Escena",

    // Component Types
    track: "Rieles de Pista",
    spotlight: "Focos",
    connector: "Conectores",
    "power-supply": "Fuentes de Alimentación",
    bundle: "Paquetes de Componentes",

    // Configuration
    totalComponents: "Componentes Totales",
    totalPrice: "Precio Total",
    currentConfiguration: "Configuración Actual",
    noComponentsAdded: "Aún no se han añadido componentes",
    total: "Total",
    addToCart: "Añadir al Carrito",

    // Component Properties Panel
    componentProperties: "Propiedades del Componente",
    selectComponentToEdit: "Seleccione un componente para editar sus propiedades",
    noComponentSelected: "Ningún componente seleccionado",
    position: "Posición",
    rotation: "Rotación",
    connections: "Conexiones",

    // View modes
    "2dView": "Vista 2D",
    "3dView": "Vista 3D",

    // Actions
    save: "Guardar",
    share: "Compartir",
    export: "Exportar",

    // Error Messages
    noComponentsAvailable: "No hay componentes disponibles",
    addComponentsInAdmin: "Añada componentes en el Panel de Administración para verlos aquí",
    refreshComponents: "Actualizar Componentes",

    // Localization
    locale: "es-ES",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  fr: {
    // Main UI
    easyLinkConfigurator: "Configurateur Easy Link",
    admin: "Administrateur",
    debug: "Débogage",
    components: "Composants",
    presets: "Préréglages",
    scene: "Scène",

    // Component Types
    track: "Rails de Piste",
    spotlight: "Projecteurs",
    connector: "Connecteurs",
    "power-supply": "Alimentations",
    bundle: "Paquets de Composants",

    // Configuration
    totalComponents: "Composants Totaux",
    totalPrice: "Prix Total",
    currentConfiguration: "Configuration Actuelle",
    noComponentsAdded: "Aucun composant ajouté pour le moment",
    total: "Total",
    addToCart: "Ajouter au Panier",

    // Component Properties Panel
    componentProperties: "Propriétés du Composant",
    selectComponentToEdit: "Sélectionnez un composant pour modifier ses propriétés",
    noComponentSelected: "Aucun composant sélectionné",
    position: "Position",
    rotation: "Rotation",
    connections: "Connexions",

    // View modes
    "2dView": "Vue 2D",
    "3dView": "Vue 3D",

    // Actions
    save: "Enregistrer",
    share: "Partager",
    export: "Exporter",

    // Localization
    locale: "fr-FR",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  it: {
    easyLinkConfigurator: "Configuratore Easy Link",
    admin: "Amministratore",
    debug: "Debug",
    "2dView": "Vista 2D",
    "3dView": "Vista 3D",
    currentConfiguration: "Configurazione Attuale",
    noComponentsAdded: "Nessun componente aggiunto",
    componentProperties: "Proprietà del Componente",
    noComponentSelected: "Nessun componente selezionato",
    locale: "it-IT",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  de: {
    easyLinkConfigurator: "Easy Link Konfigurator",
    admin: "Administrator",
    debug: "Debug",
    "2dView": "2D-Ansicht",
    "3dView": "3D-Ansicht",
    currentConfiguration: "Aktuelle Konfiguration",
    noComponentsAdded: "Noch keine Komponenten hinzugefügt",
    componentProperties: "Komponenten-Eigenschaften",
    noComponentSelected: "Keine Komponente ausgewählt",
    locale: "de-DE",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  cs: {
    easyLinkConfigurator: "Easy Link Konfigurátor",
    admin: "Administrátor",
    debug: "Debug",
    "2dView": "2D Pohled",
    "3dView": "3D Pohled",
    currentConfiguration: "Aktuální Konfigurace",
    noComponentsAdded: "Žádné komponenty nebyly přidány",
    componentProperties: "Vlastnosti Komponenty",
    noComponentSelected: "Žádná komponenta není vybrána",
    locale: "cs-CZ",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
  sk: {
    easyLinkConfigurator: "Easy Link Konfigurátor",
    admin: "Administrátor",
    debug: "Debug",
    "2dView": "2D Pohľad",
    "3dView": "3D Pohľad",
    currentConfiguration: "Aktuálna Konfigurácia",
    noComponentsAdded: "Žiadne komponenty neboli pridané",
    componentProperties: "Vlastnosti Komponenty",
    noComponentSelected: "Žiadny komponent nie je vybraný",
    locale: "sk-SK",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const t = (key: string) => {
    return translations.en[key] || key
  }

  const contextValue: TranslationContextType = {
    t,
    language: "en",
    setLanguage: () => {},
  }

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
