import { getNextPublicEnv } from "./public-env";

export type SupplierRecord = {
  id: string;
  supplier_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency_code: string | null;
  lead_time_days: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SupplierScorecard = {
  supplier_key: string;
  supplier_name: string;
  total_pos: number;
  approved_pos: number;
  po_approval_rate: number;
  total_receipts: number;
  clean_receipts: number;
  clean_receipt_rate: number;
  total_discrepancies: number;
  approved_discrepancies: number;
  rejected_discrepancies: number;
  avg_discrepancy_units: number;
  reliability_score: number;
  on_time_delivery_pct?: number | null;
  defect_rate?: number | null;
  risk_level?: string | null;
  risk_summary?: string | null;
};

const getSupplierServiceBaseUrl = () =>
  getNextPublicEnv(
    "NEXT_PUBLIC_SUPPLIER_SERVICE_URL",
    "http://localhost:4001",
  );

const parseError = async (response: Response) => {
  const text = await response.text();

  try {
    const json = JSON.parse(text) as {
      error?: string;
      details?: string | null;
    };
    return json.error || json.details || text;
  } catch {
    return text || `Request failed with status ${response.status}`;
  }
};

export const fetchSuppliers = async (search = "") => {
  const url = new URL(
    `${getSupplierServiceBaseUrl()}/suppliers`,
  );

  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    data: SupplierRecord[];
  };

  return payload.data;
};

export const fetchSupplierScorecard = async (
  supplierName: string,
) => {
  const normalized = supplierName.trim();
  if (!normalized) return null;

  const url = new URL(
    `${getSupplierServiceBaseUrl()}/supplier-scorecards`,
  );
  url.searchParams.set("supplier_name", normalized);

  const response = await fetch(url.toString());
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    data: SupplierScorecard | null;
  };

  return payload.data;
};

export const fetchSupplierByName = async (
  supplierName: string,
) => {
  const normalized = supplierName.trim();
  if (!normalized) {
    return null;
  }

  const url = new URL(
    `${getSupplierServiceBaseUrl()}/suppliers/lookup`,
  );
  url.searchParams.set("name", normalized);

  const response = await fetch(url.toString());
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as {
    data: SupplierRecord | null;
  };

  return payload.data;
};

// ---------------------------------------------------------------------------
// Pure scorecard helpers (no I/O, safe to unit-test in isolation)
// ---------------------------------------------------------------------------

/**
 * Calculates a supplier's weighted scorecard from three independent scores.
 *
 * Weights:
 *   delivery  40 %
 *   quality   40 %
 *   price     20 %
 *
 * @param deliveryScore  0–100
 * @param qualityScore   0–100
 * @param priceScore     0–100
 * @returns weighted composite score (0–100)
 */
export function calculateWeightedScorecard(
  deliveryScore: number,
  qualityScore: number,
  priceScore: number,
): number {
  return deliveryScore * 0.4 + qualityScore * 0.4 + priceScore * 0.2;
}

/**
 * Maps a composite score to a letter grade.
 *
 * Thresholds:
 *   A  ≥ 90
 *   B  80 – 89
 *   C  70 – 79
 *   D  < 70
 *
 * @param score composite score (0–100)
 * @returns letter grade "A" | "B" | "C" | "D"
 */
export function assignSupplierGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}
