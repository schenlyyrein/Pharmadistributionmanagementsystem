import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Barcode,
  Package,
  FileText
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "sonner";
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: "Pharma" | "Medical Supplies" | "Cold Chain";
  barcode: string;
  supplier: string;
  minStock: number;
  currentStock: number;
  unitPrice: number;
  location: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    sku: "AMX-500",
    name: "Amoxicillin 500mg",
    category: "Pharma",
    barcode: "4987654321098",
    supplier: "Takeda Pharmaceutical",
    minStock: 1000,
    currentStock: 12500,
    unitPrice: 50,
    location: "Zone A-01"
  },
  {
    id: "2",
    sku: "PAR-500",
    name: "Paracetamol 500mg",
    category: "Pharma",
    barcode: "4987654321105",
    supplier: "Astellas Pharma",
    minStock: 1500,
    currentStock: 18200,
    unitPrice: 20,
    location: "Zone A-02"
  },
  {
    id: "3",
    sku: "SYR-50ML",
    name: "Medical Syringe 50ml (Sterile)",
    category: "Medical Supplies",
    barcode: "4987654321112",
    supplier: "Terumo Corporation",
    minStock: 500,
    currentStock: 2400,
    unitPrice: 15,
    location: "Zone B-05"
  },
  {
    id: "4",
    sku: "VAC-COVID",
    name: "COVID-19 Vaccine (Pfizer)",
    category: "Cold Chain",
    barcode: "4987654321129",
    supplier: "Pfizer Japan",
    minStock: 100,
    currentStock: 450,
    unitPrice: 2500,
    location: "Cold Storage CS-01"
  },
  {
    id: "5",
    sku: "IBU-400",
    name: "Ibuprofen 400mg",
    category: "Pharma",
    barcode: "4987654321136",
    supplier: "Daiichi Sankyo",
    minStock: 800,
    currentStock: 8900,
    unitPrice: 35,
    location: "Zone A-03"
  },
  {
    id: "6",
    sku: "MASK-N95",
    name: "N95 Respirator Mask",
    category: "Medical Supplies",
    barcode: "4987654321143",
    supplier: "3M Japan",
    minStock: 2000,
    currentStock: 15000,
    unitPrice: 8,
    location: "Zone B-01"
  },
];

export function ProductMaster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Form state variables - CRITICAL: These were missing!
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    barcode: "",
    supplier: "",
    location: "",
    minStock: "",
    unitPrice: "",
    currentStock: "0"
  });

  const addDebugLog = (type: string, message: string, data?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev]);
    console.log(`[${type}]`, message, data || "");
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesLocation = locationFilter === "all" || product.location.includes(locationFilter);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Pharma": return "bg-[#00A3AD] text-white";
      case "Medical Supplies": return "bg-[#1A2B47] text-white";
      case "Cold Chain": return "bg-[#0891B2] text-white";
      default: return "bg-[#D1D5DB] text-[#111827]";
    }
  };

  // Generate SKU automatically
  const generateSKU = (productName: string, category: string): string => {
    const prefix = productName.substring(0, 3).toUpperCase();
    const categoryCode = category === "pharma" ? "PH" : category === "cold" ? "CC" : "MS";
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${categoryCode}-${random}`;
  };

  // REFACTORED: Direct Supabase REST API integration
  const handleAddProduct = async () => {
    // Validation
    if (!formData.productName || !formData.category || !formData.barcode || 
        !formData.supplier || !formData.location || !formData.minStock || !formData.unitPrice) {
      addDebugLog("error", "Validation failed - missing required fields");
      toast.error("Missing Fields", {
        description: "Please fill in all required fields"
      });
      return;
    }

    setIsSubmitting(true);
    addDebugLog("info", "Starting product submission via Supabase REST API");

    try {
      // Generate SKU
      const generatedSKU = generateSKU(formData.productName, formData.category);
      addDebugLog("info", `Generated SKU: ${generatedSKU}`);

      // Map form data to exact Supabase table schema (public.products)
      const productPayload = {
        sku: generatedSKU,
        product_name: formData.productName,
        category: formData.category === "pharma" ? "Pharma" : 
                 formData.category === "medical" ? "Medical Supplies" : "Cold Chain",
        barcode: formData.barcode,
        supplier: formData.supplier,
        warehouse_location: formData.location,
        min_stock_level: parseInt(formData.minStock, 10),
        unit_price: parseFloat(formData.unitPrice)
      };

      // Store payload for debug panel
      setLastPayload(productPayload);
      addDebugLog("info", "Payload mapped to public.products schema", productPayload);

      // Direct Supabase REST API endpoint
      const apiUrl = `https://xuxoueydtfcrerukhhih.supabase.co/rest/v1/products`;
      addDebugLog("info", `POST request to Supabase REST API: ${apiUrl}`);

      // Build headers
      const headers = {
        "apikey": publicAnonKey,
        "Authorization": `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json"
      };

      console.log("=== SUPABASE INSERT DEBUG ===");
      console.log("Endpoint:", apiUrl);
      console.log("Method: POST");
      console.log("Headers:", headers);
      console.log("Payload:", productPayload);

      // Send POST request WITHOUT Prefer header
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(productPayload)
      });

      // Log full response for debugging
      console.log("Response Status:", response.status);
      console.log("Response StatusText:", response.statusText);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
      addDebugLog("info", `HTTP Status: ${response.status} ${response.statusText}`);

      if (response.status !== 201) {
        const errorData = await response.text();
        console.log("Error Response Body:", errorData);
        
        let errorMessage = errorData;
        let parsedError = null;
        
        try {
          parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || parsedError.hint || parsedError.details || errorData;
        } catch (e) {
          // If not JSON, use text as-is
          errorMessage = errorData;
        }

        setLastResponse({ 
          error: true, 
          status: response.status, 
          statusText: response.statusText,
          rawError: errorData,
          parsedError: parsedError,
          data: errorMessage 
        });
        addDebugLog("error", `API Error Response (${response.status})`, { rawError: errorData, parsedError });
        
        // Handle specific error cases
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication/Permission Error (${response.status}): ${errorMessage}`);
        } else if (response.status === 400) {
          throw new Error(`Bad Request (400): ${errorMessage}`);
        } else if (response.status === 404) {
          throw new Error(`Not Found (404): Table 'products' not found. ${errorMessage}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }
      }

      // ✅ SUCCESS - Status 201 Created
      addDebugLog("success", "Product inserted successfully (HTTP 201)");
      console.log("Success! Product created with status 201");

      // 🔄 REFRESH TABLE: Fetch all products from Supabase to get the latest data
      addDebugLog("info", "Refreshing product list from database...");
      
      const fetchResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "apikey": publicAnonKey,
          "Authorization": `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json"
        }
      });

      if (fetchResponse.ok) {
        const fetchedProducts = await fetchResponse.json();
        console.log("Fetched products from database:", fetchedProducts);
        
        // Map fetched products to local Product interface
        const mappedProducts: Product[] = fetchedProducts.map((p: any) => ({
          id: p.id?.toString() || Date.now().toString(),
          sku: p.sku,
          name: p.product_name,
          category: p.category,
          barcode: p.barcode,
          supplier: p.supplier,
          minStock: p.min_stock_level,
          currentStock: p.current_stock || 0,
          unitPrice: p.unit_price,
          location: p.warehouse_location
        }));

        // Update local state with fresh data from database
        setProducts(mappedProducts);
        addDebugLog("success", `Table refreshed with ${mappedProducts.length} products from database`);
        
        setLastResponse({ 
          success: true, 
          message: "Product created and table refreshed",
          productsCount: mappedProducts.length 
        });
      } else {
        // Insert succeeded but fetch failed - add to local state manually
        addDebugLog("warning", "Insert succeeded but fetch failed - adding to local state");
        const newProduct: Product = {
          id: Date.now().toString(),
          sku: generatedSKU,
          name: formData.productName,
          category: productPayload.category as any,
          barcode: formData.barcode,
          supplier: formData.supplier,
          minStock: parseInt(formData.minStock, 10),
          currentStock: 0,
          unitPrice: parseFloat(formData.unitPrice),
          location: formData.location
        };
        setProducts([...products, newProduct]);
        
        setLastResponse({ 
          success: true, 
          message: "Product created (manual state update)",
          warning: "Could not fetch from database" 
        });
      }

      // Show success toast
      toast.success("Product Added Successfully", {
        description: `${formData.productName} (${generatedSKU}) has been saved to the database`
      });

      // Reset form and close dialog
      setFormData({
        productName: "",
        category: "",
        barcode: "",
        supplier: "",
        location: "",
        minStock: "",
        unitPrice: "",
        currentStock: "0"
      });
      setShowNewProductDialog(false);
      addDebugLog("success", "Form reset and dialog closed");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      addDebugLog("error", "Failed to insert product into database", errorMessage);
      console.error("Error adding product:", error);
      toast.error("Failed to Add Product", {
        description: errorMessage + " - Check Debug Panel below for details"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2 text-[#111827]">
            Product Master Database
          </h1>
          <p className="text-[#6B7280]">Manage SKUs, barcodes, and inventory master data</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="outline"
            className="border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A3AD] hover:bg-[#0891B2] text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#111827]">Add New Product</DialogTitle>
                <DialogDescription className="text-[#6B7280]">
                  Enter product information to add to the master database
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <Label>SKU (Auto-generated)</Label>
                  <Input 
                    placeholder="AUTO-GENERATED" 
                    className="mt-2 border-[#111827]/10 bg-[#F8FAFC]"
                    readOnly
                  />
                </div>
                <div>
                  <Label>Product Name</Label>
                  <Input 
                    placeholder="Enter product name" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="mt-2 border-[#111827]/10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pharma">Pharma</SelectItem>
                      <SelectItem value="medical">Medical Supplies</SelectItem>
                      <SelectItem value="cold">Cold Chain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Barcode (EAN-13)</Label>
                  <Input 
                    placeholder="4987654321XXX" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input 
                    placeholder="Enter supplier name" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Warehouse Location</Label>
                  <Input 
                    placeholder="Zone A-01" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <Input 
                    type="number" 
                    placeholder="1000" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Unit Price (₱)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="mt-2 border-[#111827]/10"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewProductDialog(false)}
                  className="border-[#111827]/20 text-[#111827]"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  className="bg-[#00A3AD] hover:bg-[#0891B2] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <Label className="text-[#6B7280] mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <Input
                  placeholder="Search by SKU, Name, or Barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#111827]/10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Label className="text-[#6B7280] mb-2 block">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-[#111827]/10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Pharma">Pharma</SelectItem>
                  <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Cold Chain">Cold Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div>
              <Label className="text-[#6B7280] mb-2 block">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="border-[#111827]/10">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Zone A">Zone A</SelectItem>
                  <SelectItem value="Zone B">Zone B</SelectItem>
                  <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold flex items-center justify-between">
            <span>Product Inventory ({filteredProducts.length} items)</span>
            <Button 
              variant="outline" 
              size="sm"
              className="border-[#111827]/20 text-[#111827]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1A2B47]">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">SKU</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Product Name</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Category</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Barcode (EAN-13)</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Supplier</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Stock</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Location</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-[#111827] bg-[#F8FAFC]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-[#00A3AD] font-semibold">{product.sku}</span>
                    </td>
                    <td className="py-4 px-4 text-[#111827] font-medium">{product.name}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-[#6B7280]" />
                        <span className="font-mono text-sm text-[#111827]">{product.barcode}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">{product.supplier}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-bold ${
                          product.currentStock < product.minStock ? "text-[#F97316]" : "text-[#111827]"
                        }`}>
                          {product.currentStock.toLocaleString()}
                        </span>
                        {product.currentStock < product.minStock && (
                          <span className="text-xs text-[#F97316] font-medium">Below Min</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">{product.location}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#111827]/20 text-[#111827]"
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#00A3AD]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#00A3AD]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">{products.length}</div>
                <div className="text-sm text-[#6B7280]">Total Products</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#1A2B47]/10 flex items-center justify-center">
                <Barcode className="w-6 h-6 text-[#1A2B47]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">{products.length}</div>
                <div className="text-sm text-[#6B7280]">Unique SKUs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#F97316]">
                  {products.filter(p => p.currentStock < p.minStock).length}
                </div>
                <div className="text-sm text-[#6B7280]">Low Stock Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#111827]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#0891B2]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#111827]">
                  {products.filter(p => p.category === "Cold Chain").reduce((sum, p) => sum + p.currentStock, 0)}
                </div>
                <div className="text-sm text-[#6B7280]">Cold Chain Units</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 DEBUG PANEL - Network Monitor & Payload Inspector */}
      <Card className="bg-[#1A2B47] border-[#00A3AD] shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold flex items-center gap-2">
              🔍 Developer Debug Panel - Live API Monitor
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              {showDebugPanel ? "Hide" : "Show"} Debug Panel
            </Button>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Real-time monitoring of API requests, payloads, and responses
          </p>
        </CardHeader>
        {showDebugPanel && (
          <CardContent className="space-y-4">
            {/* Configuration Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/60 mb-1">🔗 SUPABASE REST API ENDPOINT</div>
                <div className="text-sm text-white font-mono break-all">
                  https://xuxoueydtfcrerukhhih.supabase.co/rest/v1/products
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/60 mb-1">🔑 AUTH TOKEN (First 20 chars)</div>
                <div className="text-sm text-white font-mono">
                  {publicAnonKey.substring(0, 20)}...
                </div>
              </div>
            </div>

            {/* Headers Preview */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">📋 REQUEST HEADERS</div>
              <pre className="text-xs text-white font-mono overflow-x-auto">
{`{
  "apikey": "${publicAnonKey.substring(0, 20)}...",
  "Authorization": "Bearer ${publicAnonKey.substring(0, 20)}...",
  "Content-Type": "application/json"
}`}
              </pre>
            </div>

            {/* Schema Mapping Info */}
            <div className="p-4 rounded-lg bg-[#00A3AD]/10 border border-[#00A3AD]">
              <div className="text-xs text-white/60 mb-2">🗂️ DATABASE SCHEMA MAPPING (public.products)</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white font-mono">product_name</span>
                  <span className="text-white/60">(String)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white font-mono">warehouse_location</span>
                  <span className="text-white/60">(String)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white font-mono">min_stock_level</span>
                  <span className="text-white/60">(Integer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white font-mono">unit_price</span>
                  <span className="text-white/60">(Numeric)</span>
                </div>
              </div>
            </div>

            {/* Request Payload Preview */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">📤 LAST PAYLOAD SENT</div>
              {lastPayload ? (
                <pre className="text-xs text-[#00A3AD] font-mono overflow-x-auto">
                  {JSON.stringify(lastPayload, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-white/40">No payload sent yet - submit a product to see</div>
              )}
            </div>

            {/* Response Monitor */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">📥 LAST API RESPONSE</div>
              {lastResponse ? (
                <pre className="text-xs text-white font-mono overflow-x-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-white/40">No response received yet</div>
              )}
            </div>

            {/* Live Activity Log */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">📋 ACTIVITY LOG (Real-time)</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {debugLogs.length > 0 ? (
                  debugLogs.slice(0, 10).map((log, idx) => (
                    <div key={idx} className="text-xs font-mono">
                      <span className={`inline-block px-2 py-1 rounded mr-2 ${
                        log.type === "error" ? "bg-[#F97316] text-white" :
                        log.type === "success" ? "bg-[#00A3AD] text-white" :
                        "bg-white/10 text-white"
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-white/60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-white ml-2">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/40">No activity logged yet</div>
                )}
              </div>
            </div>

            {/* Data Type Validation Check */}
            <div className="p-4 rounded-lg bg-[#00A3AD]/10 border border-[#00A3AD]">
              <div className="text-xs text-white/60 mb-2">✅ VALIDATION CHECKS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white">minStock converts to Integer ✓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white">unitPrice converts to Float ✓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white">Category mapping implemented ✓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00A3AD]">●</span>
                  <span className="text-white">All required fields validated ✓</span>
                </div>
              </div>
            </div>

            {/* RLS Warning */}
            <div className="p-4 rounded-lg bg-[#F97316]/10 border border-[#F97316]">
              <div className="text-xs text-white/60 mb-2">⚠️ SUPABASE RLS & AUTHENTICATION</div>
              <div className="text-sm text-white space-y-2">
                <p>
                  <strong>Direct REST API Mode:</strong> Sending INSERT to <span className="font-mono text-[#00A3AD]">public.products</span> table.
                </p>
                <p>
                  <strong>Authentication:</strong> Using Anonymous Key (publicAnonKey) - Check if RLS policies allow anonymous INSERT.
                </p>
                <p>
                  <strong>Troubleshooting 401/403 errors:</strong> Go to Supabase Dashboard → Authentication → Policies → Ensure RLS allows public INSERT or disable RLS for testing.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}