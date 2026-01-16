export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const getApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not set")
  }
  return apiBaseUrl.replace(/\/$/, "")
}
