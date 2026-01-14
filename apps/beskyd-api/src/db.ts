import type { D1Database } from "@cloudflare/workers-types"
import { Kysely } from "kysely"
import { D1Dialect } from "kysely-d1"

export interface RegionsTable {
  id: string
  name: string
  metadata_json: string | null
  created_at: string
  updated_at: string
}

export interface ParticipantAssessmentsTable {
  id: string
  region_id: string
  participant_id: string
  criteria_json: string
  created_at: string
}

export interface ExpertAssessmentsTable {
  id: string
  region_id: string
  safety_level: string
  created_at: string
}

export interface ModelConfigsTable {
  id: string
  version: number
  config_json: string
  created_by: string | null
  created_at: string
  is_active: number
}

export interface RiskResultsTable {
  id: string
  region_id: string
  config_version: number
  result_json: string
  computed_at: string
  created_by: string | null
}

export interface AuditLogTable {
  id: string
  actor_user_id: string | null
  action: string
  resource: string
  resource_id: string | null
  diff_json: string | null
  created_at: string
}

export interface Database {
  regions: RegionsTable
  participant_assessments: ParticipantAssessmentsTable
  expert_assessments: ExpertAssessmentsTable
  model_configs: ModelConfigsTable
  risk_results: RiskResultsTable
  audit_log: AuditLogTable
}

export const createDb = (database: D1Database) =>
  new Kysely<Database>({
    dialect: new D1Dialect({ database }),
  })
