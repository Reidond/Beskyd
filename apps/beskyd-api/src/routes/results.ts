import { Elysia, t } from "elysia"

import { getSession } from "../auth"
import { createDb } from "../db"
import { getEnv } from "../env"
import { type AuthUser, isRoleAllowed, resolveRole } from "../rbac"
import { insertAuditLog, loadLatestRiskResult } from "../repository"

const resultRoles = ["viewer", "decision-maker", "analyst"] as const

export const resultsRoutes = new Elysia({ prefix: "/v1/results" }).get(
  "/region-risk",
  async ({ query, request, set }) => {
    const session = await getSession(request)
    const user = session?.user as AuthUser | undefined

    if (!session || !user) {
      set.status = 401
      return { error: "Unauthorized" }
    }

    const role = resolveRole(user)
    if (!isRoleAllowed(role, resultRoles)) {
      set.status = 403
      return { error: "Forbidden" }
    }

    const env = getEnv()
    const db = createDb(env.DB)
    const latest = await loadLatestRiskResult(db, query.regionId)

    if (!latest) {
      set.status = 404
      return { error: "No risk result found." }
    }

    await insertAuditLog(db, {
      actorUserId: user.id,
      action: "result.read",
      resource: "risk_results",
      resourceId: query.regionId,
    })

    return {
      regionId: query.regionId,
      configVersion: latest.configVersion,
      computedAt: latest.computedAt,
      result: latest.result,
    }
  },
  {
    query: t.Object({
      regionId: t.String(),
    }),
  },
)
