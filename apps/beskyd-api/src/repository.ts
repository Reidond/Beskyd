import type {
  ExpertRegionAssessment,
  ParticipantAssessment,
  RegionRiskResult,
  RiskModelConfig,
} from "beskyd"
import type { Kysely } from "kysely"

import type { Database } from "./db"
import { parseJson, serializeJson } from "./serialization"

const timestamp = () => new Date().toISOString()

const createId = () => crypto.randomUUID()

export const ensureRegion = async (db: Kysely<Database>, regionId: string) => {
  const existing = await db
    .selectFrom("regions")
    .select(["id"])
    .where("id", "=", regionId)
    .executeTakeFirst()

  if (existing) {
    return
  }

  const now = timestamp()

  await db
    .insertInto("regions")
    .values({
      id: regionId,
      name: regionId,
      metadata_json: null,
      created_at: now,
      updated_at: now,
    })
    .execute()
}

export const insertParticipants = async (
  db: Kysely<Database>,
  participants: ParticipantAssessment[],
) => {
  const now = timestamp()
  const rows = participants.map((participant) => ({
    id: createId(),
    region_id: participant.regionId,
    participant_id: participant.participantId,
    criteria_json: serializeJson(participant.criteria),
    created_at: now,
  }))

  if (rows.length === 0) {
    return
  }

  await db.insertInto("participant_assessments").values(rows).execute()
}

export const insertExperts = async (db: Kysely<Database>, experts: ExpertRegionAssessment[]) => {
  const now = timestamp()
  const rows = experts.map((expert) => ({
    id: createId(),
    region_id: expert.regionId,
    safety_level: expert.safetyLevel,
    created_at: now,
  }))

  if (rows.length === 0) {
    return
  }

  await db.insertInto("expert_assessments").values(rows).execute()
}

export const loadParticipantsByRegion = async (
  db: Kysely<Database>,
  regionIds: string[],
): Promise<ParticipantAssessment[]> => {
  if (regionIds.length === 0) {
    return []
  }

  const rows = await db
    .selectFrom("participant_assessments")
    .select(["participant_id", "region_id", "criteria_json"])
    .where("region_id", "in", regionIds)
    .execute()

  return rows.map((row) => ({
    participantId: row.participant_id,
    regionId: row.region_id,
    criteria: parseJson(row.criteria_json, `criteria for ${row.participant_id}`),
  }))
}

export const loadLatestExpertsByRegion = async (
  db: Kysely<Database>,
  regionIds: string[],
): Promise<ExpertRegionAssessment[]> => {
  if (regionIds.length === 0) {
    return []
  }

  const rows = await db
    .selectFrom("expert_assessments")
    .select(["region_id", "safety_level", "created_at"])
    .where("region_id", "in", regionIds)
    .orderBy("created_at", "desc")
    .execute()

  const seen = new Set<string>()
  const results: ExpertRegionAssessment[] = []

  for (const row of rows) {
    if (seen.has(row.region_id)) {
      continue
    }
    seen.add(row.region_id)
    results.push({
      regionId: row.region_id,
      safetyLevel: row.safety_level as ExpertRegionAssessment["safetyLevel"],
    })
  }

  return results
}

export const loadActiveConfig = async (
  db: Kysely<Database>,
): Promise<{ id: string; version: number; config: RiskModelConfig } | null> => {
  const row = await db
    .selectFrom("model_configs")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("version", "desc")
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    version: row.version,
    config: parseJson(row.config_json, "risk model config"),
  }
}

export const loadConfigByVersion = async (
  db: Kysely<Database>,
  version: number,
): Promise<{ id: string; version: number; config: RiskModelConfig } | null> => {
  const row = await db
    .selectFrom("model_configs")
    .selectAll()
    .where("version", "=", version)
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return {
    id: row.id,
    version: row.version,
    config: parseJson(row.config_json, "risk model config"),
  }
}

export const saveConfig = async (
  db: Kysely<Database>,
  config: RiskModelConfig,
  actorUserId: string | null,
) => {
  const latest = await db
    .selectFrom("model_configs")
    .select(["version"])
    .orderBy("version", "desc")
    .executeTakeFirst()

  const nextVersion = (latest?.version ?? 0) + 1
  const now = timestamp()
  const id = createId()

  await db.updateTable("model_configs").set({ is_active: 0 }).execute()

  await db
    .insertInto("model_configs")
    .values({
      id,
      version: nextVersion,
      config_json: serializeJson(config),
      created_by: actorUserId,
      created_at: now,
      is_active: 1,
    })
    .execute()

  return {
    id,
    version: nextVersion,
    createdAt: now,
  }
}

export const storeRiskResults = async (
  db: Kysely<Database>,
  results: RegionRiskResult[],
  configVersion: number,
  actorUserId: string | null,
) => {
  if (results.length === 0) {
    return
  }

  const now = timestamp()
  const rows = results.map((result) => ({
    id: createId(),
    region_id: result.regionId,
    config_version: configVersion,
    result_json: serializeJson(result),
    computed_at: now,
    created_by: actorUserId,
  }))

  await db.insertInto("risk_results").values(rows).execute()
}

export const loadLatestRiskResult = async (
  db: Kysely<Database>,
  regionId: string,
): Promise<{ result: RegionRiskResult; computedAt: string; configVersion: number } | null> => {
  const row = await db
    .selectFrom("risk_results")
    .selectAll()
    .where("region_id", "=", regionId)
    .orderBy("computed_at", "desc")
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return {
    result: parseJson(row.result_json, `risk result for ${regionId}`),
    computedAt: row.computed_at,
    configVersion: row.config_version,
  }
}

export const insertAuditLog = async (
  db: Kysely<Database>,
  params: {
    actorUserId: string | null
    action: string
    resource: string
    resourceId?: string | null
    diff?: unknown
  },
) => {
  await db
    .insertInto("audit_log")
    .values({
      id: createId(),
      actor_user_id: params.actorUserId,
      action: params.action,
      resource: params.resource,
      resource_id: params.resourceId ?? null,
      diff_json: params.diff ? serializeJson(params.diff) : null,
      created_at: timestamp(),
    })
    .execute()
}
