import { useState } from "react";
import { 
  Plus, 
  Send, 
  FileText, 
  Plane,
  Ship,
  Download,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PerItemTracker } from "../PerItemTracker";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: "draft" | "posted" | "in-transit" | "received";
}

const mockPOs: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-JP-2026-0001",
    supplier: "Takeda Pharmaceutical (Tokyo)",
    date: "2026-02-15",
    items: 8,
    total: 458000,
    status: "in-transit"
  },
  {
    id: "2",
    poNumber: "PO-JP-2026-0002",
    supplier: "Astellas Pharma (Osaka)",
    date: "2026-02-18",
    items: 12,
    total: 672000,
    status: "posted"
  },
  {
    id: "3",
    poNumber: "PO-JP-2026-0003",
    supplier: "Daiichi Sankyo (Tokyo)",
    date: "2026-02-19",
    items: 5,
    total: 298000,
    status: "draft"
  },
];

const freightTracking = [
  {
    id: "1",
    type: "air",
    poNumber: "PO-JP-2026-0001",
    carrier: "Japan Airlines Cargo",
    departure: "Tokyo Narita (NRT)",
    arrival: "Manila NAIA (MNL)",
    eta: "2026-02-23",
    progress: 65
  },
  {
    id: "2",
    type: "sea",
    poNumber: "PO-JP-2025-0124",
    carrier: "Nippon Yusen (NYK Line)",
    departure: "Port of Yokohama",
    arrival: "Port of Manila",
    eta: "2026-02-28",
    progress: 42
  },
];

export function InboundProcurement() {
  const [showPOForm, setShowPOForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const count = mockPOs.length + 1;
    return `PO-JP-${year}-${String(count).padStart(4, '0')}`;
  };

  const handleSendToSupplier = (po: PurchaseOrder) => {
    toast.success(`P.O. ${po.poNumber} sent to ${po.supplier}`, {
      description: "Email notification dispatched successfully"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-[#D1D5DB] text-[#111827]";
      case "posted": return "bg-[#00A3AD] text-white";
      case "in-transit": return "bg-[#1A2B47] text-white";
      case "received": return "bg-[#00A3AD] text-white";
      default: return "bg-[#E5E7EB] text-[#111827]";
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2 text-[#111827]">
            Inbound Procurement & Logistics
          </h1>
          <p className="text-[#6B7280]">Manage purchase orders and track shipments from Japan</p>
        </div>
        <Button
          onClick={() => setShowPOForm(!showPOForm)}
          className="bg-[#00A3AD] hover:bg-[#0891B2] text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New P.O.
        </Button>
      </div>

      {/* Main Content - Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Pane - P.O. List */}
        <Card className="bg-white border-[#111827]/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">
              Japan P.O. Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="posted">Posted</TabsTrigger>
                <TabsTrigger value="in-transit">In-Transit</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {mockPOs.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedPO?.id === po.id
                        ? "border-[#00A3AD] bg-[#00A3AD]/5"
                        : "border-[#E5E7EB] hover:border-[#00A3AD]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-[#111827]">{po.poNumber}</div>
                        <div className="text-sm text-[#6B7280]">{po.supplier}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">{po.items} items</span>
                      <span className="font-semibold text-[#111827]">₱{po.total.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-[#6B7280] mt-2">{po.date}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="draft" className="space-y-3">
                {mockPOs.filter(po => po.status === "draft").map((po) => (
                  <div key={po.id} className="p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="font-semibold text-[#111827]">{po.poNumber}</div>
                    <div className="text-sm text-[#6B7280]">{po.supplier}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="posted" className="space-y-3">
                {mockPOs.filter(po => po.status === "posted").map((po) => (
                  <div key={po.id} className="p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="font-semibold text-[#111827]">{po.poNumber}</div>
                    <div className="text-sm text-[#6B7280]">{po.supplier}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="in-transit" className="space-y-3">
                {mockPOs.filter(po => po.status === "in-transit").map((po) => (
                  <div key={po.id} className="p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="font-semibold text-[#111827]">{po.poNumber}</div>
                    <div className="text-sm text-[#6B7280]">{po.supplier}</div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Pane - P.O. Details/Builder */}
        <Card className="bg-white border-[#111827]/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] font-semibold">
              {selectedPO ? "P.O. Details" : "P.O. Builder"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPO ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#6B7280]">P.O. Number</Label>
                    <div className="text-[#111827] font-medium mt-1">{selectedPO.poNumber}</div>
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">Status</Label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPO.status)}`}>
                        {selectedPO.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">Date</Label>
                    <div className="text-[#111827] mt-1">{selectedPO.date}</div>
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">Total</Label>
                    <div className="text-[#111827] font-semibold mt-1">₱{selectedPO.total.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-[#6B7280]">Supplier</Label>
                  <div className="text-[#111827] mt-1">{selectedPO.supplier}</div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSendToSupplier(selectedPO)}
                    className="flex-1 bg-[#00A3AD] hover:bg-[#0891B2] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Supplier
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC]"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>P.O. Number</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={generatePONumber()}
                      readOnly
                      className="bg-[#F8FAFC] border-[#111827]/10 rounded-lg"
                      style={{ fontFamily: 'Public Sans, sans-serif' }}
                    />
                    <Button
                      size="sm"
                      className="bg-[#00A3AD] hover:bg-[#0891B2] text-white rounded-lg"
                      style={{ fontFamily: 'Public Sans, sans-serif' }}
                      onClick={() => toast.success("P.O. Number Generated")}
                    >
                      Auto-Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Supplier</Label>
                  <Input
                    placeholder="Select Japanese supplier..."
                    className="mt-2 border-[#111827]/10 rounded-lg"
                    style={{ fontFamily: 'Public Sans, sans-serif' }}
                  />
                </div>

                <div>
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    className="mt-2 border-[#111827]/10 rounded-lg"
                    style={{ fontFamily: 'Public Sans, sans-serif' }}
                  />
                </div>

                {/* Preferred Communication Dropdown */}
                <div>
                  <Label>Preferred Communication</Label>
                  <Select>
                    <SelectTrigger className="mt-2 border-[#111827]/10 rounded-lg" style={{ fontFamily: 'Public Sans, sans-serif' }}>
                      <SelectValue placeholder="Choose communication method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="viber">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-[#7360F2]" />
                          Viber
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-[#00A3AD]" />
                          Email
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Items</Label>
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC] rounded-lg"
                    style={{ fontFamily: 'Public Sans, sans-serif' }}
                    onClick={() => toast.info("Add Line Item clicked")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => toast.success("P.O. Filed", { description: "Draft saved successfully" })}
                    className="w-full bg-[#00A3AD] hover:bg-[#0891B2] text-white rounded-lg font-bold"
                    style={{ fontFamily: 'Public Sans, sans-serif' }}
                  >
                    Create Draft P.O.
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Freight Monitor */}
      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold">
            Freight Monitor
          </CardTitle>
          <p className="text-sm text-[#6B7280]">Track shipments from Japan to Philippines</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="air" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="air">
                <Plane className="w-4 h-4 mr-2" />
                Freight Air
              </TabsTrigger>
              <TabsTrigger value="sea">
                <Ship className="w-4 h-4 mr-2" />
                Freight Sea
              </TabsTrigger>
            </TabsList>

            {["air", "sea"].map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-4">
                {freightTracking
                  .filter((freight) => freight.type === mode)
                  .map((freight) => (
                    <div key={freight.id} className="p-6 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-[#111827]">{freight.poNumber}</div>
                          <div className="text-sm text-[#6B7280]">{freight.carrier}</div>
                        </div>
                        <div className="text-sm font-medium text-[#00A3AD]">ETA: {freight.eta}</div>
                      </div>

                      {/* Progress Line */}
                      <div className="relative mb-4">
                        <div className="flex justify-between text-xs text-[#6B7280] mb-2">
                          <span>{freight.departure}</span>
                          <span>{freight.arrival}</span>
                        </div>
                        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A3AD] transition-all duration-500"
                            style={{ width: `${freight.progress}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-[#00A3AD] mt-1 text-center">
                          {freight.progress}% Complete
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Per-Item Progress Tracker (Shopee/Lazada Style) */}
      <div>
        <h2 className="text-2xl font-bold text-[#111827] mb-4" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          Per-Order Item Status Tracker
        </h2>
        <p className="text-[#6B7280] mb-6" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          Track each P.O. through every milestone from order to delivery
        </p>
        
        <div className="grid grid-cols-1 gap-6">
          <PerItemTracker
            poNumber="PO-JP-2026-0001"
            steps={[
              { label: "Order Received", completed: true, active: false },
              { label: "Packaging (Supplier)", completed: true, active: false },
              { label: "Handed to Freight", completed: true, active: false },
              { label: "Arrived at Customs (PH)", completed: false, active: true },
              { label: "Warehouse Ready", completed: false, active: false }
            ]}
          />
          
          <PerItemTracker
            poNumber="PO-JP-2026-0002"
            steps={[
              { label: "Order Received", completed: true, active: false },
              { label: "Packaging (Supplier)", completed: false, active: true },
              { label: "Handed to Freight", completed: false, active: false },
              { label: "Arrived at Customs (PH)", completed: false, active: false },
              { label: "Warehouse Ready", completed: false, active: false }
            ]}
          />
          
          <PerItemTracker
            poNumber="PO-JP-2025-0124"
            steps={[
              { label: "Order Received", completed: true, active: false },
              { label: "Packaging (Supplier)", completed: true, active: false },
              { label: "Handed to Freight", completed: false, active: true },
              { label: "Arrived at Customs (PH)", completed: false, active: false },
              { label: "Warehouse Ready", completed: false, active: false }
            ]}
          />
        </div>
      </div>
    </div>
  );
}