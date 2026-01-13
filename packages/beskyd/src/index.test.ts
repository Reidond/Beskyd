import { describe, expect, test } from "vitest";

import {
  clamp,
  computeRegionRisk,
  conicalMembership,
  mapRiskLabel,
  normalize,
  sShapeMembership,
  zSplineMembership,
  type ComputeRiskInput,
  type ParticipantAssessment,
  type RiskModelConfig
} from "./index";

const defaultConfig: RiskModelConfig = {
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
};

const regions = {
  zakarpattia: "Zakarpattia",
  lviv: "Lviv",
  ivanoFrankivsk: "Ivano-Frankivsk"
};

const riskTermGroups = {
  L: ["T5", "T4", "T4"],
  BA: ["T5", "T4", "T3"],
  A: ["T4", "T3", "T2"],
  AA: ["T3", "T3", "T2"],
  H: ["T2", "T2", "T2"]
} as const;

const groupOrder = ["infrastructure", "socioEcological", "medical"] as const;

const groupTokenByTerm: Record<string, string> = {
  T2: "l1",
  T3: "l2",
  T4: "l3",
  T5: "l4"
};

function buildGroupCriteria(criteriaKeys: string[], token: string): Record<string, string> {
  return criteriaKeys.reduce<Record<string, string>>((result, key) => {
    result[key] = token;
    return result;
  }, {});
}

function buildParticipant(
  participantId: string,
  regionId: string,
  riskTerm: keyof typeof riskTermGroups
): ParticipantAssessment {
  const groupTerms = riskTermGroups[riskTerm];
  const criteria: Record<string, Record<string, string>> = {};

  groupOrder.forEach((groupName, index) => {
    const desiredGroupTerm = groupTerms[index];
    if (!desiredGroupTerm) {
      throw new Error(`Missing group term for ${riskTerm} at ${groupName}.`);
    }
    const token = groupTokenByTerm[desiredGroupTerm];
    if (!token) {
      throw new Error(`Missing token mapping for group term ${desiredGroupTerm}.`);
    }
    const keys = defaultConfig.criteriaGroups[groupName];
    if (!keys) {
      throw new Error(`Missing criteria keys for group ${groupName}.`);
    }
    criteria[groupName] = buildGroupCriteria(keys, token);
  });

  return {
    participantId,
    regionId,
    criteria
  };
}

function buildParticipants(
  regionId: string,
  riskTerm: keyof typeof riskTermGroups,
  count: number,
  offset: number
): ParticipantAssessment[] {
  return Array.from({ length: count }, (_, index) =>
    buildParticipant(`${regionId}-${riskTerm}-${offset + index + 1}`, regionId, riskTerm)
  );
}

function buildGoldenInput(): ComputeRiskInput {
  const participants: ParticipantAssessment[] = [];

  participants.push(...buildParticipants(regions.zakarpattia, "A", 36, 0));
  participants.push(...buildParticipants(regions.zakarpattia, "AA", 73, 36));

  participants.push(...buildParticipants(regions.lviv, "A", 38, 109));
  participants.push(...buildParticipants(regions.lviv, "AA", 71, 147));

  participants.push(...buildParticipants(regions.ivanoFrankivsk, "A", 1, 218));
  participants.push(...buildParticipants(regions.ivanoFrankivsk, "AA", 108, 219));

  return {
    config: defaultConfig,
    participants,
    experts: [
      { regionId: regions.zakarpattia, safetyLevel: "above_average" },
      { regionId: regions.lviv, safetyLevel: "above_average" },
      { regionId: regions.ivanoFrankivsk, safetyLevel: "average" }
    ],
    repeatVisitByRegion: {
      [regions.zakarpattia]: 0.85,
      [regions.lviv]: 0.78,
      [regions.ivanoFrankivsk]: 0.88
    }
  };
}

describe("helpers", () => {
  test("clamps and normalizes values", () => {
    expect(clamp(1.2, 0, 1)).toBe(1);
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(normalize(75, 50, 100)).toBe(0.5);
  });

  test("maps risk labels", () => {
    expect(mapRiskLabel(0.1, defaultConfig.thresholds)).toBe("very_high");
    expect(mapRiskLabel(0.3, defaultConfig.thresholds)).toBe("high");
    expect(mapRiskLabel(0.5, defaultConfig.thresholds)).toBe("medium");
    expect(mapRiskLabel(0.7, defaultConfig.thresholds)).toBe("low");
    expect(mapRiskLabel(0.9, defaultConfig.thresholds)).toBe("very_low");
  });

  test("evaluates membership functions", () => {
    expect(zSplineMembership(60, 60, 100)).toBe(1);
    expect(zSplineMembership(80, 60, 100)).toBeCloseTo(0.5, 5);
    expect(zSplineMembership(100, 60, 100)).toBe(0);

    expect(sShapeMembership(0, 0, 100)).toBe(0);
    expect(sShapeMembership(50, 0, 100)).toBeCloseTo(0.5, 5);
    expect(sShapeMembership(100, 0, 100)).toBe(1);

    expect(conicalMembership(1, 0, 1, 2)).toBe(1);
    expect(conicalMembership(0.5, 0, 1, 2)).toBeCloseTo(0.5, 5);
    expect(conicalMembership(0, 0, 1, 2)).toBe(0);
  });
});

describe("computeRegionRisk", () => {
  test("maps tokens into group terms and individual risk", () => {
    const input: ComputeRiskInput = {
      config: defaultConfig,
      participants: [buildParticipant("P-1", regions.zakarpattia, "A")],
      experts: [{ regionId: regions.zakarpattia, safetyLevel: "average" }],
      repeatVisitByRegion: { [regions.zakarpattia]: 0.75 }
    };

    const [result] = computeRegionRisk(input);
    if (!result) {
      throw new Error("Expected a result for Zakarpattia.");
    }
    const participantDiagnostics = result.diagnostics.perParticipant["P-1"];
    if (!participantDiagnostics) {
      throw new Error("Expected diagnostics for participant P-1.");
    }

    expect(participantDiagnostics.groupTerms.infrastructure).toBe("T4");
    expect(participantDiagnostics.groupTerms.socioEcological).toBe("T3");
    expect(participantDiagnostics.groupTerms.medical).toBe("T2");
    expect(participantDiagnostics.individualRiskTerm).toBe("A");
  });

  test("is deterministic and permutation invariant", () => {
    const input = buildGoldenInput();
    const outputA = computeRegionRisk(input);
    const outputB = computeRegionRisk({
      ...input,
      participants: [...input.participants].reverse()
    });

    const byRegionA = Object.fromEntries(outputA.map((item) => [item.regionId, item]));
    const byRegionB = Object.fromEntries(outputB.map((item) => [item.regionId, item]));

    const lvivA = byRegionA[regions.lviv];
    const lvivB = byRegionB[regions.lviv];
    if (!lvivA || !lvivB) {
      throw new Error("Expected Lviv results in both outputs.");
    }

    expect(lvivA.riskIndex).toBeCloseTo(lvivB.riskIndex, 8);
  });

  test("returns clamped risk indices", () => {
    const output = computeRegionRisk(buildGoldenInput());
    for (const result of output) {
      expect(result.riskIndex).toBeGreaterThanOrEqual(0);
      expect(result.riskIndex).toBeLessThanOrEqual(1);
    }
  });

  test("matches golden dataset expectations", () => {
    const output = computeRegionRisk(buildGoldenInput());
    const byRegion = Object.fromEntries(output.map((item) => [item.regionId, item]));

    const zakarpattia = byRegion[regions.zakarpattia];
    const lviv = byRegion[regions.lviv];
    const ivanoFrankivsk = byRegion[regions.ivanoFrankivsk];

    if (!zakarpattia || !lviv || !ivanoFrankivsk) {
      throw new Error("Expected results for all golden regions.");
    }

    expect(zakarpattia.riskIndex).toBeGreaterThan(0.83);
    expect(zakarpattia.riskIndex).toBeLessThan(0.89);

    expect(lviv.riskIndex).toBeGreaterThan(0.8);
    expect(lviv.riskIndex).toBeLessThan(0.84);

    expect(ivanoFrankivsk.riskIndex).toBeGreaterThan(0.38);
    expect(ivanoFrankivsk.riskIndex).toBeLessThan(0.44);
  });
});
