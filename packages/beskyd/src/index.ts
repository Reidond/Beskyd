export type RegionId = string

export type RiskLabel = "very_low" | "low" | "medium" | "high" | "very_high"

export type GroupTerm = "T1" | "T2" | "T3" | "T4" | "T5"
export type IndividualRiskTerm = "L" | "BA" | "A" | "AA" | "H"

export type ExpertSafetyLevel = "low" | "below_average" | "average" | "above_average" | "high"

export interface RiskModelConfig {
  linguisticScale: Record<string, number>
  criteriaGroups: Record<string, string[]>
  thresholds: {
    veryHighMax: number
    highMax: number
    mediumMax: number
    lowMax: number
  }
  expertScale: {
    breakpoints: [number, number, number, number, number, number]
    labelToUpperBound: Record<ExpertSafetyLevel, number>
  }
  weights?: {
    participants?: Record<string, number>
    groups?: Record<string, number>
  }
}

export interface ParticipantAssessment {
  participantId: string
  regionId: RegionId
  criteria: Record<string, Record<string, string>>
}

export interface ExpertRegionAssessment {
  regionId: RegionId
  safetyLevel: ExpertSafetyLevel
}

export interface RegionRiskResult {
  regionId: RegionId
  riskIndex: number
  riskLabel: RiskLabel
  diagnostics: {
    sampleSize: number
    perParticipant: Record<
      string,
      {
        groupSums: Record<string, number>
        groupTerms: Record<string, GroupTerm>
        individualRiskTerm: IndividualRiskTerm
      }
    >
    deltaRisk: number
    phiRisk: number
    repeatVisit: number
    senseOfSafety: number
    expertSafetyLevel: ExpertSafetyLevel
    omega: number
    muR: number
  }
}

export interface ComputeRiskInput {
  config: RiskModelConfig
  participants: ParticipantAssessment[]
  experts: ExpertRegionAssessment[]
  repeatVisitByRegion: Record<RegionId, number>
}

const DEFAULT_RISK_TERM_SCORES: Record<IndividualRiskTerm, number> = {
  L: 15,
  BA: 30,
  A: 50,
  AA: 80,
  H: 100,
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Expected a finite number to clamp.")
  }
  if (min > max) {
    throw new Error("Clamp bounds are invalid.")
  }
  return Math.min(max, Math.max(min, value))
}

export function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Expected a finite number to normalize.")
  }
  if (min === max) {
    throw new Error("Normalization range must be non-zero.")
  }
  const ratio = (value - min) / (max - min)
  return clamp(ratio, 0, 1)
}

export function zSplineMembership(value: number, a: number, b: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("Z-spline parameters must be finite numbers.")
  }
  if (a >= b) {
    throw new Error("Z-spline requires a < b.")
  }
  if (value <= a) {
    return 1
  }
  if (value >= b) {
    return 0
  }
  const midpoint = (a + b) / 2
  const ratio = (value - a) / (b - a)
  if (value <= midpoint) {
    return 1 - 2 * ratio * ratio
  }
  const tailRatio = (value - b) / (b - a)
  return 2 * tailRatio * tailRatio
}

export function sShapeMembership(value: number, a: number, b: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("S-shaped parameters must be finite numbers.")
  }
  if (a >= b) {
    throw new Error("S-shaped membership requires a < b.")
  }
  if (value <= a) {
    return 0
  }
  if (value >= b) {
    return 1
  }
  const midpoint = (a + b) / 2
  const ratio = (value - a) / (b - a)
  if (value <= midpoint) {
    return 2 * ratio * ratio
  }
  const tailRatio = (value - b) / (b - a)
  return 1 - 2 * tailRatio * tailRatio
}

export function conicalMembership(value: number, a: number, b: number, c: number): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    !Number.isFinite(c)
  ) {
    throw new Error("Conical membership parameters must be finite numbers.")
  }
  if (a >= b || b >= c) {
    throw new Error("Conical membership requires a < b < c.")
  }
  if (value <= a || value >= c) {
    return 0
  }
  if (value === b) {
    return 1
  }
  if (value < b) {
    return (value - a) / (b - a)
  }
  return (c - value) / (c - b)
}

export function mapRiskLabel(value: number, thresholds: RiskModelConfig["thresholds"]): RiskLabel {
  const clamped = clamp(value, 0, 1)
  if (clamped < thresholds.veryHighMax) {
    return "very_high"
  }
  if (clamped < thresholds.highMax) {
    return "high"
  }
  if (clamped < thresholds.mediumMax) {
    return "medium"
  }
  if (clamped < thresholds.lowMax) {
    return "low"
  }
  return "very_low"
}

export function computeRegionRisk(input: ComputeRiskInput): RegionRiskResult[] {
  const { config, participants, experts, repeatVisitByRegion } = input
  const expertByRegion = new Map(experts.map((expert) => [expert.regionId, expert.safetyLevel]))
  const participantsByRegion = new Map<RegionId, ParticipantAssessment[]>()

  for (const participant of participants) {
    const list = participantsByRegion.get(participant.regionId) ?? []
    list.push(participant)
    participantsByRegion.set(participant.regionId, list)
  }

  const regions = Array.from(participantsByRegion.keys()).sort()

  return regions.map((regionId) => {
    const regionParticipants = participantsByRegion.get(regionId)
    if (!regionParticipants || regionParticipants.length === 0) {
      throw new Error(`Region ${regionId} has no participant assessments.`)
    }

    const expertSafetyLevel = expertByRegion.get(regionId)
    if (!expertSafetyLevel) {
      throw new Error(`Missing expert safety level for region ${regionId}.`)
    }

    const repeatVisit = repeatVisitByRegion[regionId]
    if (repeatVisit === undefined) {
      throw new Error(`Missing repeat-visit value for region ${regionId}.`)
    }

    const diagnosticsByParticipant: RegionRiskResult["diagnostics"]["perParticipant"] = {}
    const weightedRiskValues: number[] = []
    const participantWeights: number[] = []

    for (const participant of regionParticipants) {
      const groupSums: Record<string, number> = {}
      const groupTerms: Record<string, GroupTerm> = {}

      for (const [groupName, criteriaKeys] of Object.entries(config.criteriaGroups)) {
        const criteriaValues = participant.criteria[groupName]
        if (!criteriaValues) {
          throw new Error(`Participant ${participant.participantId} is missing group ${groupName}.`)
        }
        let sum = 0
        for (const criterionKey of criteriaKeys) {
          const token = criteriaValues[criterionKey]
          if (!token) {
            throw new Error(
              `Participant ${participant.participantId} missing criterion ${criterionKey}.`,
            )
          }
          const numeric = config.linguisticScale[token]
          if (numeric === undefined) {
            throw new Error(`Unknown linguistic token: ${token}.`)
          }
          if (!Number.isFinite(numeric)) {
            throw new Error(`Invalid numeric value for token: ${token}.`)
          }
          sum += numeric
        }
        groupSums[groupName] = sum
        groupTerms[groupName] = groupTermFromSum(sum, criteriaKeys.length)
      }

      const individualRiskTerm = individualRiskFromGroups(Object.values(groupTerms))
      diagnosticsByParticipant[participant.participantId] = {
        groupSums,
        groupTerms,
        individualRiskTerm,
      }

      const riskScore = DEFAULT_RISK_TERM_SCORES[individualRiskTerm]
      if (riskScore === undefined) {
        throw new Error(`Missing risk score for term ${individualRiskTerm}.`)
      }
      const weight = config.weights?.participants?.[participant.participantId] ?? 1
      if (!Number.isFinite(weight) || weight <= 0) {
        throw new Error(`Invalid weight for participant ${participant.participantId}.`)
      }
      weightedRiskValues.push(riskScore * weight)
      participantWeights.push(weight)
    }

    const deltaRisk =
      weightedRiskValues.reduce((sum, value) => sum + value, 0) /
      participantWeights.reduce((sum, value) => sum + value, 0)

    const phiRisk = zSplineMembership(deltaRisk, 60, 100)
    const repeatVisitClamped = clamp(repeatVisit, 0, 1)

    const senseOfSafety = clamp(
      1 -
        0.5 *
          Math.sqrt(
            (phiRisk - 1) * (phiRisk - 1) + (repeatVisitClamped - 1) * (repeatVisitClamped - 1),
          ),
      0,
      1,
    )

    const expertValue = config.expertScale.labelToUpperBound[expertSafetyLevel]
    if (expertValue === undefined) {
      throw new Error(`Missing expert scale for level ${expertSafetyLevel}.`)
    }
    if (!Number.isFinite(expertValue)) {
      throw new Error(`Invalid expert scale for level ${expertSafetyLevel}.`)
    }
    const omega = expertValue * senseOfSafety
    const [a1, , , , , a6] = config.expertScale.breakpoints
    const muR = sShapeMembership(omega, a1, a6)
    const riskIndex = clamp(muR, 0, 1)

    return {
      regionId,
      riskIndex,
      riskLabel: mapRiskLabel(riskIndex, config.thresholds),
      diagnostics: {
        sampleSize: regionParticipants.length,
        perParticipant: diagnosticsByParticipant,
        deltaRisk,
        phiRisk,
        repeatVisit: repeatVisitClamped,
        senseOfSafety,
        expertSafetyLevel,
        omega,
        muR: riskIndex,
      },
    }
  })
}

function groupTermFromSum(sum: number, criteriaCount: number): GroupTerm {
  if (sum < criteriaCount) {
    return "T1"
  }
  if (sum < 2 * criteriaCount) {
    return "T2"
  }
  if (sum < 3 * criteriaCount) {
    return "T3"
  }
  if (sum < 4 * criteriaCount) {
    return "T4"
  }
  return "T5"
}

function individualRiskFromGroups(groupTerms: GroupTerm[]): IndividualRiskTerm {
  const counts = groupTerms.reduce<Record<GroupTerm, number>>(
    (accumulator, term) => {
      accumulator[term] += 1
      return accumulator
    },
    {
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0,
      T5: 0,
    },
  )

  if (counts.T5 >= 1 && counts.T4 >= 2) {
    return "L"
  }
  if (counts.T5 >= 1 && counts.T4 >= 1 && counts.T3 >= 1) {
    return "BA"
  }
  if (counts.T4 >= 1 && counts.T3 >= 1 && counts.T2 >= 1) {
    return "A"
  }
  if (counts.T3 >= 2 && counts.T2 >= 1) {
    return "AA"
  }
  return "H"
}
