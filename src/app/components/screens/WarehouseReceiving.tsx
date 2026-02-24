import { useState } from "react";
import { 
  ScanBarcode, 
  AlertTriangle, 
  CheckCircle,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  batch: string;
  systemCount: number;
  physicalCount?: number;
  status: "normal" | "low" | "zero";
  expiry: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    sku: "AMX-500",
    name: "Amoxicillin 500mg",
    batch: "#9902",
    systemCount: 12500,
    status: "normal",
    expiry: "2026-12-31"
  },
  {
    id: "2",
    sku: "PAR-500",
    name: "Paracetamol 500mg",
    batch: "#9903",
    systemCount: 18200,
    status: "normal",
    expiry: "2027-03-15"
  },
  {
    id: "3",
    sku: "CET-10",
    name: "Cetirizine 10mg",
    batch: "#9904",
    systemCount: 320,
    status: "low",
    expiry: "2026-08-20"
  },
  {
    id: "4",
    sku: "MET-500",
    name: "Metformin 500mg",
    batch: "#9905",
    systemCount: 0,
    status: "zero",
    expiry: "2026-11-10"
  },
  {
    id: "5",
    sku: "IBU-400",
    name: "Ibuprofen 400mg",
    batch: "#9906",
    systemCount: 8900,
    status: "normal",
    expiry: "2027-01-25"
  },
];

export function WarehouseReceiving() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [physicalCount, setPhysicalCount] = useState("");
  const [reasonCode, setReasonCode] = useState("");

  const hasDiscrepancy = selectedItem && physicalCount && 
    parseInt(physicalCount) !== selectedItem.systemCount;

  const handleScan = () => {
    // Simulate barcode scan
    const randomItem = mockInventory[Math.floor(Math.random() * mockInventory.length)];
    setSelectedItem(randomItem);
    setPhysicalCount("");
    setReasonCode("");
    toast.success("Barcode Scanned", {
      description: `${randomItem.name} - Batch ${randomItem.batch}`
    });
  };

  const handlePostGRN = () => {
    if (!selectedItem || !physicalCount) {
      toast.error("Missing Information", {
        description: "Please complete all required fields"
      });
      return;
    }

    if (hasDiscrepancy && !reasonCode) {
      toast.error("Discrepancy Detected", {
        description: "Please provide a reason code for the count discrepancy"
      });
      return;
    }

    toast.success("GRN Posted", {
      description: "Inventory updated successfully"
    });
    setSelectedItem(null);
    setPhysicalCount("");
    setReasonCode("");
  };

  return (
    <div className="p-4 space-y-6 bg-white pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-4xl font-semibold mb-2 text-[#111827]">
          Warehouse Receiving & GRN
        </h1>
        <p className="text-sm lg:text-base text-[#6B7280]">Mobile-optimized goods receipt and stock verification</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleScan}
          className="h-20 bg-[#00A3AD] hover:bg-[#0891B2] text-white flex flex-col gap-2 shadow-md"
        >
          <ScanBarcode className="w-8 h-8" />
          <span className="font-semibold">Scan Barcode</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10 flex flex-col gap-2"
        >
          <Package className="w-8 h-8" />
          <span className="font-semibold">View GRN</span>
        </Button>
      </div>

      {/* GRN Entry Form */}
      {selectedItem && (
        <Card className="bg-white border-[#111827]/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">
              GRN Entry Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Info */}
            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
              <div className="text-lg font-semibold mb-1 text-[#111827]">
                {selectedItem.name}
              </div>
              <div className="text-sm text-[#6B7280]">
                SKU: {selectedItem.sku} | Batch: {selectedItem.batch}
              </div>
              <div className="text-sm text-[#6B7280] mt-1">
                Expiry: {selectedItem.expiry}
              </div>
            </div>

            {/* Verification Fields - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#6B7280]">System Count</Label>
                <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg text-center border border-[#E5E7EB]">
                  <div className="text-2xl font-bold text-[#111827]">
                    {selectedItem.systemCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1 font-medium">Expected</div>
                </div>
              </div>

              <div>
                <Label className="text-[#6B7280]">Physical Count</Label>
                <Input
                  type="number"
                  placeholder="Enter count"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  className="mt-2 text-center text-2xl h-[72px] border-[#111827]/10 font-bold"
                />
              </div>
            </div>

            {/* Discrepancy Alert - Safety Orange */}
            {hasDiscrepancy && (
              <div className="p-4 bg-[#F97316] text-white rounded-lg space-y-3 shadow-md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Discrepancy Detected</div>
                    <div className="text-sm opacity-90">
                      Difference: {Math.abs(parseInt(physicalCount) - selectedItem.systemCount)} units
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block font-medium">Reason Code (Required)</Label>
                  <Select value={reasonCode} onValueChange={setReasonCode}>
                    <SelectTrigger className="bg-white text-[#111827] border-0">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged in Transit</SelectItem>
                      <SelectItem value="shortage">Supplier Shortage</SelectItem>
                      <SelectItem value="count_error">Count Error</SelectItem>
                      <SelectItem value="expired">Expired Items</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock-on-Hand List */}
      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold">
            Stock-on-Hand
          </CardTitle>
          <p className="text-sm text-[#6B7280]">Current inventory levels</p>
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
                {(item.status === "zero" || item.status === "low") && (
                  <span className="px-3 py-1 bg-[#F97316] text-white text-xs rounded-full whitespace-nowrap font-medium">
                    {item.status === "zero" ? "Out of Stock" : "Restock"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold" style={{ color: item.status === "zero" ? "#F97316" : "#111827" }}>
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

      {/* Sticky Footer Button - Only show when form is active */}
      {selectedItem && (
        <div className="fixed bottom-16 lg:bottom-8 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <Button
              onClick={handlePostGRN}
              disabled={!physicalCount || (hasDiscrepancy && !reasonCode)}
              className="w-full h-14 bg-[#00A3AD] hover:bg-[#0891B2] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Post GRN & Update Inventory
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
