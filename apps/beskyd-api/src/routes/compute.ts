import { computeRegionRisk, type RegionRiskResult } from "beskyd"
import { Elysia } from "elysia"

import { getSession } from "../auth"
import { createDb } from "../db"
import { getEnv } from "../env"
import { type AuthUser, isRoleAllowed, resolveRole } from "../rbac"
import {
  loadActiveConfig,
  loadConfigByVersion,
  loadLatestExpertsByRegion,
  loadParticipantsByRegion,
  storeRiskResults,
} from "../repository"
import { computeRequestSchema } from "../schemas"

const computeRoles = ["analyst", "decision-maker"] as const

const resolveRegionIds = async (db: ReturnType<typeof createDb>, bodyRegionIds?: string[]) => {
  if (bodyRegionIds && bodyRegionIds.length > 0) {
    return bodyRegionIds
  }

  const rows = await db
    .selectFrom("participant_assessments")
    .select("region_id")
    .distinct()
    .execute()

  return rows.map((row) => row.region_id)
}

export const computeRoutes = new Elysia({ prefix: "/v1/compute" }).post(
  "/region-risk",
  async ({ body, request, set }) => {
    const session = await getSession(request)
    const user = session?.user as AuthUser | undefined

    if (!session || !user) {
      set.status = 401
      return { error: "Unauthorized" }
    }

    const role = resolveRole(user)
    if (!isRoleAllowed(role, computeRoles)) {
      set.status = 403
      return { error: "Forbidden" }
    }

    const env = getEnv()
    const db = createDb(env.DB)
    const regionIds = await resolveRegionIds(db, body.regionIds)

    if (regionIds.length === 0) {
      set.status = 400
      return { error: "No regions found for computation." }
    }

    const configRecord = body.configVersion
      ? await loadConfigByVersion(db, body.configVersion)
      : await loadActiveConfig(db)

    if (!configRecord) {
      set.status = 409
      return { error: "Risk model configuration is not set." }
    }

    const missingRepeatVisit = regionIds.filter(
      (regionId) => body.repeatVisitByRegion[regionId] === undefined,
    )

    if (missingRepeatVisit.length > 0) {
      set.status = 400
      return {
        error: "Missing repeat-visit values.",
        regions: missingRepeatVisit,
      }
    }

    const participants = await loadParticipantsByRegion(db, regionIds)
    const experts = await loadLatestExpertsByRegion(db, regionIds)

    let results: RegionRiskResult[]

    try {
      results = computeRegionRisk({
        config: configRecord.config,
        participants,
        experts,
        repeatVisitByRegion: body.repeatVisitByRegion,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Computation failed."
      set.status = 400
      return { error: message }
    }

    await storeRiskResults(db, results, configRecord.version, user.id)

    return {
      configVersion: configRecord.version,
      results,
    }
  },
  {
    body: computeRequestSchema,
  },
)
