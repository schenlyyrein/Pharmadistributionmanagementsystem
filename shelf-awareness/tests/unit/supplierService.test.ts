/**
 * SCM-S5-002-T1
 * Unit tests for supplier scorecard weighted calculation and grade thresholds.
 *
 * Functions under test (pure helpers, no I/O):
 *   - calculateWeightedScorecard(deliveryScore, qualityScore, priceScore)
 *   - assignSupplierGrade(score)
 */

import {
  calculateWeightedScorecard,
  assignSupplierGrade,
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
