import { env as workerEnv } from "cloudflare:workers"
import type { D1Database } from "@cloudflare/workers-types"

export interface Env {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  TRUSTED_ORIGINS?: string
}

export const getEnv = (): Env => workerEnv as Env
