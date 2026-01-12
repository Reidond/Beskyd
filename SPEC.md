# Specification Reference: Tourist Travel Security Risk Assessment Platform

**Document ID:** SPEC  
**Project:** Intellectual‑Analytical Platform for Assessing the Security Risk of Tourist Travel or short name: Beskyd
**Primary source for domain logic:** Dissertation / paper modules described in Section 4 (information module + 3 analytic modules across individual → regional → national levels).  
**Status:** Draft (v0.1)  
**Last updated:** 2026-01-12

---

## 1. Purpose

This specification defines the product scope, architecture, and phased delivery plan for a web-oriented “intellectual‑analytical platform” that assesses the **security risk of a tourist trip** for a selected region, using:

- tourist (participant) survey data expressed as linguistic variables (5-level agreement scale),
- a predicted **repeat-visit level** for the region,
- an **expert** assessment of regional tourism system safety,
- fuzzy logic rules, characteristic functions, and membership functions,
- outputs as both **quantitative** and **linguistic** risk assessments.

The project must use a modern TypeScript-first stack:
- **Bun**, **Biome**, **TypeScript**
- **Elysia** (backend)
- **Vite + React** with **TanStack Query**, **TanStack Router**, **TanStack Form**, **TailwindCSS**, **shadcn/ui**, **Zustand**

---

## 2. Phased delivery

### Phase 1 — MVP (Core Engine Library + Repo Setup)
Goal: deliver a clean, tested **Bun library** implementing the dissertation’s core risk-assessment logic, with best-practice tooling and CI-quality checks.

Deliverable:
- repository scaffold (monorepo-ready),
- `@trisk/core` library (domain + algorithms),
- unit + property tests,
- reference fixtures (small sample datasets) and reproducibility docs.

### Phase 2 — Backend (Elysia API)
Goal: expose the core engine via a versioned API; support persistence, configuration, and computation runs.

Deliverable:
- `apps/api` Elysia service,
- database schema + migrations,
- auth/roles for analysts/admins,
- OpenAPI docs and integration tests.

### Phase 3 — Frontend (Vite + React)
Goal: provide a usable web interface for data entry/import, running assessments, and visualizing results.

Deliverable:
- `apps/web` React app,
- region/project management UI,
- dashboards, configuration UI, exports.

---

## 3. Repository layout (target)

```
/apps
  /api                # Phase 2 (Elysia)
  /web                # Phase 3 (Vite+React)
/packages
  /core               # Phase 1 (risk engine library)
/docs
  SPEC.md             # this file
```

---

## 4. Core domain model

### 4.1 Entities

**Region**
- `id: string`
- `name: string`
- `country?: string`
- `repeatVisitLevel: number` — normalized `[0..1]` (higher means higher intention to revisit)

**Participant**
- `id: string`
- `regionId: string`
- `weight?: number` — optional competence/importance weight (defaults to 1)

**Criterion**
- `id: string` (e.g., `K1..K17`)
- `groupId: string`
- `label: string`
- `polarity: "risk↑" | "safety↑"`  
  - Used to resolve whether higher agreement increases risk or increases safety (see “Open questions”).

**CriteriaGroup**
- `id: string` (e.g., `infra`, `socEco`, `medical`)
- `label: string`
- `criteria: Criterion[]`

**SurveyResponse**
- `participantId: string`
- `answers: Record<CriterionId, LikertAnswer>`

### 4.2 Linguistic variables

**LikertAnswer** (5-level agreement):
- `SD` — Strongly Disagree
- `D`  — Disagree
- `N`  — Neither agree nor disagree
- `A`  — Agree
- `SA` — Strongly Agree

**Numeric mapping (default)**
- SD→1, D→2, N→3, A→4, SA→5

> Note: polarity handling may invert scores per criterion.

### 4.3 Risk term sets

**Individual aggregated risk term (per participant / region)**
- `L`  — Low risk  
- `BA` — Below-average risk  
- `A`  — Average risk  
- `AA` — Above-average risk  
- `H`  — High risk  

**Final (platform output) linguistic risk**
- `VH` — Very High Risk
- `H`  — High Risk
- `M`  — Medium Risk
- `L`  — Low Risk
- `VL` — Very Low Risk

---

## 5. Algorithms (Phase 1 core)

The core engine implements the full computation pipeline end-to-end, but it is designed to be modular so that each module can be used independently.

### 5.1 Module 1 — Information module (survey ingestion + normalization)

Inputs:
- criteria schema (groups + criteria),
- participant survey answers (linguistic),
- optional criterion polarity and participant weights.

Outputs:
- validated normalized answers,
- per-participant numeric scores per criterion.

Requirements:
- Support **open** criteria sets (any number of groups/criteria).
- Provide a default schema matching the dissertation’s 17 criteria grouped into 3 categories (infrastructure; social & ecological; medical).

### 5.2 Module 2 — Individual level: term-assessment of personal safety risk

Goal:
- For each participant, compute:
  1) a term per group (group risk),
  2) an aggregated personal-risk term `L/BA/A/AA/H`.

Steps:
1. **Fuzzification / scoring**  
   Convert each linguistic answer to numeric score `τ` (1..5), applying polarity if configured.

2. **Group aggregation**  
   For each group `g`, compute:
   - `S_g = Σ τ_k` over criteria in group.

3. **Characteristic function → group term**
   Map `S_g` to a group term (one of `L/BA/A/AA/H`).
   - This mapping must be **configurable**, because interval boundaries may be tuned based on real data.

4. **Rule-based aggregation across groups**
   Apply a small fuzzy-rule base (“If–Then–Else”) that maps the set of group terms to a single personal-risk term.  
   The rule base must be represented as data (config), not hard-coded.

Outputs:
- `participantGroupTerms: Record<GroupId, TermRisk>`
- `participantRiskTerm: TermRisk`

### 5.3 Module 3 — Regional level: sense-of-safety assessment

Goal:
- Combine all participants’ personal-risk terms into a regional “sense of safety / risk” score and then integrate the **repeat-visit level**.

Steps:
1. **Aggregate participants for region**
   - All participants are equal by default; optional weights may be applied.

2. **Percent-scale aggregation (default ranges)**
   Convert counts/weights by term into a 0–100 scale. Default term ranges:
   - L:  [0..15]
   - BA: [15..30]
   - A:  [30..50]
   - AA: [50..80]
   - H:  [80..100]
   These ranges must be configurable.

3. **Normalize using Z-shaped membership function**
   Produce a normalized value `touristSafetyIndex ∈ [0..1]` where values closer to **1 imply minimal risk** (higher safety).

4. **Combine touristSafetyIndex with repeatVisitLevel**
   Use a 2D conical/pyramidal membership function over:
   - `x = touristSafetyIndex (0..1)`
   - `y = repeatVisitLevel (0..1)`
   to output:
   - `regionSenseOfSafety ∈ [0..1]`

Outputs:
- `touristSafetyIndex`
- `regionSenseOfSafety`

### 5.4 Module 4 — National level: security risk assessment of tourist travel

Goal:
- Combine the region’s sense-of-safety (tourist perspective) with an **expert safety assessment** of regional tourism systems.

Inputs:
- `regionSenseOfSafety ∈ [0..1]`
- `expertSafetyLevel` (linguistic or numeric; configurable)

Steps:
1. **Expert input processing**
   Support two modes:
   - **Linguistic**: expert provides a term (e.g., low/medium/high safety). Map via configurable intervals.
   - **Numeric**: expert provides a score on an agreed numeric scale (default 0..100).

2. **Characteristic function to compute objective assessment**
   Compute an intermediate objective score `ω` (per dissertation) from tourist and expert inputs.
   (Implementation must be configurable as the dissertation equation is represented as a “characteristic function”.)

3. **Normalization using S-shaped membership function**
   Normalize `ω` to `finalSafetyIndex ∈ [0..1]` where values closer to **1 imply minimal risk**.

4. **Linguistic interpretation**
   Map `finalSafetyIndex` to one of:
   - Very High / High / Medium / Low / Very Low risk  
   (configurable thresholds).

Outputs:
- `finalSafetyIndex`
- `finalRiskIndex = 1 - finalSafetyIndex`
- `finalRiskLabel: FinalRiskLabel`

---

## 6. Default criteria schema (17 criteria)

The default schema must ship with 17 criteria grouped into three categories:

1) **Infrastructure safety risk** (5 criteria)  
2) **Social & ecological safety risk** (7 criteria)  
3) **Medical safety risk** (5 criteria)

Implementation note:
- Text labels must be stored in the schema (Ukrainian as primary, English optional).
- Criterion polarity must be explicit in the schema (`risk↑` vs `safety↑`).

---

## 7. Phase 1 implementation requirements (MVP)

### 7.1 Tooling & quality gates
- Bun workspaces (even if only `packages/core` is implemented in Phase 1)
- TypeScript `strict` mode; recommended flags:
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `noImplicitOverride`
- Biome for lint + format
- Pre-commit hooks (optional but recommended) for `biome check` and tests
- CI-ready scripts in root:
  - `bun lint`
  - `bun test`
  - `bun build`

### 7.2 `@trisk/core` package
Must provide:
- Pure functions for each module step (deterministic, side-effect free)
- A single high-level `assessRegionRisk()` convenience function:
  - input: schema + region + participants + answers + expert input + config
  - output: structured assessment object (all intermediate + final results)
- Strong runtime validation for public APIs:
  - Use a lightweight schema library (or hand-rolled guards) compatible with Bun

### 7.3 Configuration system
- All thresholds, ranges, and rule bases must be configurable through a typed config object.
- Provide:
  - `defaultConfig`
  - `validateConfig(config)` with meaningful errors
- Backward compatibility:
  - Config must be versioned (`configVersion`), with migration helpers if later changed.

### 7.4 Testing strategy (mandatory)
- Unit tests:
  - Likert mapping (incl. polarity inversion)
  - membership functions (S, Z, conical) — boundary + monotonicity tests
  - aggregation logic (weights, percent mapping)
  - rule-engine for term aggregation
- Property tests (recommended):
  - `finalSafetyIndex` must always be in `[0..1]`
  - increasing repeatVisitLevel should not decrease regionSenseOfSafety (if config assumes monotonicity)
- Fixture-based tests:
  - Include a small JSON fixture dataset (10–20 participants) for at least two regions.
  - Validate that results are reproducible and stable given a fixed config.

### 7.5 Documentation (mandatory)
- `README.md` in `packages/core`:
  - concepts and usage examples
  - how to run tests and build
- `docs/algorithm.md` (optional but recommended):
  - explain formulas and defaults in plain language

---

## 8. Phase 2 backend requirements (preview)

### 8.1 API goals
- Provide versioned REST endpoints:
  - `POST /v1/projects`
  - `POST /v1/regions`
  - `POST /v1/regions/:id/responses:import` (CSV/XLSX)
  - `POST /v1/regions/:id/assessments` (run computation)
  - `GET  /v1/regions/:id/assessments/latest`
  - `GET  /v1/regions/:id/assessments/:assessmentId`
  - `PUT  /v1/config` (admin) — update thresholds/rules
- Generate OpenAPI schema from Elysia routes.

### 8.2 Persistence (recommended)
- Database: SQLite for local/dev; Postgres for production
- ORM: Drizzle (recommended for Bun + TS)
- Store:
  - schema versions
  - configurations
  - participants and responses
  - assessment runs and outputs (incl. intermediate values for auditability)

### 8.3 Security & compliance
- Auth: session or JWT
- Roles:
  - `admin` (config + user management)
  - `analyst` (import data, run assessments)
  - `viewer` (read-only dashboards)
- Audit log for config changes and assessment runs.

---

## 9. Phase 3 frontend requirements (preview)

### 9.1 UI goals
- Core flows:
  1) create/select region
  2) import survey responses
  3) set repeatVisitLevel + expert safety input
  4) run assessment
  5) view results (final + intermediate)
  6) export PDF/CSV report
  7) admin: adjust thresholds / rule base

### 9.2 React stack
- Vite + React + TypeScript
- TanStack Router for routing
- TanStack Query for server state
- TanStack Form for forms and validation
- Zustand for app-level state (auth/session, UI prefs)
- TailwindCSS + shadcn/ui

### 9.3 UX requirements
- Clear separation between:
  - “data input”
  - “model configuration”
  - “results”
- Provide explanations / tooltips for each criterion and for risk categories.

---

## 10. Non-functional requirements

- **Correctness:** deterministic results for same inputs/config.
- **Reproducibility:** store config snapshot per assessment run.
- **Performance:** Phase 1 core should handle at least 10k participants per region in-memory.
- **Security:** no PII required; if any personal fields are collected, they must be optional and minimized.
- **I18n:** Ukrainian UI first; English optional.
- **Accessibility:** WCAG 2.1 AA target for UI components.

---

## 11. Open questions / assumptions (must be resolved with supervisor)

1. **Criterion polarity (risk↑ vs safety↑)**  
   Some criteria are phrased as “concerns” (agreement implies risk), but datasets may store reversed codings.  
   The core must support both via schema polarity.

2. **Exact characteristic functions and thresholds**  
   Some equations are expressed as characteristic functions with adjustable interval splits.  
   The implementation will ship with reasonable defaults but must allow tuning.

3. **Expert input format**  
   Confirm whether expert safety level is:
   - a 5-term linguistic input, or
   - a numeric score (0..100), or
   - both.

4. **Repeat-visit level origin**  
   Confirm how repeatVisitLevel is computed (direct input vs derived from survey questions).

---

## 12. Acceptance criteria

### Phase 1 (MVP) is complete when:
- repository builds with Bun,
- `bun lint` and `bun test` succeed,
- `@trisk/core` exports the documented API and passes all tests,
- default schema includes 17 criteria grouped into 3 categories,
- a minimal fixture dataset runs end-to-end and produces a final risk label + indices.

### Phase 2 is complete when:
- API supports importing data and running assessments end-to-end using `@trisk/core`,
- persistence + audit logging implemented,
- OpenAPI docs available.

### Phase 3 is complete when:
- web app supports the core user flow end-to-end,
- results are readable, exportable, and auditable.

---
