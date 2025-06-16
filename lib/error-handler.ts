export class ErrorHandler {
  static init() {
    console.log("Error handler init")
  }

  static logAppError(error: any, context: string) {
    console.error("App error:", context, error)
  }
}
