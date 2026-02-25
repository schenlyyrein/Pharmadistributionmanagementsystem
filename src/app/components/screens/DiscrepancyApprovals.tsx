import { useState } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye,
  FileText,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Discrepancy {
  id: string;
  poNumber: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  variance: number;
  status: "pending" | "approved" | "rejected";
  reportedBy: string;
  dateReported: string;
  notes: string;
}

const mockDiscrepancies: Discrepancy[] = [
  {
    id: "1",
    poNumber: "PO-2026-002",
    productName: "Amoxicillin 500mg",
    sku: "AMX-500",
    expectedQty: 10000,
    receivedQty: 9850,
    variance: -150,
    status: "pending",
    reportedBy: "Maria Santos",
    dateReported: "2026-02-24",
    notes: "Short delivery - 3 boxes missing"
  },
  {
    id: "2",
    poNumber: "PO-2026-003",
    productName: "Medical Syringe 50ml",
    sku: "SYR-50ML",
    expectedQty: 5000,
    receivedQty: 5200,
    variance: 200,
    status: "pending",
    reportedBy: "Juan Reyes",
    dateReported: "2026-02-23",
    notes: "Over delivery - extra box included"
  }
];

export function DiscrepancyApprovals() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>(mockDiscrepancies);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDiscrepancies = discrepancies.filter((disc) => {
    if (statusFilter === "all") return true;
    return disc.status === statusFilter;
  });

  const handleApprove = (id: string) => {
    setDiscrepancies(discrepancies.map(d => 
      d.id === id ? { ...d, status: "approved" as const } : d
    ));
  };

  const handleReject = (id: string) => {
    setDiscrepancies(discrepancies.map(d => 
      d.id === id ? { ...d, status: "rejected" as const } : d
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-[#F97316] text-white";
      case "approved": return "bg-[#00A3AD] text-white";
      case "rejected": return "bg-[#DC2626] text-white";
      default: return "bg-[#D1D5DB] text-[#111827]";
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return "text-[#F97316]";
    if (variance > 0) return "text-[#00A3AD]";
    return "text-[#111827]";
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2 text-[#111827]">
            Discrepancy Approvals
          </h1>
          <p className="text-[#6B7280]">Review and approve inventory discrepancies</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-[#111827]/10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">
                  {discrepancies.filter(d => d.status === "pending").length}
                </div>
                <div className="text-sm text-[#6B7280]">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#00A3AD]/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#00A3AD]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">
                  {discrepancies.filter(d => d.status === "approved").length}
                </div>
                <div className="text-sm text-[#6B7280]">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-[#DC2626]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">
                  {discrepancies.filter(d => d.status === "rejected").length}
                </div>
                <div className="text-sm text-[#6B7280]">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancies List */}
      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold">
            Discrepancy Reports ({filteredDiscrepancies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDiscrepancies.map((discrepancy) => (
              <Card key={discrepancy.id} className="border-[#111827]/10">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Main Info */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[#00A3AD] font-semibold">
                              {discrepancy.poNumber}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(discrepancy.status)}`}>
                              {discrepancy.status.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-[#111827]">
                            {discrepancy.productName}
                          </h3>
                          <p className="text-sm text-[#6B7280]">SKU: {discrepancy.sku}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-3 bg-[#F8FAFC] rounded-lg">
                        <div>
                          <Label className="text-xs text-[#6B7280]">Expected</Label>
                          <p className="text-lg font-bold text-[#111827]">
                            {discrepancy.expectedQty.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#6B7280]">Received</Label>
                          <p className="text-lg font-bold text-[#111827]">
                            {discrepancy.receivedQty.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#6B7280]">Variance</Label>
                          <p className={`text-lg font-bold ${getVarianceColor(discrepancy.variance)}`}>
                            {discrepancy.variance > 0 ? "+" : ""}{discrepancy.variance.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#6B7280]">Reported by:</span>
                          <span className="text-[#111827] font-medium">{discrepancy.reportedBy}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#6B7280]">Date:</span>
                          <span className="text-[#111827]">{discrepancy.dateReported}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[#6B7280]">Notes:</span>
                          <p className="text-[#111827] mt-1">{discrepancy.notes}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-5 flex flex-col justify-center gap-3">
                      {discrepancy.status === "pending" ? (
                        <>
                          <Button
                            onClick={() => handleApprove(discrepancy.id)}
                            className="bg-[#00A3AD] hover:bg-[#0891B2] text-white w-full"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Discrepancy
                          </Button>
                          <Button
                            onClick={() => handleReject(discrepancy.id)}
                            variant="outline"
                            className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10 w-full"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject & Investigate
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[#111827]/20 text-[#111827] w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </>
                      ) : (
                        <div className="text-center p-4 bg-[#F8FAFC] rounded-lg">
                          <p className="text-sm text-[#6B7280]">
                            This discrepancy has been {discrepancy.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
