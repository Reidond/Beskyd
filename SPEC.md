# SPEC.md — beskyd (Tourist Trip Safety Risk Intelligence Platform)

Status: Draft (v0.2)  
Last updated: 2026-01-13

## Change log

- **v0.2 (2026-01-13)**
  - Project family renamed to **beskyd** (lowercase):
    - core library: `beskyd`
    - backend service: `beskyd-api`
    - frontend app: `beskyd-web`
  - Incorporated dissertation **Chapter 5** system requirements + architecture into the software plan:
    - “data collection → processing → analysis (PSU) → recommendations (decision interpreter)”
    - internal bases: DB (structured data), KB (knowledge base), MB (model base)
  - Extended non-functional requirements (integration, cloud scalability, security, transparency).
  - Added Phase 1 test-fixture constraints reflecting the dissertation verification dataset shape (synthetic/anonymized).

- **v0.1 (2026-01-12)**
  - Initial spec focusing on the Phase 1 core model library.

## 0. Document purpose

This file is the **single source of truth** for the engineering plan of the software implementation behind the dissertation topic:

> **“Intellectual-Analytical Platform for Assessing the Security Risk of a Tourist Trip”**

It defines:

- **What** is being built (product + scope)
- **How** it is built (stack, architecture boundaries, and artifacts)
- **How** success is measured (acceptance criteria, tests, and quality gates)

This spec is structured in **three phases** (unchanged):

1. **Phase 1 (MVP):** project setup + best-practices **Bun** library with the core algorithm and tests
2. **Phase 2:** backend service (**Elysia**) with persistence and orchestration
3. **Phase 3:** web frontend (**Vite + React**) with dashboards and decision-support UX

## 1. Product definition

### 1.1 Problem statement

Tourism decision making (for tourists, businesses, and public administration) is often executed under uncertainty and incomplete information.

**beskyd** addresses the specific problem of **quantifying and explaining the security risk** of a tourist trip to a given region using:

- subjective assessments from participants/tourists
- predicted repeat-visit intention
- expert assessment of regional tourism-system safety

The dissertation’s **Chapter 5** generalizes this into an information-analytical decision support system for the **digital transformation of tourism**, where the safety-risk platform is one analytical module inside a larger pipeline.

### 1.2 Users and roles

The dissertation uses the concept of decision makers (ОПР). For implementation we standardize roles:

- **Decision Maker (DM / ОПР):** consumes risk outputs and recommendations to support decisions.
- **System Analyst:** configures model parameters (membership functions, thresholds, weights), audits results.
- **Expert:** provides expert regional safety evaluations and/or validates model results.
- **Data Operator:** enters/imports survey and expert data.
- **Viewer (public/tourist):** reads region-level risk labels/indices (Phase 3 optional depending on thesis scope).

Role support is implemented in Phase 2/3.

### 1.3 Outputs

For each region (and/or set of regions) the platform outputs:

- **riskIndex**: normalized quantitative risk indicator in **[0, 1]**
- **riskLabel**: linguistic classification (`very_low`, `low`, `medium`, `high`, `very_high`)
- **diagnostics/explanations**: intermediate values and rule activations to support transparency

### 1.4 In-scope vs out-of-scope

**In scope for MVP (Phase 1–3)**

- The **security risk** model described in the dissertation’s safety-risk chapter
- A modular system design compatible with Chapter 5’s decision-support architecture

**Out of scope for MVP** (may be future work)

- Destination attractiveness / destination choice AI
- Accommodation satisfaction forecasting
- HR-impact model

These additional models are referenced in Chapter 5 as part of the broader tourism digital-transformation DSS, but are not required for the MVP unless explicitly requested later.

## 2. Scope and phases

### 2.1 Phase 1 (MVP): project setup + core library

Deliverables:

- A clean, modern **Bun workspace** repository
- A best-practices **TypeScript** library package: `packages/beskyd`
- Implements the core **fuzzy/multi-level** safety-risk model
- Thorough tests (unit + invariants + golden fixtures)

Constraints:

- No web UI
- No database
- No HTTP
- No runtime configuration storage

### 2.2 Phase 2: backend API + persistence + orchestration

Deliverables:

- `apps/beskyd-api` (Elysia)
- Persist inputs/outputs/config
- Expose stable HTTP API for computations and retrieval
- Auth + role-based access control
- Audit logs for configuration changes

### 2.3 Phase 3: frontend web UI

Deliverables:

- `apps/beskyd-web` (Vite + React)
- Data entry + import flows
- Dashboards for region risk and intermediate metrics
- Decision-support UI (“decision interpreter” experience)

## 3. Architecture boundaries and core concepts

### 3.1 Determinism and purity

The core library must be:

- deterministic
- side-effect free
- free of IO (no network/file/db)

This allows:

- reproducible scientific validation
- easier testing
- safer reuse in backend/frontend

### 3.2 Data model boundaries

We separate the system into three layers:

1. **Model base (MB):** deterministic computations + membership functions (Phase 1 library)
2. **Knowledge/config base (KB):** tunable parameters, thresholds, weights (Phase 2 stored; Phase 1 passed as input)
3. **Data base (DB):** raw and normalized survey/expert data (Phase 2)

### 3.3 Chapter 5 conceptual pipeline

Chapter 5 describes a modular information-analytical DSS for tourism digital transformation with:

- **Data collection**
- **Data processing**
- **Data analysis (PSU)** — specialized software implementing analytical models
- **Recommendations (decision interpreter)** — transforms analytical outputs into actionable guidance

Mapping to this repo:

- `packages/beskyd` implements **Model base** computations used by the “PSU”.
- `apps/beskyd-api` implements the **PSU orchestration**, storage (DB + KB), and exposes APIs.
- `apps/beskyd-web` implements the **decision interpreter UX** plus data entry and dashboards.

### 3.4 Explainability requirement

A core requirement (especially in Chapter 5) is that decision makers can understand outputs.

Implementation strategy:

- Every computation returns `diagnostics`:
  - intermediate aggregated values
  - rule/fuzzy membership activations
  - which thresholds caused the final label

Diagnostics are intended for DM/System Analyst views.

## 4. Phase 1 (MVP): project setup + core library

### 4.1 Repository layout

```
/apps
  /beskyd-api          # Phase 2 (Elysia)
  /beskyd-web          # Phase 3 (Vite + React)
/packages
  /beskyd              # Phase 1 core library
/docs
  SPEC.md
```

### 4.2 Tooling requirements

- **Bun workspaces**
- **Biome** for lint/format (single config at repo root)
- TypeScript strict mode (`"strict": true`)
- **Vitest** for tests
- `bun test` runs all tests

### 4.3 Library package

**Location:** `packages/beskyd`  
**Package name:** `beskyd`

Export goals:

- Small, stable, strongly-typed API
- Zero IO
- Pure computations

### 4.4 Library public API (proposed)

```ts
export type RegionId = string;

export type RiskLabel =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export interface RiskModelConfig {
  // Linguistic token → numeric rank (domain-specific)
  linguisticScale: Record<string, number>;

  // Label cutoffs for normalized risk index
  thresholds: {
    veryLowMax: number;
    lowMax: number;
    mediumMax: number;
    highMax: number;
  };

  // Optional weights for criteria/groups (future extension)
  weights?: Record<string, number>;
}

export interface ParticipantAssessment {
  participantId: string;
  regionId: RegionId;

  infrastructure: Record<string, string>;
  socioEcological: Record<string, string>;
  medical: Record<string, string>;

  repeatVisit: number; // normalized [0,1]
}

export interface ExpertRegionAssessment {
  regionId: RegionId;
  safetyLevel: string;
}

export interface RegionRiskResult {
  regionId: RegionId;
  riskIndex: number; // [0,1]
  riskLabel: RiskLabel;
  diagnostics: {
    sampleSize: number;
    senseOfSafety?: number;
    intermediate?: Record<string, unknown>;
  };
}

export interface ComputeRiskInput {
  config: RiskModelConfig;
  participants: ParticipantAssessment[];
  experts: ExpertRegionAssessment[];
}

export function computeRegionRisk(input: ComputeRiskInput): RegionRiskResult[];
```

Notes:

- The library should also expose **lower-level** pure helpers:
  - membership functions (triangular/trapezoidal/s-shaped, etc)
  - label mapping function
  - clamping and normalization

### 4.5 Algorithm structure (module view)

The dissertation’s safety-risk platform is structured as an information module plus analytical modules across levels.

Implementation must support the following conceptual steps:

1. **Group term evaluation** of criteria (linguistic → numeric → characteristic mapping)
2. **Individual-level** aggregation of personal safety risk
3. **Regional-level** aggregation combining generalized risk + repeat-visit intention into “sense of safety”
4. **Final risk** combining sense-of-safety with expert regional safety level

### 4.6 Testing requirements

Phase 1 tests must include:

- **Unit tests** for:
  - linguistic token mapping
  - characteristic functions
  - membership functions
  - each computation stage

- **Invariants / properties**:
  - output clamped to [0,1]
  - permutation invariance of participant list ordering
  - deterministic output

- **Golden tests**:
  - Use a synthetic dataset that mirrors the dissertation verification dataset **shape**:
    - 327 responses
    - Oct–Dec 2023
    - regions: Zakarpattia / Lviv / Ivano-Frankivsk
    - 16 thematic blocks, 320 questions
  - Do **not** store personal data.

### 4.7 Definition of done (Phase 1)

- `bun install` succeeds
- `bun run lint` (Biome) passes
- `bun test` passes
- Package builds and exports types without TS errors
- README explains configuration + usage

## 5. Phase 2 backend (beskyd-api)

### 5.1 Responsibilities

- Implements “PSU” orchestration described in Chapter 5:
  - data ingestion
  - storage (DB)
  - configuration/knowledge base (KB)
  - model execution via `packages/beskyd`
  - recommendations endpoint(s)

### 5.2 Persistence model (initial)

Recommended: PostgreSQL.

Entities:

- `regions`
- `participant_assessments`
- `expert_assessments`
- `model_configs` (versioned)
- `risk_results` (computed snapshots)
- `audit_log` (config changes)

### 5.3 API endpoints (initial)

- `POST /v1/assessments/participants`
- `POST /v1/assessments/experts`
- `POST /v1/compute/region-risk`
- `GET /v1/results/region-risk?regionId=...`
- `GET /v1/config/risk-model`
- `PUT /v1/config/risk-model` (system analyst)

### 5.4 Security

- Auth (session or JWT)
- RBAC: decision-maker, analyst, expert, data-operator, viewer
- Audit logs for config changes and sensitive data access
- TLS required
- Backups + restore

## 6. Phase 3 frontend (beskyd-web)

### 6.1 Responsibilities

- Data entry (survey + expert)
- Dashboards (risk by region)
- Decision interpreter UX:
  - show label + index
  - show explanations and intermediate metrics
  - show recommendations (actions) for decision makers

### 6.2 Stack details

- Vite + React
- TanStack Router / Query / Form
- zustand state
- tailwindcss + shadcn/ui

### 6.3 UX pages (initial)

- `/login`
- `/regions`
- `/regions/:id`
- `/data/participants/new`
- `/data/experts/new`
- `/admin/model-config`

## 7. Risks and mitigations

- **Algorithm ambiguity / parameter tuning:**
  - Mitigation: versioned configs + golden tests + diagnostics.

- **Explainability vs complexity:**
  - Mitigation: diagnostics and structured “why” outputs.

- **Data privacy:**
  - Mitigation: synthetic fixtures; strict access controls in Phase 2.

## 8. Glossary

- **DSS:** Decision Support System
- **DM / ОПР:** Decision Maker
- **PSU:** Management/Analytical software component executing models
- **MB:** Model Base (library)
- **KB:** Knowledge Base (config/parameters)
- **DB:** Data Base (stored inputs/outputs)
