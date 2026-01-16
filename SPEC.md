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

### 1.3 Outputs (Expanded)

For each region (and/or set of regions) the platform outputs:

- **riskIndex**: normalized **safety** index in **[0, 1]** (higher = safer; `1.0` is minimal risk)
- **riskLabel**: linguistic **risk** classification derived from `riskIndex` (default bins: `[0,0.2)` very_high, `[0.2,0.4)` high, `[0.4,0.6)` medium, `[0.6,0.8)` low, `[0.8,1]` very_low)
- **diagnostics/explanations**: raw intermediate values for each region (group terms, individual risk terms, `δ/ϕ/m_S/ω/μ_R`) to support transparency

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

### 4.4 Library public API (Expanded)

```ts
export type RegionId = string;

export type RiskLabel =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type GroupTerm = "T1" | "T2" | "T3" | "T4" | "T5";
export type IndividualRiskTerm = "L" | "BA" | "A" | "AA" | "H";

export type ExpertSafetyLevel =
  | "low"
  | "below_average"
  | "average"
  | "above_average"
  | "high";

export interface RiskModelConfig {
  // Linguistic token → numeric rank (higher = safer).
  // Default: { l1:1, l2:2, l3:3, l4:4, l5:5 }
  linguisticScale: Record<string, number>;

  // Criteria groups and their criterion keys (configurable).
  // Default: infrastructure K1-K5, socioEcological K6-K12, medical K13-K17.
  criteriaGroups: Record<string, string[]>;

  // Label cutoffs for normalized safety index (riskIndex)
  thresholds: {
    veryHighMax: number; // default 0.2
    highMax: number; // default 0.4
    mediumMax: number; // default 0.6
    lowMax: number; // default 0.8
  };

  // Expert safety label → numeric scale (0..100 default).
  expertScale: {
    breakpoints: [number, number, number, number, number, number]; // default [0,20,40,60,80,100]
    labelToUpperBound: Record<ExpertSafetyLevel, number>; // low->20 ... high->100
  };

  // Optional weights (default: all 1.0)
  weights?: {
    participants?: Record<string, number>;
    groups?: Record<string, number>;
  };
}

export interface ParticipantAssessment {
  participantId: string;
  regionId: RegionId;

  // Group -> criterion -> linguistic token (positive safety statements).
  criteria: Record<string, Record<string, string>>;
}

export interface ExpertRegionAssessment {
  regionId: RegionId;
  safetyLevel: ExpertSafetyLevel; // Δ1–Δ5 label
}

export interface RegionRiskResult {
  regionId: RegionId;
  riskIndex: number; // [0,1], higher = safer (μ_R)
  riskLabel: RiskLabel;
  diagnostics: {
    sampleSize: number;
    perParticipant: Record<string, {
      groupSums: Record<string, number>; // θ_g
      groupTerms: Record<string, GroupTerm>; // T_g
      individualRiskTerm: IndividualRiskTerm; // r*(e)
    }>;
    deltaRisk: number; // δ(R)
    phiRisk: number; // ϕ(R)
    repeatVisit: number; // Ξ(R)
    senseOfSafety: number; // m_S(R)
    expertSafetyLevel: ExpertSafetyLevel; // Δ(R)
    omega: number; // ω(R)
    muR: number; // μ_R(R)
  };
}

export interface ComputeRiskInput {
  config: RiskModelConfig;
  participants: ParticipantAssessment[];
  experts: ExpertRegionAssessment[];
  repeatVisitByRegion: Record<RegionId, number>; // Ξ in [0,1]
}

export function computeRegionRisk(input: ComputeRiskInput): RegionRiskResult[];
```

Notes:

- The library should also expose **lower-level** pure helpers:
  - membership functions (Z-spline, conical, S-shaped)
  - label mapping function
  - clamping and normalization

### 4.5 Algorithm structure (Expanded)

The safety-risk model uses **positive safety statements** for criteria (higher numeric value = safer). The pipeline is deterministic and IO-free.

1. **Group term evaluation** (per participant, per group)
   - Map each linguistic token `l1..l5` to numeric `τ` using `linguisticScale`.
   - For each group `g` with `m_g` criteria, compute: `θ_g(e) = Σ τ_gi`.
   - Characteristic mapping to group term `T_g`:
     - `T1` if `θ_g < m_g`
     - `T2` if `m_g ≤ θ_g < 2 m_g`
     - `T3` if `2 m_g ≤ θ_g < 3 m_g`
     - `T4` if `3 m_g ≤ θ_g < 4 m_g`
     - `T5` if `θ_g ≥ 4 m_g`

2. **Individual-level aggregation** (`r*(e)`) using explicit rules
   - Rule set (use the counts of `T_g` across groups):
     - If `T5 ≥ 1` and `T4 ≥ 2` → `L` (low risk)
     - If `T5 ≥ 1` and `T4 ≥ 1` and `T3 ≥ 1` → `BA` (below average risk)
     - If `T4 ≥ 1` and `T3 ≥ 1` and `T2 ≥ 1` → `A` (average risk)
     - If `T3 ≥ 2` and `T2 ≥ 1` → `AA` (above average risk)
     - Otherwise → `H` (high risk)

3. **Regional aggregation**
   - Map `r*(e)` to numeric `χ(e)` using defaults: `L=15, BA=30, A=50, AA=80, H=100`.
   - Compute regional risk: `δ(R) = Σ (χ(e) * w_e) / Σ w_e` (default `w_e = 1`).
   - Normalize with Z-spline (defaults from article):
     - `ϕ(R) = 1` if `δ ≤ 60`
     - `ϕ(R) = 1 - ((δ-60)^2)/800` if `60 < δ ≤ 80`
     - `ϕ(R) = ((100-δ)^2)/800` if `80 < δ < 100`
     - `ϕ(R) = 0` if `δ ≥ 100`

4. **Repeat-visit intention**
   - `Ξ(R)` is a **per-region input** in `[0,1]`, representing repeat-visit forecast.

5. **Sense of safety** (regional)
   - Conical membership (defaults from article):
     - `m_S(R) = 1 - 0.5 * sqrt((ϕ(R)-1)^2 + (Ξ(R)-1)^2)`
   - Clamp to `[0,1]`.

6. **Final risk with expert safety level (Δ)**
   - `Δ(R)` is a single label per region (decision maker input).
   - Default numeric mapping: `low=20`, `below_average=40`, `average=60`, `above_average=80`, `high=100`.
   - Compute `ω(R) = a_i * m_S(R)` based on `Δ(R)`’s mapped value `a_i`.
   - Normalize with S-shaped membership:
     - `μ_R = 0` if `ω ≤ a1`
     - `μ_R = 2 * ((ω-a1)/(a6-a1))^2` if `a1 < ω ≤ (a1+a6)/2`
     - `μ_R = 1 - 2 * ((a6-ω)/(a6-a1))^2` if `(a1+a6)/2 < ω < a6`
     - `μ_R = 1` if `ω ≥ a6`
     - Defaults: `a1=0`, `a6=100` (configurable).
   - `riskIndex = μ_R` (higher = safer).

7. **Risk label mapping**
   - Default thresholds: `[0.2, 0.4, 0.6, 0.8]` (configurable).
   - `riskLabel` mapping:
     - `[0,0.2)` → `very_high`
     - `[0.2,0.4)` → `high`
     - `[0.4,0.6)` → `medium`
     - `[0.6,0.8)` → `low`
     - `[0.8,1]` → `very_low`

### 4.6 Testing requirements (Expanded)

Phase 1 tests must include:

- **Unit tests** for:
  - linguistic token mapping
  - characteristic functions
  - membership functions (Z-spline, conical, S-shaped)
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
  - Base schema on `docs/expert_evaluation.xlsx` (columns `K1..K17`) without storing personal data.
  - Default group mapping: `K1–K5` infra, `K6–K12` socio-ecological, `K13–K17` medical.
  - Use repeat-visit example values for fixtures: `Ξ(R1)=0.85`, `Ξ(R2)=0.78`, `Ξ(R3)=0.88`.
  - Add a golden test that reproduces the article’s sample outputs for μ_R (≈0.86, 0.82, 0.41) using the provided Δ labels.

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

### 6.4 Implementation status (2026-01-16)

- `/regions` uses client-side sample rows; no API wiring or list endpoint exists for region summaries.
- `/regions/:id` is wired to `GET /v1/results/region-risk?regionId=...`.
- `/admin/model-config` is read-only; wired to `GET /v1/config/risk-model`, `PUT` not connected.
- `/data/participants/new` posts to `POST /v1/assessments/participants`.
- `/data/experts/new` posts to `POST /v1/assessments/experts`.
- `/login` uses better-auth email sign-in, but no session validation or route protection exists; root route (`/`) always redirects to `/regions` and non-login pages render without auth checks.
- `VITE_API_BASE_URL` is required for API + auth client base URL; no proxy is used.
- `/v1/compute/region-risk` is not called by the UI yet.

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

## 9. Open questions (Added)

- **Repeat-visit source (Ξ):** docs provide example values but no derivation; Phase 1 treats it as explicit per-region input. Confirm how Ξ should be sourced in Phase 2/3.
- **Full fuzzy rule base:** only the five explicit `r*(e)` rules from the article are implemented; confirm whether a broader Mamdani rule base is required later.
