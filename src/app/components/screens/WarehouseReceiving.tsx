import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  ScanBarcode,
  CheckCircle,
  Package,
  Plus,
  Trash2,
  SendHorizonal,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { postGRN } from "/utils/postGRN";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  lastUpdated: string | null;
  systemCount: number;
  status: "normal" | "low" | "zero";
}

interface GrnLine {
  lineId: string;
  productId: string;
  qtyExpected: string;
  qtyReceived: string;
  discrepancyReason: string;
  otherReason: string;
}

const MIN_STOCK_THRESHOLD = 500;

const createEmptyLine = (): GrnLine => ({
  lineId: crypto.randomUUID(),
  productId: "",
  qtyExpected: "",
  qtyReceived: "",
  discrepancyReason: "",
  otherReason: "",
});

export function WarehouseReceiving() {
  const [showGrnForm, setShowGrnForm] = useState(false);
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<GrnLine[]>([
    createEmptyLine(),
  ]);
  const [lastScannedItem, setLastScannedItem] = useState<{
    id: string;
    name: string;
    systemCount: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [savedGrnId, setSavedGrnId] = useState<string | null>(
    null,
  );
  const [savedGrnNumber, setSavedGrnNumber] = useState<
    string | null
  >(null);
  const [isPosted, setIsPosted] = useState(false);

  const [inventory, setInventory] = useState<InventoryItem[]>(
    [],
  );
  const [loadingInventory, setLoadingInventory] =
    useState(false);
  const [stockSearch, setStockSearch] = useState("");

  const filteredInventory = useMemo(() => {
    const keyword = stockSearch.trim().toLowerCase();
    if (!keyword) return inventory;
    return inventory.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword)
      );
    });
  }, [inventory, stockSearch]);

  const lowStockCount = useMemo(
    () =>
      inventory.filter((item) => item.status === "low").length,
    [inventory],
  );

  const outOfStockCount = useMemo(
    () =>
      inventory.filter((item) => item.status === "zero").length,
    [inventory],
  );

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const baseUrl = `https://${projectId}.supabase.co/rest/v1`;
      const headers = {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
      };

      const productsRes = await fetch(
        `${baseUrl}/products?select=product_id,product_uuid,sku,product_name,unit&order=product_name.asc`,
        { headers },
      );
      if (!productsRes.ok)
        throw new Error(
          `products: ${productsRes.status} ${await productsRes.text()}`,
        );
      const products: any[] = await productsRes.json();

      const iohRes = await fetch(
        `${baseUrl}/inventory_on_hand?select=product_id,qty_on_hand,updated_at`,
        { headers },
      );
      if (!iohRes.ok)
        throw new Error(
          `inventory_on_hand: ${iohRes.status} ${await iohRes.text()}`,
        );
      const onHandRows: any[] = await iohRes.json();

      const onHandByProductUuid = new Map(
        onHandRows.map((row) => [String(row.product_id), row]),
      );
      const onHandByProductId = new Map(
        onHandRows.map((row) => [String(row.product_id), row]),
      );

      const items: InventoryItem[] = products.map((p) => {
        const ioh =
          onHandByProductUuid.get(String(p.product_uuid)) ??
          onHandByProductId.get(String(p.product_id)) ??
          null;
        const qty = Number(ioh?.qty_on_hand ?? 0);
        const status: InventoryItem["status"] =
          qty === 0
            ? "zero"
            : qty < MIN_STOCK_THRESHOLD
              ? "low"
              : "normal";

        return {
          id: String(p.product_id),
          sku: p.sku ?? "N/A",
          name: p.product_name ?? "Unknown Product",
          unit: p.unit ?? "-",
          lastUpdated: ioh?.updated_at ?? null,
          systemCount: qty,
          status,
        };
      });

      setInventory(items);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : String(err);
      console.error("fetchInventory error:", msg);
      toast.error("Could not load inventory", {
        description: msg,
      });
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const insertScannedItemToLines = (item: {
    id: string;
    name: string;
    systemCount: number;
  }) => {
    setLines((prev) => {
      if (prev.length === 1 && !prev[0].productId) {
        return [
          {
            ...prev[0],
            productId: item.id,
            qtyExpected: item.systemCount.toString(),
          },
        ];
      }
      return [
        ...prev,
        {
          lineId: crypto.randomUUID(),
          productId: item.id,
          qtyExpected: item.systemCount.toString(),
          qtyReceived: "",
          discrepancyReason: "",
          otherReason: "",
        },
      ];
    });
  };

  const handleScan = () => {
    if (inventory.length === 0) {
      toast.error("No products found", {
        description: "Please refresh inventory first.",
      });
      return;
    }
    const randomProduct =
      inventory[Math.floor(Math.random() * inventory.length)];
    const scanned = {
      id: randomProduct.id,
      name: randomProduct.name,
      systemCount: randomProduct.systemCount,
    };
    setLastScannedItem(scanned);
    if (showGrnForm) {
      insertScannedItemToLines(scanned);
      toast.success("Barcode Scanned", {
        description: `${randomProduct.name} added to GRN line items`,
      });
      return;
    }
    toast.success("Barcode Scanned", {
      description: `${randomProduct.name} scanned. Click View GRN to continue.`,
    });
  };

  const handleViewGrn = () => {
    setShowGrnForm(true);
    if (lastScannedItem) {
      insertScannedItemToLines(lastScannedItem);
      setLastScannedItem(null);
    }
  };

  const addLine = () =>
    setLines((prev) => [...prev, createEmptyLine()]);
  const removeLine = (lineId: string) => {
    setSavedGrnId(null);
    setSavedGrnNumber(null);
    setLines((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((l) => l.lineId !== lineId),
    );
  };
  const updateLine = (
    lineId: string,
    field: keyof GrnLine,
    value: string,
  ) => {
    setSavedGrnId(null);
    setSavedGrnNumber(null);
    setLines((prev) =>
      prev.map((l) =>
        l.lineId === lineId ? { ...l, [field]: value } : l,
      ),
    );
  };

  const validateLines = (): boolean => {
    if (!receivedDate) {
      toast.error("Missing received date");
      return false;
    }

    if (
      lines.length === 0 ||
      (lines.length === 1 && !lines[0].productId)
    ) {
      toast.error("At least one line item is required");
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const expected = Number(line.qtyExpected);
      const received = Number(line.qtyReceived);

      if (!line.productId) {
        toast.error(`Line ${i + 1}: Product is required`);
        return false;
      }
      if (
        line.qtyExpected === "" ||
        !Number.isFinite(expected) ||
        expected < 0
      ) {
        toast.error(
          `Line ${i + 1}: Qty expected must be 0 or higher`,
        );
        return false;
      }
      if (
        line.qtyReceived === "" ||
        !Number.isFinite(received) ||
        received < 1
      ) {
        toast.error(
          `Line ${i + 1}: Qty received must be 1 or higher`,
        );
        return false;
      }

      const mismatch = expected !== received;
      if (mismatch && !line.discrepancyReason) {
        toast.error(
          `Line ${i + 1}: Discrepancy reason is required`,
        );
        return false;
      }
      if (
        mismatch &&
        line.discrepancyReason === "other" &&
        !line.otherReason.trim()
      ) {
        toast.error(`Line ${i + 1}: Please type Other reason`);
        return false;
      }
    }
    return true;
  };

  const buildPayloads = () => {
    const grnId = crypto.randomUUID();
    const dateStamp = receivedDate.replace(/-/g, "");
    const timeStamp = new Date()
      .toISOString()
      .slice(11, 19)
      .replace(/:/g, "");
    const grnNumber = `GRN-${dateStamp}-${timeStamp}`;

    const headerPayload = {
      id: grnId,
      grn_number: grnNumber,
      received_date: receivedDate,
      notes: notes.trim() || null,
      status: "DRAFT",
      created_by: "warehouse_operator",
    };

    const linePayload = lines.map((line, idx) => {
      const product = inventory.find(
        (item) => item.id === line.productId,
      );
      const expected = Number(line.qtyExpected);
      const received = Number(line.qtyReceived);
      const mismatch = expected !== received;
      const reason = mismatch
        ? line.discrepancyReason === "other"
          ? line.otherReason.trim()
          : line.discrepancyReason
        : null;
      return {
        id: crypto.randomUUID(),
        grn_draft_id: grnId,
        line_no: idx + 1,
        product_id: line.productId,
        product_name: product?.name ?? "Unknown",
        sku: product?.sku ?? "N/A",
        qty_expected: expected,
        qty_received: received,
        variance: received - expected,
        discrepancy_reason: reason,
      };
    });

    return { grnId, grnNumber, headerPayload, linePayload };
  };

  const saveToDatabase = async (
    headerPayload: object,
    linePayload: object[],
  ) => {
    const hRes = await fetch(
      `https://${projectId}.supabase.co/rest/v1/grn_drafts`,
      {
        method: "POST",
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(headerPayload),
      },
    );
    if (!hRes.ok) throw new Error(await hRes.text());

    const lRes = await fetch(
      `https://${projectId}.supabase.co/rest/v1/grn_draft_lines`,
      {
        method: "POST",
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(linePayload),
      },
    );
    if (!lRes.ok) throw new Error(await lRes.text());
  };

  const handleSaveGrn = async () => {
    if (!validateLines()) return;
    const { grnId, grnNumber, headerPayload, linePayload } =
      buildPayloads();
    setIsSaving(true);
    try {
      await saveToDatabase(headerPayload, linePayload);
      setSavedGrnId(grnId);
      setSavedGrnNumber(grnNumber);
      setIsPosted(false);
      toast.success(`GRN ${grnNumber} saved`, {
        description: `${linePayload.length} line item(s) recorded`,
      });
    } catch (error) {
      toast.error("Save failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostGrn = async () => {
    if (!validateLines()) return;
    setIsPosting(true);
    try {
      let grnId = savedGrnId;
      let grnNumber = savedGrnNumber;

      if (!grnId) {
        const p = buildPayloads();
        grnId = p.grnId;
        grnNumber = p.grnNumber;
        await saveToDatabase(p.headerPayload, p.linePayload);
      }

      const result = await postGRN(
        grnId!,
        "warehouse_operator",
      );

      setIsPosted(true);
      setSavedGrnId(grnId);
      setSavedGrnNumber(grnNumber);

      toast.success(`GRN ${grnNumber} posted!`, {
        description: `${result.lines_processed} line(s) - ${result.products_updated} product(s) updated`,
      });

      await new Promise((r) => setTimeout(r, 600));
      await fetchInventory();

      setTimeout(() => {
        setReceivedDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        setLines([createEmptyLine()]);
        setShowGrnForm(false);
        setSavedGrnId(null);
        setSavedGrnNumber(null);
        setIsPosted(false);
      }, 2500);
    } catch (error) {
      console.error("handlePostGrn error:", error);
      toast.error("Post failed", {
        description:
          error instanceof Error
            ? error.message
            : String(error),
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-semibold mb-2 text-[#111827]">
          Warehouse Receiving & GRN
        </h1>
        <p className="text-sm lg:text-base text-[#6B7280]">
          Scan barcode and process GRN lines
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleScan}
          className="h-20 bg-[#00A3AD] hover:bg-[#0891B2] text-white flex flex-col gap-2 shadow-md"
        >
          <ScanBarcode className="w-8 h-8" />
          <span className="font-semibold">Scan Barcode</span>
        </Button>
        <Button
          onClick={handleViewGrn}
          variant="outline"
          className="h-20 border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10 flex flex-col gap-2"
        >
          <Package className="w-8 h-8" />
          <span className="font-semibold">View GRN</span>
        </Button>
      </div>

      {showGrnForm && (
        <>
          <Card className="bg-white border-[#111827]/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">
                GRN Header
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#6B7280]">
                  Received Date
                </Label>
                <Input
                  type="date"
                  value={receivedDate}
                  onChange={(e) =>
                    setReceivedDate(e.target.value)
                  }
                  className="mt-2 border-[#111827]/10"
                  disabled={isPosted}
                />
              </div>
              <div>
                <Label className="text-[#6B7280]">
                  Notes (Optional)
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Supplier delivery note, issue summary, etc."
                  className="mt-2 border-[#111827]/10"
                  disabled={isPosted}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#111827]/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#111827] font-semibold">
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => {
                const expected = Number(line.qtyExpected);
                const received = Number(line.qtyReceived);
                const mismatch =
                  Number.isFinite(expected) &&
                  Number.isFinite(received) &&
                  line.qtyExpected !== "" &&
                  line.qtyReceived !== "" &&
                  expected !== received;
                return (
                  <div
                    key={line.lineId}
                    className="border border-[#E5E7EB] rounded-lg p-4 space-y-4 bg-[#F8FAFC]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#111827]">
                        Line {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
                        onClick={() => removeLine(line.lineId)}
                        disabled={
                          lines.length === 1 || isPosted
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#6B7280]">
                          Product
                        </Label>
                        <Select
                          value={line.productId}
                          onValueChange={(v) =>
                            updateLine(
                              line.lineId,
                              "productId",
                              v,
                            )
                          }
                          disabled={isPosted}
                        >
                          <SelectTrigger className="mt-2 border-[#111827]/10 bg-white">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-[#6B7280]">
                                No products loaded yet.
                              </div>
                            ) : (
                              inventory.map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.name} ({item.sku})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[#6B7280]">
                          Qty Expected
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={line.qtyExpected}
                          onChange={(e) =>
                            updateLine(
                              line.lineId,
                              "qtyExpected",
                              e.target.value,
                            )
                          }
                          className="mt-2 border-[#111827]/10 bg-white"
                          placeholder="0"
                          disabled={isPosted}
                        />
                      </div>
                      <div>
                        <Label className="text-[#6B7280]">
                          Qty Received
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.qtyReceived}
                          onChange={(e) =>
                            updateLine(
                              line.lineId,
                              "qtyReceived",
                              e.target.value,
                            )
                          }
                          className="mt-2 border-[#111827]/10 bg-white"
                          placeholder="0"
                          disabled={isPosted}
                        />
                      </div>
                      <div>
                        <Label className="text-[#6B7280]">
                          Discrepancy Reason{" "}
                          {mismatch
                            ? "(Required)"
                            : "(Optional)"}
                        </Label>
                        <Select
                          value={line.discrepancyReason}
                          onValueChange={(v) =>
                            updateLine(
                              line.lineId,
                              "discrepancyReason",
                              v,
                            )
                          }
                          disabled={isPosted}
                        >
                          <SelectTrigger className="mt-2 border-[#111827]/10 bg-white">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damaged">
                              Damaged in Transit
                            </SelectItem>
                            <SelectItem value="shortage">
                              Supplier Shortage
                            </SelectItem>
                            <SelectItem value="count_error">
                              Count Error
                            </SelectItem>
                            <SelectItem value="expired">
                              Expired Items
                            </SelectItem>
                            <SelectItem value="other">
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {mismatch &&
                      line.discrepancyReason === "other" && (
                        <div>
                          <Label className="text-[#6B7280]">
                            Type Other Reason
                          </Label>
                          <Input
                            value={line.otherReason}
                            onChange={(e) =>
                              updateLine(
                                line.lineId,
                                "otherReason",
                                e.target.value,
                              )
                            }
                            className="mt-2 border-[#111827]/10 bg-white"
                            placeholder="Enter reason"
                            disabled={isPosted}
                          />
                        </div>
                      )}
                  </div>
                );
              })}
              <Button
                onClick={addLine}
                variant="outline"
                className="w-full border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10"
                disabled={isPosted}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-[#111827] font-semibold">
                Stock-on-Hand
              </CardTitle>
              <p className="text-sm text-[#6B7280]">
                Current inventory levels
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search product or SKU"
                className="w-full sm:w-64 border-[#111827]/10"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInventory}
                disabled={loadingInventory}
                className="border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${loadingInventory ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
              <p className="text-xs text-[#6B7280]">
                Total Products
              </p>
              <p className="text-lg font-semibold text-[#111827]">
                {inventory.length}
              </p>
            </div>
            <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
              <p className="text-xs text-[#92400E]">
                Low Stock
              </p>
              <p className="text-lg font-semibold text-[#B45309]">
                {lowStockCount}
              </p>
            </div>
            <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2">
              <p className="text-xs text-[#991B1B]">
                Out of Stock
              </p>
              <p className="text-lg font-semibold text-[#B91C1C]">
                {outOfStockCount}
              </p>
            </div>
          </div>

          {loadingInventory && inventory.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">
              Loading inventory...
            </p>
          ) : inventory.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">
              No products found in Product Master.
            </p>
          ) : filteredInventory.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">
              No products match your search.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 font-semibold text-[#111827]">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#111827]">
                      Product Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#111827]">
                      Unit
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#111827]">
                      Qty on-hand
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[#111827]">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#E5E7EB] last:border-b-0"
                    >
                      <td className="py-3 px-4 font-mono text-[#00A3AD]">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111827]">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-[#111827]">
                        {item.unit || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${item.status === "zero" ? "text-[#F97316]" : "text-[#111827]"}`}
                        >
                          {item.systemCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6B7280]">
                        {item.lastUpdated
                          ? new Date(
                              item.lastUpdated,
                            ).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showGrnForm && (
        <div className="sticky bottom-0 z-10 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-2xl mx-auto space-y-2">
            {isPosted ? (
              <div className="w-full h-14 flex items-center justify-center gap-2 rounded-md bg-green-50 border border-green-300 text-green-700 font-semibold">
                <CheckCircle className="w-5 h-5" />
                Posted - {savedGrnNumber}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleSaveGrn}
                  disabled={isSaving || isPosting}
                  variant="outline"
                  className="h-14 border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10 font-semibold disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isSaving ? "Saving..." : "Save GRN"}
                </Button>
                <Button
                  onClick={handlePostGrn}
                  disabled={isSaving || isPosting}
                  className="h-14 bg-[#059669] hover:bg-[#047857] text-white shadow-lg font-semibold disabled:opacity-50"
                >
                  <SendHorizonal className="w-5 h-5 mr-2" />
                  {isPosting ? "Posting..." : "Post GRN"}
                </Button>
              </div>
            )}
            {!isPosted && savedGrnId && (
              <p className="text-xs text-center text-[#6B7280]">
                GRN saved as draft - click{" "}
                <strong>Post GRN</strong> to update inventory
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}