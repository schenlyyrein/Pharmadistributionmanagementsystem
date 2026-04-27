/**
 * SCM-S5-002-T1 / SCM-S5-002-T2
 * Unit tests for supplier scorecard weighted calculation, grade thresholds,
 * and risk level assignment.
 *
 * Functions under test (pure helpers, no I/O):
 *   - calculateWeightedScorecard(deliveryScore, qualityScore, priceScore)
 *   - assignSupplierGrade(score)
 *   - assignSupplierRiskLevel(reliabilityScore, onTimeDeliveryPct, defectRate)
 */

import {
  calculateWeightedScorecard,
  assignSupplierGrade,
  assignSupplierRiskLevel,
} from "@/lib/supplierService";

// ---------------------------------------------------------------------------
// calculateWeightedScorecard
// ---------------------------------------------------------------------------
describe("calculateWeightedScorecard", () => {
  it("applies delivery 40 %, quality 40 %, price 20 % weights correctly", () => {
    // 80*0.4 + 90*0.4 + 100*0.2 = 32 + 36 + 20 = 88
    expect(calculateWeightedScorecard(80, 90, 100)).toBeCloseTo(88, 5);
  });

  it("returns 100 when all component scores are 100", () => {
    expect(calculateWeightedScorecard(100, 100, 100)).toBeCloseTo(100, 5);
  });

  it("returns 0 when all component scores are 0", () => {
    expect(calculateWeightedScorecard(0, 0, 0)).toBeCloseTo(0, 5);
  });

  it("weights delivery and quality equally at 40 % each", () => {
    // delivery=100, quality=0, price=0 → 40
    expect(calculateWeightedScorecard(100, 0, 0)).toBeCloseTo(40, 5);
    // delivery=0, quality=100, price=0 → 40
    expect(calculateWeightedScorecard(0, 100, 0)).toBeCloseTo(40, 5);
  });

  it("weights price at exactly 20 %", () => {
    // delivery=0, quality=0, price=100 → 20
    expect(calculateWeightedScorecard(0, 0, 100)).toBeCloseTo(20, 5);
  });

  it("handles fractional input scores", () => {
    // 75.5*0.4 + 82.5*0.4 + 60*0.2 = 30.2 + 33 + 12 = 75.2
    expect(calculateWeightedScorecard(75.5, 82.5, 60)).toBeCloseTo(75.2, 5);
  });
});

// ---------------------------------------------------------------------------
// assignSupplierGrade – grade band correctness
// ---------------------------------------------------------------------------
describe("assignSupplierGrade – grade bands", () => {
  it("assigns grade A for a score well above 90", () => {
    expect(assignSupplierGrade(95)).toBe("A");
  });

  it("assigns grade B for a score in the middle of the 80-89 range", () => {
    expect(assignSupplierGrade(85)).toBe("B");
  });

  it("assigns grade C for a score in the middle of the 70-79 range", () => {
    expect(assignSupplierGrade(75)).toBe("C");
  });

  it("assigns grade D for a score well below 70", () => {
    expect(assignSupplierGrade(50)).toBe("D");
  });
});

// ---------------------------------------------------------------------------
// assignSupplierGrade – boundary values
// ---------------------------------------------------------------------------
describe("assignSupplierGrade – boundary values", () => {
  it("score = 90 → grade A (inclusive lower bound of A)", () => {
    expect(assignSupplierGrade(90)).toBe("A");
  });

  it("score = 89 → grade B (just below A threshold)", () => {
    expect(assignSupplierGrade(89)).toBe("B");
  });

  it("score = 80 → grade B (inclusive lower bound of B)", () => {
    expect(assignSupplierGrade(80)).toBe("B");
  });

  it("score = 79 → grade C (just below B threshold)", () => {
    expect(assignSupplierGrade(79)).toBe("C");
  });

  it("score = 70 → grade C (inclusive lower bound of C)", () => {
    expect(assignSupplierGrade(70)).toBe("C");
  });

  it("score = 69 → grade D (just below C threshold)", () => {
    expect(assignSupplierGrade(69)).toBe("D");
  });
});

// ---------------------------------------------------------------------------
// Round-trip: calculateWeightedScorecard → assignSupplierGrade
// ---------------------------------------------------------------------------
describe("calculateWeightedScorecard → assignSupplierGrade round-trip", () => {
  it("produces grade A when composite score lands at exactly 90", () => {
    // Need: d*0.4 + q*0.4 + p*0.2 = 90
    // e.g. 90*0.4 + 90*0.4 + 90*0.2 = 90
    const score = calculateWeightedScorecard(90, 90, 90);
    expect(assignSupplierGrade(score)).toBe("A");
  });

  it("produces grade B when composite score falls in 80–89 range", () => {
    // 80*0.4 + 80*0.4 + 80*0.2 = 80
    const score = calculateWeightedScorecard(80, 80, 80);
    expect(assignSupplierGrade(score)).toBe("B");
  });

  it("produces grade C when composite score falls in 70–79 range", () => {
    // 70*0.4 + 70*0.4 + 70*0.2 = 70
    const score = calculateWeightedScorecard(70, 70, 70);
    expect(assignSupplierGrade(score)).toBe("C");
  });

  it("produces grade D when composite score is below 70", () => {
    // 60*0.4 + 60*0.4 + 60*0.2 = 60
    const score = calculateWeightedScorecard(60, 60, 60);
    expect(assignSupplierGrade(score)).toBe("D");
  });
});

// ===========================================================================
// SCM-S5-002-T2 — assignSupplierRiskLevel
// ===========================================================================

// ---------------------------------------------------------------------------
// Risk level – typical / mid-range cases
// ---------------------------------------------------------------------------
describe("assignSupplierRiskLevel – risk bands", () => {
  it("returns 'low' when all metrics are within acceptable bounds", () => {
    // reliability ≥ 85, onTime ≥ 95, defect ≤ 5
    expect(assignSupplierRiskLevel(90, 97, 3)).toBe("low");
  });

  it("returns 'medium' when reliability is below 85 but at or above 70", () => {
    expect(assignSupplierRiskLevel(80, 97, 3)).toBe("medium");
  });

  it("returns 'medium' when onTimeDeliveryPct is below 95 but at or above 85", () => {
    expect(assignSupplierRiskLevel(90, 90, 3)).toBe("medium");
  });

  it("returns 'medium' when defect rate is above 5 but not above 10", () => {
    expect(assignSupplierRiskLevel(90, 97, 8)).toBe("medium");
  });

  it("returns 'high' when reliability score is below 70", () => {
    expect(assignSupplierRiskLevel(60, 97, 3)).toBe("high");
  });

  it("returns 'high' when onTimeDeliveryPct is below 85", () => {
    expect(assignSupplierRiskLevel(90, 80, 3)).toBe("high");
  });

  it("returns 'high' when defect rate is above 10", () => {
    expect(assignSupplierRiskLevel(90, 97, 15)).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Risk level – boundary values
// ---------------------------------------------------------------------------
describe("assignSupplierRiskLevel – boundary values", () => {
  // --- reliabilityScore boundaries ---
  it("reliability = 70 → 'medium' (not < 70, so not high; but < 85, so medium)", () => {
    expect(assignSupplierRiskLevel(70, 97, 3)).toBe("medium");
  });

  it("reliability = 69 → 'high' (just below the high threshold)", () => {
    expect(assignSupplierRiskLevel(69, 97, 3)).toBe("high");
  });

  // --- onTimeDeliveryPct boundaries ---
  it("onTimeDeliveryPct = 85 → 'medium' (not < 85, so not high; but < 95, so medium)", () => {
    expect(assignSupplierRiskLevel(90, 85, 3)).toBe("medium");
  });

  it("onTimeDeliveryPct = 84 → 'high' (just below the high threshold)", () => {
    expect(assignSupplierRiskLevel(90, 84, 3)).toBe("high");
  });

  // --- defectRate boundaries ---
  it("defectRate = 10 → 'medium' (not > 10, so not high; but > 5, so medium)", () => {
    expect(assignSupplierRiskLevel(90, 97, 10)).toBe("medium");
  });

  it("defectRate = 11 → 'high' (just above the high threshold)", () => {
    expect(assignSupplierRiskLevel(90, 97, 11)).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Risk level – single-metric trigger isolation
// ---------------------------------------------------------------------------
describe("assignSupplierRiskLevel – single-metric trigger isolation", () => {
  it("low reliability alone triggers 'high' even when other metrics are perfect", () => {
    expect(assignSupplierRiskLevel(65, 100, 0)).toBe("high");
  });

  it("low onTime alone triggers 'high' even when other metrics are perfect", () => {
    expect(assignSupplierRiskLevel(100, 80, 0)).toBe("high");
  });

  it("high defect rate alone triggers 'high' even when other metrics are perfect", () => {
    expect(assignSupplierRiskLevel(100, 100, 12)).toBe("high");
  });

  it("moderate reliability alone triggers 'medium' when other metrics qualify for low", () => {
    expect(assignSupplierRiskLevel(82, 100, 0)).toBe("medium");
  });

  it("moderate onTime alone triggers 'medium' when other metrics qualify for low", () => {
    expect(assignSupplierRiskLevel(100, 92, 0)).toBe("medium");
  });

  it("moderate defect rate alone triggers 'medium' when other metrics qualify for low", () => {
    expect(assignSupplierRiskLevel(100, 100, 7)).toBe("medium");
  });
});
