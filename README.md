# beskyd

Core intelligence library for quantifying and explaining the security risk of tourist trips. This package implements the Phase 1 mathematical model using fuzzy logic, multi-level aggregation, and expert safety assessments.

## Overview

The `beskyd` library provides a deterministic, side-effect-free engine for safety risk assessment. It processes participant surveys, expert regional evaluations, and repeat-visit forecasts to produce a normalized safety index and linguistic risk classification.

Core features:
- Deterministic analysis with zero IO
- Explainable outputs with detailed diagnostics
- Configurable linguistic scales, groups, and thresholds

## Installation

This library is part of the `beskyd` monorepo:

```bash
bun install
```

## Usage

```typescript
import { computeRegionRisk, type ComputeRiskInput } from "beskyd";

const input: ComputeRiskInput = {
  config: {
    linguisticScale: { l1: 1, l2: 2, l3: 3, l4: 4, l5: 5 },
    criteriaGroups: {
      infrastructure: ["K1", "K2", "K3", "K4", "K5"],
      socioEcological: ["K6", "K7", "K8", "K9", "K10", "K11", "K12"],
      medical: ["K13", "K14", "K15", "K16", "K17"]
    },
    thresholds: {
      veryHighMax: 0.2,
      highMax: 0.4,
      mediumMax: 0.6,
      lowMax: 0.8
    },
    expertScale: {
      breakpoints: [0, 20, 40, 60, 80, 100],
      labelToUpperBound: {
        low: 20,
        below_average: 40,
        average: 60,
        above_average: 80,
        high: 100
      }
    }
  },
  participants: [
    {
      participantId: "p1",
      regionId: "region-a",
      criteria: {
        infrastructure: {
          K1: "l5",
          K2: "l4",
          K3: "l5",
          K4: "l4",
          K5: "l5"
        },
        socioEcological: {
          K6: "l4",
          K7: "l4",
          K8: "l5",
          K9: "l4",
          K10: "l5",
          K11: "l4",
          K12: "l5"
        },
        medical: {
          K13: "l5",
          K14: "l5",
          K15: "l4",
          K16: "l5",
          K17: "l5"
        }
      }
    }
  ],
  experts: [{ regionId: "region-a", safetyLevel: "high" }],
  repeatVisitByRegion: { "region-a": 0.85 }
};

const results = computeRegionRisk(input);

for (const res of results) {
  console.log(res.regionId, res.riskIndex, res.riskLabel);
}
```

## Configuration

`RiskModelConfig` controls the model:

- `linguisticScale`: maps tokens (e.g. `l1..l5`) to numeric ranks
- `criteriaGroups`: defines group → criterion keys, must match participant criteria
- `thresholds`: cutoffs for mapping the risk index to labels
- `expertScale`: breakpoints and expert label mapping used for the final membership
- `weights`: optional per-participant or per-group weights

## Outputs and diagnostics

Each `RegionRiskResult` includes:

- `riskIndex`: normalized safety value in `[0, 1]` (higher = safer)
- `riskLabel`: `very_low | low | medium | high | very_high`
- `diagnostics`: intermediate values (`deltaRisk`, `phiRisk`, `senseOfSafety`, `omega`, `muR`) and per-participant details

## Helpers

Lower-level helpers are exported for direct use:

- `zSplineMembership`, `sShapeMembership`, `conicalMembership`
- `mapRiskLabel`, `clamp`, `normalize`

## Development

- `bun test`
- `bun run lint`
- `bun run typecheck`
