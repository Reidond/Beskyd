import type { ExpertRegionAssessment, ParticipantAssessment } from "beskyd"
import { Elysia, t } from "elysia"

import { getSession } from "../auth"
import { createDb } from "../db"
import { getEnv } from "../env"
import { type AuthUser, isRoleAllowed, resolveRole } from "../rbac"
import { ensureRegion, insertExperts, insertParticipants } from "../repository"
import { expertAssessmentSchema, participantAssessmentSchema } from "../schemas"

const participantRoles = ["data-operator", "analyst"] as const
const expertRoles = ["expert", "analyst"] as const

export const assessmentsRoutes = new Elysia({ prefix: "/v1/assessments" })
  .post(
    "/participants",
    async ({ body, request, set }) => {
      const session = await getSession(request)
      const user = session?.user as AuthUser | undefined

      if (!session || !user) {
        set.status = 401
        return { error: "Unauthorized" }
      }

      const role = resolveRole(user)
      if (!isRoleAllowed(role, participantRoles)) {
        set.status = 403
        return { error: "Forbidden" }
      }

      const env = getEnv()
      const db = createDb(env.DB)
      const participants = body as ParticipantAssessment[]
      const regionIds = new Set(participants.map((participant) => participant.regionId))

      for (const regionId of regionIds) {
        await ensureRegion(db, regionId)
      }

      await insertParticipants(db, participants)

      return { inserted: participants.length }
    },
    {
      body: t.Array(participantAssessmentSchema),
    },
  )
  .post(
    "/experts",
    async ({ body, request, set }) => {
      const session = await getSession(request)
      const user = session?.user as AuthUser | undefined

      if (!session || !user) {
        set.status = 401
        return { error: "Unauthorized" }
      }

      const role = resolveRole(user)
      if (!isRoleAllowed(role, expertRoles)) {
        set.status = 403
        return { error: "Forbidden" }
      }

      const env = getEnv()
      const db = createDb(env.DB)
      const experts = body as ExpertRegionAssessment[]
      const regionIds = new Set(experts.map((expert) => expert.regionId))

      for (const regionId of regionIds) {
        await ensureRegion(db, regionId)
      }

      await insertExperts(db, experts)

      return { inserted: experts.length }
    },
    {
      body: t.Array(expertAssessmentSchema),
    },
  )
