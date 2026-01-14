import { t } from "elysia"

export const riskModelConfigSchema = t.Object({
  linguisticScale: t.Record(t.String(), t.Number()),
  criteriaGroups: t.Record(t.String(), t.Array(t.String())),
  thresholds: t.Object({
    veryHighMax: t.Number(),
    highMax: t.Number(),
    mediumMax: t.Number(),
    lowMax: t.Number(),
  }),
  expertScale: t.Object({
    breakpoints: t.Tuple([t.Number(), t.Number(), t.Number(), t.Number(), t.Number(), t.Number()]),
    labelToUpperBound: t.Object({
      low: t.Number(),
      below_average: t.Number(),
      average: t.Number(),
      above_average: t.Number(),
      high: t.Number(),
    }),
  }),
  weights: t.Optional(
    t.Object({
      participants: t.Optional(t.Record(t.String(), t.Number())),
      groups: t.Optional(t.Record(t.String(), t.Number())),
    }),
  ),
})

export const participantAssessmentSchema = t.Object({
  participantId: t.String(),
  regionId: t.String(),
  criteria: t.Record(t.String(), t.Record(t.String(), t.String())),
})

export const expertAssessmentSchema = t.Object({
  regionId: t.String(),
  safetyLevel: t.Union([
    t.Literal("low"),
    t.Literal("below_average"),
    t.Literal("average"),
    t.Literal("above_average"),
    t.Literal("high"),
  ]),
})

export const computeRequestSchema = t.Object({
  repeatVisitByRegion: t.Record(t.String(), t.Number()),
  regionIds: t.Optional(t.Array(t.String())),
  configVersion: t.Optional(t.Number()),
})
