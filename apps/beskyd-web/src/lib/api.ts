import { getApiBaseUrl } from "./env"

export interface ApiError {
  status: number
  message: string
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const data = (await response.json()) as { error?: string }
      message = data.error ?? message
    } catch (error) {
      if (error instanceof Error && error.message) {
        message = error.message
      }
    }
    throw { status: response.status, message } as ApiError
  }

  return (await response.json()) as T
}
