class FileProcessor {
  static async processRarFile(file: File): Promise<{ name: string; data: ArrayBuffer }[]> {
    const fileName = file.name.toLowerCase()
    console.log(`FileProcessor: Processing file ${file.name} (${file.type || "no MIME type"})`)

    // Handle direct 3D model files
    if (
      fileName.endsWith(".obj") ||
      fileName.endsWith(".igs") ||
      fileName.endsWith(".iges") ||
      fileName.endsWith(".step") ||
      fileName.endsWith(".stp")
    ) {
      console.log(`FileProcessor: Processing as 3D model file`)
      const arrayBuffer = await file.arrayBuffer()
      return [
        {
          name: file.name,
          data: arrayBuffer,
        },
      ]
    }

    // Handle archive files (.rar, .zip)
    if (fileName.endsWith(".rar") || fileName.endsWith(".zip")) {
      console.log(`FileProcessor: Processing as archive file`)
      // Existing archive processing logic
      const arrayBuffer = await file.arrayBuffer()
      // For now, return the archive as-is (would need proper extraction library)
      return [
        {
          name: file.name,
          data: arrayBuffer,
        },
      ]
    }

    throw new Error(`Unsupported file type: ${file.name}`)
  }

  static validateFile(file: File): boolean {
    const allowedExtensions = [".obj", ".igs", ".iges", ".step", ".stp", ".rar", ".zip"]
    const fileName = file.name.toLowerCase()
    const isValid = allowedExtensions.some((ext) => fileName.endsWith(ext))

    console.log(`FileProcessor: Validating ${file.name} - ${isValid ? "VALID" : "INVALID"}`)
    return isValid
  }

  // Get MIME types for file input accept attribute
  static getAcceptedMimeTypes(): string {
    return [
      ".obj",
      ".igs",
      ".iges",
      ".step",
      ".stp",
      ".rar",
      ".zip",
      // Add MIME types for better browser support
      "application/zip",
      "application/x-rar-compressed",
      "application/octet-stream",
      "text/plain", // .obj files are often detected as text/plain
      "*/*", // Accept all to avoid browser limitations
    ].join(",")
  }
}

export { FileProcessor }
