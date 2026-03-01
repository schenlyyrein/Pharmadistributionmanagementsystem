import { useState } from "react";
import {
  ScanBarcode,
  CheckCircle,
  Package,
  Plus,
  Trash2,
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

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  batch: string;
  systemCount: number;
  status: "normal" | "low" | "zero";
  expiry: string;
}

interface GrnLine {
  lineId: string;
  productId: string;
  qtyExpected: string;
  qtyReceived: string;
  discrepancyReason: string;
  otherReason: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    sku: "AMX-500",
    name: "Amoxicillin 500mg",
    batch: "#9902",
    systemCount: 12500,
    status: "normal",
    expiry: "2026-12-31",
  },
  {
    id: "2",
    sku: "PAR-500",
    name: "Paracetamol 500mg",
    batch: "#9903",
    systemCount: 18200,
    status: "normal",
    expiry: "2027-03-15",
  },
  {
    id: "3",
    sku: "CET-10",
    name: "Cetirizine 10mg",
    batch: "#9904",
    systemCount: 320,
    status: "low",
    expiry: "2026-08-20",
  },
  {
    id: "4",
    sku: "MET-500",
    name: "Metformin 500mg",
    batch: "#9905",
    systemCount: 0,
    status: "zero",
    expiry: "2026-11-10",
  },
  {
    id: "5",
    sku: "IBU-400",
    name: "Ibuprofen 400mg",
    batch: "#9906",
    systemCount: 8900,
    status: "normal",
    expiry: "2027-01-25",
  },
];

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
  const [lastScannedItem, setLastScannedItem] =
    useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasDiscrepancy = lines.some((line) => {
  const expected = Number(line.qtyExpected);
  const received = Number(line.qtyReceived);

  return (
    Number.isFinite(expected) &&
    Number.isFinite(received) &&
    line.qtyExpected !== "" &&
    line.qtyReceived !== "" &&
    expected !== received
  );
});

  const insertScannedItemToLines = (item: InventoryItem) => {
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
    const randomItem =
      mockInventory[
        Math.floor(Math.random() * mockInventory.length)
      ];
    setLastScannedItem(randomItem);

    if (showGrnForm) {
      insertScannedItemToLines(randomItem);
      toast.success("Barcode Scanned", {
        description: `${randomItem.name} added to GRN line items`,
      });
      return;
    }

    toast.success("Barcode Scanned", {
      description: `${randomItem.name} scanned. Click View GRN to continue.`,
    });
  };

  const handleViewGrn = () => {
    setShowGrnForm(true);
    if (lastScannedItem) {
      insertScannedItemToLines(lastScannedItem);
      setLastScannedItem(null);
    }
  };

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (lineId: string) => {
    setLines((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((line) => line.lineId !== lineId),
    );
  };

  const updateLine = (
    lineId: string,
    field: keyof GrnLine,
    value: string,
  ) => {
    setLines((prev) =>
      prev.map((line) =>
        line.lineId === lineId
          ? { ...line, [field]: value }
          : line,
      ),
    );
  };

  const handleSaveGrn = async () => {
    if (!receivedDate) {
      toast.error("Missing received date");
      return;
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const expected = Number(line.qtyExpected);
      const received = Number(line.qtyReceived);
      const mismatch =
        Number.isFinite(expected) &&
        Number.isFinite(received) &&
        line.qtyExpected !== "" &&
        line.qtyReceived !== "" &&
        expected !== received;

      if (!line.productId) {
        toast.error(`Line ${i + 1}: Product is required`);
        return;
      }

      if (!Number.isFinite(expected) || expected < 0) {
        toast.error(
          `Line ${i + 1}: Qty expected must be 0 or higher`,
        );
        return;
      }

      if (!Number.isFinite(received) || received < 0) {
        toast.error(
          `Line ${i + 1}: Qty received must be 0 or higher`,
        );
        return;
      }

      if (mismatch && !line.discrepancyReason) {
        toast.error(
          `Line ${i + 1}: Discrepancy reason is required`,
        );
        return;
      }

      if (
        mismatch &&
        line.discrepancyReason === "other" &&
        !line.otherReason.trim()
      ) {
        toast.error(`Line ${i + 1}: Please type Other reason`);
        return;
      }
    }

    const grnId = crypto.randomUUID();
    const dateStamp = receivedDate.replace(/-/g, "");
    const timeStamp = new Date()
      .toISOString()
      .slice(11, 19)
      .replace(/:/g, "");
    const grnNumber = `GRN-${dateStamp}-${timeStamp}`;

    const hasDiscrepancy = lines.some((line) => {
    const expected = Number(line.qtyExpected)
    const received = Number(line.qtyReceived)
    return Number.isFinite(expected) && Number.isFinite(received) && expected !== received
})

    const headerPayload = {
      id: grnId,
      grn_number: grnNumber,
      received_date: receivedDate,
      notes: notes.trim() || null,
      status: "draft",
      created_by: "warehouse_operator",
      has_discrepancy: hasDiscrepancy,
    };

    const linePayload = lines.map((line, idx) => {
      const product = mockInventory.find(
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
        product_name: product?.name || "Unknown Product",
        sku: product?.sku || "N/A",
        qty_expected: expected,
        qty_received: received,
        variance: received - expected,
        discrepancy_reason: reason,
      };
    });

    setIsSaving(true);
    try {
      const headerRes = await fetch(
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

      if (!headerRes.ok)
        throw new Error(await headerRes.text());

      const linesRes = await fetch(
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

      if (!linesRes.ok) throw new Error(await linesRes.text());

      toast.success(`GRN ${grnNumber} saved`, {
        description: `${linePayload.length} line item(s) recorded`,
      });

      setReceivedDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setLines([createEmptyLine()]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save GRN";
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
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

          {hasDiscrepancy && (
  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-semibold">
    Discrepancy detected
  </div>
)}
          {hasDiscrepancy && (
  <div className="mb-4 px-3 py-2 rounded-md bg-[#F97316] text-white font-semibold">
    Discrepancy detected
  </div>
)}
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
                        disabled={lines.length === 1}
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
                          onValueChange={(value) =>
                            updateLine(
                              line.lineId,
                              "productId",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="mt-2 border-[#111827]/10 bg-white">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockInventory.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.id}
                              >
                                {item.name} ({item.sku})
                              </SelectItem>
                            ))}
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
                        />
                      </div>

                      <div>
                        <Label className="text-[#6B7280]">
                          Qty Received
                        </Label>
                        <Input
                          type="number"
                          min="0"
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
                          onValueChange={(value) =>
                            updateLine(
                              line.lineId,
                              "discrepancyReason",
                              value,
                            )
                          }
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
          <CardTitle className="text-[#111827] font-semibold">
            Stock-on-Hand
          </CardTitle>
          <p className="text-sm text-[#6B7280]">
            Current inventory levels
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockInventory.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                item.status === "zero" || item.status === "low"
                  ? "border-[#F97316] bg-[#F97316]/5 shadow-sm"
                  : "border-[#E5E7EB] hover:border-[#00A3AD]"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-[#111827] mb-1">
                    {item.name}
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    SKU: {item.sku} | Batch: {item.batch}
                  </div>
                </div>
                {(item.status === "zero" ||
                  item.status === "low") && (
                  <span className="px-3 py-1 bg-[#F97316] text-white text-xs rounded-full whitespace-nowrap font-medium">
                    {item.status === "zero"
                      ? "Out of Stock"
                      : "Restock"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      item.status === "zero"
                        ? "#F97316"
                        : "#111827",
                  }}
                >
                  {item.systemCount.toLocaleString()}
                </div>
                <div className="text-sm text-[#6B7280] font-medium">
                  Exp: {item.expiry}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {showGrnForm && (
        <div className="sticky bottom-0 z-10 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSaveGrn}
              disabled={isSaving}
              className="w-full h-14 bg-[#00A3AD] hover:bg-[#0891B2] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {isSaving ? "Saving..." : "Save GRN"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}