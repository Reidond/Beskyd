import type { RiskModelConfig } from "beskyd"

export const defaultRiskModelConfig: RiskModelConfig = {
  linguisticScale: { l1: 1, l2: 2, l3: 3, l4: 4, l5: 5 },
  criteriaGroups: {
    infrastructure: ["K1", "K2", "K3", "K4", "K5"],
    socioEcological: ["K6", "K7", "K8", "K9", "K10", "K11", "K12"],
    medical: ["K13", "K14", "K15", "K16", "K17"],
  },
  thresholds: {
    veryHighMax: 0.2,
    highMax: 0.4,
    mediumMax: 0.6,
    lowMax: 0.8,
  },
  expertScale: {
    breakpoints: [0, 20, 40, 60, 80, 100],
    labelToUpperBound: {
      low: 20,
      below_average: 40,
      average: 60,
      above_average: 80,
      high: 100,
    },
  },
}
