import { useState } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Package,
  MapPin,
  ArrowRightLeft,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface StockItem {
  id: string;
  sku: string;
  name: string;
  location: string;
  zone: string;
  aisle: string;
  bin: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: "healthy" | "low" | "critical" | "overstock";
  lastRestocked: string;
}

const mockStock: StockItem[] = [
  {
    id: "1",
    sku: "AMX-500",
    name: "Amoxicillin 500mg",
    location: "Main Warehouse Manila",
    zone: "Zone A",
    aisle: "A-01",
    bin: "Bin 15",
    currentStock: 12500,
    minStock: 1000,
    maxStock: 15000,
    status: "healthy",
    lastRestocked: "2026-02-15",
  },
  {
    id: "2",
    sku: "CET-10",
    name: "Cetirizine 10mg",
    location: "Main Warehouse Manila",
    zone: "Zone A",
    aisle: "A-03",
    bin: "Bin 22",
    currentStock: 320,
    minStock: 1200,
    maxStock: 5000,
    status: "critical",
    lastRestocked: "2026-01-10",
  },
  {
    id: "3",
    sku: "MET-500",
    name: "Metformin 500mg",
    location: "Main Warehouse Manila",
    zone: "Zone A",
    aisle: "A-05",
    bin: "Bin 08",
    currentStock: 850,
    minStock: 800,
    maxStock: 4000,
    status: "low",
    lastRestocked: "2026-02-01",
  },
  {
    id: "4",
    sku: "PAR-500",
    name: "Paracetamol 500mg",
    location: "Satellite Hub Quezon City",
    zone: "Zone B",
    aisle: "B-02",
    bin: "Bin 45",
    currentStock: 18200,
    minStock: 1500,
    maxStock: 10000,
    status: "overstock",
    lastRestocked: "2026-02-18",
  },
  {
    id: "5",
    sku: "IBU-400",
    name: "Ibuprofen 400mg",
    location: "Main Warehouse Manila",
    zone: "Zone A",
    aisle: "A-02",
    bin: "Bin 18",
    currentStock: 8900,
    minStock: 800,
    maxStock: 12000,
    status: "healthy",
    lastRestocked: "2026-02-12",
  },
  {
    id: "6",
    sku: "LOS-50",
    name: "Losartan 50mg",
    location: "Satellite Hub Makati",
    zone: "Zone C",
    aisle: "C-01",
    bin: "Bin 03",
    currentStock: 450,
    minStock: 600,
    maxStock: 3000,
    status: "low",
    lastRestocked: "2026-01-28",
  },
];

const warehouseLocations = [
  "Main Warehouse Manila",
  "Satellite Hub Quezon City",
  "Satellite Hub Makati",
  "Cold Storage Facility",
];

export function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] =
    useState<string>("all");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [showTransferDialog, setShowTransferDialog] =
    useState(false);
  const [selectedItem, setSelectedItem] =
    useState<StockItem | null>(null);

  const filteredStock = mockStock.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      item.sku.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword);
    const matchesLocation =
      locationFilter === "all" ||
      item.location === locationFilter;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const lowStockItems = mockStock.filter(
    (item) =>
      item.status === "low" || item.status === "critical",
  );
  const criticalItems = mockStock.filter(
    (item) => item.status === "critical",
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-[#00A3AD] text-white";
      case "low":
        return "bg-[#F97316] text-white";
      case "critical":
        return "bg-[#DC2626] text-white";
      case "overstock":
        return "bg-[#1A2B47] text-white";
      default:
        return "bg-[#D1D5DB] text-[#111827]";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "low" || status === "critical") {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (status === "overstock") {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  const handleStockTransfer = () => {
    toast.success("Stock Transfer Initiated", {
      description:
        "Transfer request has been logged and will be processed",
    });
    setShowTransferDialog(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F8FAFC]">
      <div>
        <h1 className="text-3xl lg:text-4xl font-semibold mb-2 text-[#111827]">
          Stock Management & Alerts
        </h1>
        <p className="text-[#6B7280]">
          Real-time inventory levels across warehouse locations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-[#111827]/10 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#00A3AD]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#00A3AD]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">
                  {mockStock.length}
                </div>
                <div className="text-sm text-[#6B7280]">
                  Total SKUs Tracked
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#F97316]/20 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F97316]">
                  {lowStockItems.length}
                </div>
                <div className="text-sm text-[#6B7280]">
                  Low Stock Alerts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#DC2626]/20 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#DC2626]">
                  {criticalItems.length}
                </div>
                <div className="text-sm text-[#6B7280]">
                  Critical - Restock Now
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#F97316]/30 shadow-lg">
        <CardHeader className="bg-[#F97316]/5">
          <CardTitle className="text-[#111827] font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F97316]" />
            Low Stock Alerts - Immediate Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 ${
                  item.status === "critical"
                    ? "border-[#DC2626] bg-[#DC2626]/5"
                    : "border-[#F97316] bg-[#F97316]/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-[#111827] mb-1">
                      {item.name}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      SKU: {item.sku}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "critical"
                        ? "bg-[#DC2626] text-white"
                        : "bg-[#F97316] text-white"
                    }`}
                  >
                    {getStatusIcon(item.status)}
                    {item.status === "critical"
                      ? "Restock Needed"
                      : "Low Stock"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Current Stock
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        item.status === "critical"
                          ? "text-[#DC2626]"
                          : "text-[#F97316]"
                      }`}
                    >
                      {item.currentStock.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Min Stock Level
                    </div>
                    <div className="text-lg font-semibold text-[#111827]">
                      {item.minStock.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B7280] mb-1">
                      Shortage
                    </div>
                    <div className="text-lg font-bold text-[#F97316]">
                      -
                      {(
                        item.minStock - item.currentStock
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6B7280]">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {item.location} • {item.zone} • {item.aisle}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#00A3AD] hover:bg-[#0891B2] text-white"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowTransferDialog(true);
                    }}
                  >
                    Create P.O.
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label className="text-[#6B7280] mb-2 block">
                Search (SKU/Product)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <Input
                  placeholder="Search by SKU or product name..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10 border-[#111827]/10"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#6B7280] mb-2 block">
                Warehouse Location
              </Label>
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger className="border-[#111827]/10">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Locations
                  </SelectItem>
                  {warehouseLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#6B7280] mb-2 block">
                Stock Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="border-[#111827]/10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Status
                  </SelectItem>
                  <SelectItem value="healthy">
                    Healthy
                  </SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="critical">
                    Critical
                  </SelectItem>
                  <SelectItem value="overstock">
                    Overstock
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end md:col-span-4 lg:col-span-1">
              <Dialog
                open={showTransferDialog}
                onOpenChange={setShowTransferDialog}
              >
                <DialogTrigger asChild>
                  <Button className="w-full bg-[#00A3AD] hover:bg-[#0891B2] text-white">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Stock Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[#111827]">
                      Stock Transfer Request
                    </DialogTitle>
                    <DialogDescription className="text-[#6B7280]">
                      Transfer stock between warehouse locations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Product</Label>
                      <Select>
                        <SelectTrigger className="mt-2 border-[#111827]/10">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockStock.map((item) => (
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
                      <Label>From Location</Label>
                      <Select>
                        <SelectTrigger className="mt-2 border-[#111827]/10">
                          <SelectValue placeholder="Select source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouseLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>To Location</Label>
                      <Select>
                        <SelectTrigger className="mt-2 border-[#111827]/10">
                          <SelectValue placeholder="Select destination..." />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouseLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setShowTransferDialog(false)
                      }
                      className="border-[#111827]/20 text-[#111827]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStockTransfer}
                      className="bg-[#00A3AD] hover:bg-[#0891B2] text-white"
                    >
                      Initiate Transfer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold">
            Stock Levels by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1A2B47]">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    SKU
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Product
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Location
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Zone/Aisle/Bin
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Current
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Min/Max
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">
                    Last Restocked
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-[#00A3AD] font-semibold">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#111827] font-medium">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">
                      {item.location}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">
                      {item.zone} • {item.aisle} • {item.bin}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          item.status === "critical" ||
                          item.status === "low"
                            ? "text-[#F97316]"
                            : "text-[#111827]"
                        }`}
                      >
                        {item.currentStock.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-[#6B7280]">
                      {item.minStock.toLocaleString()} /{" "}
                      {item.maxStock.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">
                      {item.lastRestocked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}