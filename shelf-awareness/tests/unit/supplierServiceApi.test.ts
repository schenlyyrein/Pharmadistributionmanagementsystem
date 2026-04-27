import { fetchSuppliers, fetchSupplierScorecard, fetchSupplierByName } from "@/lib/supplierService";

describe("supplierService API calls", () => {
  const mockSupplier = { id: "1", supplier_name: "Test" };
  const mockScorecard = { supplier_name: "Test", reliability_score: 85 };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetchSuppliers returns data on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [mockSupplier] }),
    });

    const result = await fetchSuppliers("Test");
    expect(result).toEqual([mockSupplier]);
  });

  it("fetchSuppliers throws on error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Error",
    });

    await expect(fetchSuppliers()).rejects.toThrow("Error");
  });

  it("fetchSupplierScorecard returns data on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockScorecard }),
    });

    const result = await fetchSupplierScorecard("Test");
    expect(result).toEqual(mockScorecard);
  });

  it("fetchSupplierScorecard returns null on 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchSupplierScorecard("Test");
    expect(result).toBeNull();
  });

  it("fetchSupplierByName returns data on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockSupplier }),
    });

    const result = await fetchSupplierByName("Test");
    expect(result).toEqual(mockSupplier);
  });

  it("fetchSupplierByName returns null on 404", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchSupplierByName("Test");
    expect(result).toBeNull();
  });
});
