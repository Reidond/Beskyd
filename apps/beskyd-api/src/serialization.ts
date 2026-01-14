export const serializeJson = (value: unknown): string => JSON.stringify(value)

export const parseJson = <T>(value: string, label: string): T => {
  try {
    return JSON.parse(value) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Failed to parse ${label}: ${message}`)
  }
}
