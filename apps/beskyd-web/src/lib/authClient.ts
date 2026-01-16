import { createAuthClient } from "better-auth/react"
import { getApiBaseUrl } from "./env"

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
})
