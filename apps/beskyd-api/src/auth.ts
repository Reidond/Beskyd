import { betterAuth } from "better-auth"
import { D1Dialect } from "kysely-d1"

import { getEnv } from "./env"
import type { UserRole } from "./rbac"

const roleValues: UserRole[] = ["decision-maker", "analyst", "expert", "data-operator", "viewer"]

const parseTrustedOrigins = (value?: string): string[] => {
  if (!value) {
    return []
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

let cachedAuth: ReturnType<typeof betterAuth> | null = null

export const getAuth = () => {
  if (cachedAuth) {
    return cachedAuth
  }

  const env = getEnv()
  const trustedOrigins = parseTrustedOrigins(env.TRUSTED_ORIGINS)

  if (trustedOrigins.length === 0) {
    trustedOrigins.push(env.BETTER_AUTH_URL)
  }

  cachedAuth = betterAuth({
    appName: "beskyd",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins,
    database: {
      type: "sqlite",
      dialect: new D1Dialect({ database: env.DB }),
    },
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: roleValues,
          required: false,
          defaultValue: "viewer",
          input: false,
        },
      },
    },
  })

  return cachedAuth
}

export const getSession = (request: Request) => {
  const auth = getAuth()
  return auth.api.getSession({ headers: request.headers })
}
