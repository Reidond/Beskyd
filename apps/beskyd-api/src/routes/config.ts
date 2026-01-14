import type { RiskModelConfig } from "beskyd"
import { Elysia } from "elysia"

import { getSession } from "../auth"
import { createDb } from "../db"
import { defaultRiskModelConfig } from "../defaults"
import { getEnv } from "../env"
import { type AuthUser, isRoleAllowed, resolveRole } from "../rbac"
import { insertAuditLog, loadActiveConfig, saveConfig } from "../repository"
import { riskModelConfigSchema } from "../schemas"

const configReadRoles = ["decision-maker", "analyst"] as const
const configWriteRoles = ["analyst"] as const

export const configRoutes = new Elysia({ prefix: "/v1/config" })
  .get("/risk-model", async ({ request, set }) => {
    const session = await getSession(request)
    const user = session?.user as AuthUser | undefined

    if (!session || !user) {
      set.status = 401
      return { error: "Unauthorized" }
    }

    const role = resolveRole(user)
    if (!isRoleAllowed(role, configReadRoles)) {
      set.status = 403
      return { error: "Forbidden" }
    }

    const env = getEnv()
    const db = createDb(env.DB)
    let activeConfig = await loadActiveConfig(db)

    if (!activeConfig) {
      const seeded = await saveConfig(db, defaultRiskModelConfig, user.id)
      await insertAuditLog(db, {
        actorUserId: user.id,
        action: "config.seed",
        resource: "model_configs",
        resourceId: seeded.id,
        diff: {
          next: defaultRiskModelConfig,
        },
      })
      activeConfig = {
        id: seeded.id,
        version: seeded.version,
        config: defaultRiskModelConfig,
      }
    }

    return {
      id: activeConfig.id,
      version: activeConfig.version,
      config: activeConfig.config,
    }
  })
  .put(
    "/risk-model",
    async ({ body, request, set }) => {
      const session = await getSession(request)
      const user = session?.user as AuthUser | undefined

      if (!session || !user) {
        set.status = 401
        return { error: "Unauthorized" }
      }

      const role = resolveRole(user)
      if (!isRoleAllowed(role, configWriteRoles)) {
        set.status = 403
        return { error: "Forbidden" }
      }

      const env = getEnv()
      const db = createDb(env.DB)
      const previousConfig = await loadActiveConfig(db)
      const nextConfig = body as RiskModelConfig
      const saved = await saveConfig(db, nextConfig, user.id)

      await insertAuditLog(db, {
        actorUserId: user.id,
        action: "config.update",
        resource: "model_configs",
        resourceId: saved.id,
        diff: {
          previous: previousConfig?.config ?? null,
          next: nextConfig,
        },
      })

      return {
        id: saved.id,
        version: saved.version,
        config: nextConfig,
      }
    },
    {
      body: riskModelConfigSchema,
    },
  )
