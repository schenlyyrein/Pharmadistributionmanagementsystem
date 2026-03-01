import { useEffect, useMemo, useState } from "react";
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
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  barcode: string;
  supplier: string;
  minStock: number;
  currentStock: number;
  unitPrice: number;
  location: string;
  createdAt?: string;
}

type ProductCategory = {
  id: string
  name: string
  parent_id: string | null
}

type CategoryOption = {
  id: string
  label: string
}

const buildCategoryOptions = (rows: ProductCategory[]): CategoryOption[] => {
  const byId = new Map(rows.map(r => [r.id, r]))
  const labelCache = new Map<string, string>()

  const makeLabel = (id: string): string => {
    if (labelCache.has(id)) return labelCache.get(id)!
    const node = byId.get(id)
    if (!node) return ""
    if (!node.parent_id) {
      labelCache.set(id, node.name)
      return node.name
    }
    const parentLabel = makeLabel(node.parent_id)
    const full = parentLabel ? `${parentLabel} > ${node.name}` : node.name
    labelCache.set(id, full)
    return full
  }

  return rows
    .map(r => ({ id: r.id, label: makeLabel(r.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

const getDescendantIds = (all: ProductCategory[], parentId: string) => {
  const childrenByParent = new Map<string, string[]>()
  all.forEach(c => {
    if (!c.parent_id) return
    const arr = childrenByParent.get(c.parent_id) || []
    arr.push(c.id)
    childrenByParent.set(c.parent_id, arr)
  })

  const result = new Set<string>()
  const stack = [parentId]
  while (stack.length) {
    const id = stack.pop()!
    result.add(id)
    const kids = childrenByParent.get(id) || []
    kids.forEach(k => stack.push(k))
  }
  return Array.from(result)
}

const mockProducts: Product[] = [
  {
    id: "1",
    sku: "AMX-500",
    name: "Amoxicillin 500mg",
    category_id: "pharma",
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
    category_id: "pharma",
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
    category_id: "medical_supplies",
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
    category_id: "cold_chain",
    barcode: "4987654321129",
    supplier: "Pfizer Japan",
    minStock: 100,
    currentStock: 450,
    unitPrice: 2500,
    location: "Cold Storage CS-01"
  },
];

export function ProductMaster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>("")
  const [selectedChildCategoryId, setSelectedChildCategoryId] = useState<string>("")
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])

  
  const [formData, setFormData] = useState({
    productName: "",
    category_id: "",
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
    setDebugLogs((prev) => [log, ...prev]);
    console.log(`[${type}]`, message, data || "");
  };

  useEffect(() => {
    const apiUrl = `https://${projectId}.supabase.co/rest/v1/products?select=*`;
    const loadProducts = async () => {
      try {
        addDebugLog("info", "Loading products from shared database");
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            apikey: publicAnonKey,
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const text = await response.text();
          addDebugLog("error", `Product load failed (${response.status})`, text);
          return;
        }

        const fetchedProducts = await response.json();
        const mappedProducts: Product[] = (fetchedProducts || []).map((p: any) => ({
          id: p.id?.toString() || Date.now().toString(),
          sku: p.sku || "",
          name: p.product_name || p.name || "",
          category_id: (p.category || "Pharma") as Product["category_id"],
          barcode: p.barcode || "",
          supplier: p.supplier || "",
          minStock: p.min_stock_level || 0,
          currentStock: p.current_stock || 0,
          unitPrice: p.unit_price || 0,
          location: p.warehouse_location || "",
          createdAt: p.created_at || null
        }));

        if (mappedProducts.length > 0) {
          setProducts(mappedProducts);
          addDebugLog("success", `Loaded ${mappedProducts.length} products from database`);
        }
      } catch (error) {
        addDebugLog("error", "Failed initial product load", error);
      }
    };

    loadProducts();
  }, []);

  // Fetch categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        addDebugLog("info", "Loading categories from database");
        const categoriesUrl = `https://${projectId}.supabase.co/rest/v1/product_categories?select=id,name,parent_id`;
        const response = await fetch(categoriesUrl, {
          method: "GET",
          headers: {
            apikey: publicAnonKey,
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          addDebugLog("error", `Categories load failed (${response.status})`);
          return;
        }

        const fetchedCategories = await response.json();
        setCategories(fetchedCategories);
        
        const options = buildCategoryOptions(fetchedCategories);
        setCategoryOptions(options);
        
        addDebugLog("success", `Loaded ${fetchedCategories.length} categories with hierarchy`);
      } catch (error) {
        addDebugLog("error", "Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.barcode.includes(searchTerm);
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesLocation = locationFilter === "all" || product.location.includes(locationFilter);
      return matchesSearch && matchesCategory && matchesLocation;
    });

    return [...filtered].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, categoryFilter, locationFilter]);

  const parentCategories = useMemo(
  () => categories.filter(c => !c.parent_id),
  [categories]
)

const childCategories = useMemo(() => {
  if (!selectedParentCategoryId) return []
  return categories.filter(c => c.parent_id === selectedParentCategoryId)
}, [categories, selectedParentCategoryId])

const categoryLabelById = useMemo(() => {
  const options = buildCategoryOptions(categories)
  return new Map(options.map(o => [o.id, o.label]))
}, [categories])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "pharma": return "bg-[#00A3AD] text-white";
      case "medical_supplies": return "bg-[#1A2B47] text-white";
      case "cold_chain": return "bg-[#0891B2] text-white";
      default: return "bg-[#D1D5DB] text-[#111827]";
    }
  };

  const generateSKU = (productName: string, category: string): string => {
    const prefix = productName.substring(0, 3).toUpperCase();
    const categoryCode = category === "pharma" ? "PH" : category === "cold" ? "CC" : "MS";
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${categoryCode}-${random}`;
  };

  const handleAddProduct = async () => {
    if (!formData.productName || !formData.category_id || !formData.barcode ||
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
      const generatedSKU = generateSKU(formData.productName, formData.category_id);
      addDebugLog("info", `Generated SKU: ${generatedSKU}`);

      const productPayload = {
        sku: generatedSKU,
        product_name: formData.productName,
        category_id: formData.category_id,
        barcode: formData.barcode,
        supplier: formData.supplier,
        warehouse_location: formData.location,
        min_stock_level: parseInt(formData.minStock, 10),
        unit_price: parseFloat(formData.unitPrice)
      };

      setLastPayload(productPayload);
      addDebugLog("info", "Payload mapped to public.products schema", productPayload);

      const apiUrl = `https://${projectId}.supabase.co/rest/v1/products`;
      addDebugLog("info", `POST request to Supabase REST API: ${apiUrl}`);

      const headers = {
        "apikey": publicAnonKey,
        "Authorization": `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json"
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(productPayload)
      });

      addDebugLog("info", `HTTP Status: ${response.status} ${response.statusText}`);

      if (response.status !== 201) {
        const errorData = await response.text();

        let errorMessage = errorData;
        let parsedError = null;

        try {
          parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || parsedError.hint || parsedError.details || errorData;
        } catch {
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
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      addDebugLog("success", "Product inserted successfully (HTTP 201)");
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

        const mappedProducts: Product[] = fetchedProducts.map((p: any) => ({
          id: p.id?.toString() || Date.now().toString(),
          sku: p.sku,
          name: p.product_name,
          category_id: p.category,
          barcode: p.barcode,
          supplier: p.supplier,
          minStock: p.min_stock_level,
          currentStock: p.current_stock || 0,
          unitPrice: p.unit_price,
          location: p.warehouse_location,
          createdAt: p.created_at
        }));

        setProducts(mappedProducts);
        addDebugLog("success", `Table refreshed with ${mappedProducts.length} products from database`);

        setLastResponse({
          success: true,
          message: "Product created and table refreshed",
          productsCount: mappedProducts.length
        });
      }

      toast.success("Product Added Successfully", {
        description: `${formData.productName} (${generatedSKU}) has been saved to the database`
      });

      setFormData({
        productName: "",
        category_id: "",
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
      toast.error("Failed to Add Product", {
        description: errorMessage + " - Check Debug Panel below for details"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-[#F8FAFC]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-2 text-[#111827]">
            Product Master Database
          </h1>
          <p className="text-[#6B7280]">Manage SKUs, barcodes, and inventory master data</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC]">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="border-[#111827]/20 text-[#111827] hover:bg-[#F8FAFC]">
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
                  <Input placeholder="AUTO-GENERATED" className="mt-2 border-[#111827]/10 bg-[#F8FAFC]" readOnly />
                </div>
                <div>
                  <Label>Product Name</Label>
                  <Input placeholder="Enter product name" className="mt-2 border-[#111827]/10" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[#6B7280]">Category (Parent)</Label>
                  <Select
                    value={selectedParentCategoryId}
                    onValueChange={(value) => {
                      setSelectedParentCategoryId(value)
                      setSelectedChildCategoryId("") // reset child when parent changes
                      setFormData(prev => ({ ...prev, category_id: value })) // default to parent
                    }}
                  >
                    <SelectTrigger className="mt-2 border-[#111827]/10">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.length > 0 ? (
                        parentCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Label className="text-[#6B7280] mt-4 block">Subcategory (Optional)</Label>
                  <Select
                    value={selectedChildCategoryId}
                    onValueChange={(value) => {
                      setSelectedChildCategoryId(value)
                      setFormData(prev => ({ ...prev, category_id: value })) // use child as final
                    }}
                    disabled={!selectedParentCategoryId || childCategories.length === 0}
                  >
                    <SelectTrigger className="mt-2 border-[#111827]/10">
                      <SelectValue placeholder={!selectedParentCategoryId ? "Select parent first" : "Select subcategory"} />
                    </SelectTrigger>
                    <SelectContent>
                      {childCategories.length > 0 ? (
                        childCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No subcategories</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Barcode (EAN-13)</Label>
                  <Input placeholder="4987654321XXX" className="mt-2 border-[#111827]/10" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input placeholder="Enter supplier name" className="mt-2 border-[#111827]/10" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                </div>
                <div>
                  <Label>Warehouse Location</Label>
                  <Input placeholder="Zone A-01" className="mt-2 border-[#111827]/10" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <Input type="number" placeholder="1000" className="mt-2 border-[#111827]/10" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input type="number" placeholder="0.00" className="mt-2 border-[#111827]/10" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowNewProductDialog(false)} className="border-[#111827]/20 text-[#111827]" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} className="bg-[#00A3AD] hover:bg-[#0891B2] text-white" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label className="text-[#6B7280] mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <Input placeholder="Search by SKU, Name, or Barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-[#111827]/10" />
              </div>
            </div>
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

      <Card className="bg-white border-[#111827]/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827] font-semibold flex items-center justify-between">
            <span>Product Inventory ({filteredProducts.length} items)</span>
            <Button variant="outline" size="sm" className="border-[#111827]/20 text-[#111827]">
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
                  <tr key={product.id} className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-4"><span className="font-mono text-[#00A3AD] font-semibold">{product.sku}</span></td>
                    <td className="py-4 px-4 text-[#111827] font-medium">{product.name}</td>
                    <td className="py-4 px-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category_id)}`}>{categoryLabelById.get(product.category_id) || "—"}</span></td>
                    <td className="py-4 px-4"><div className="flex items-center gap-2"><Barcode className="w-4 h-4 text-[#6B7280]" /><span className="font-mono text-sm text-[#111827]">{product.barcode}</span></div></td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">{product.supplier}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`${product.currentStock < product.minStock ? "text-[#F97316]" : "text-[#111827]"} font-bold`}>{product.currentStock.toLocaleString()}</span>
                        {product.currentStock < product.minStock && <span className="text-xs text-[#F97316] font-medium">Below Min</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#6B7280]">{product.location}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="border-[#00A3AD] text-[#00A3AD] hover:bg-[#00A3AD]/10"><FileText className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="border-[#111827]/20 text-[#111827]">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#111827]/10"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-[#00A3AD]/10 flex items-center justify-center"><Package className="w-6 h-6 text-[#00A3AD]" /></div><div><div className="text-2xl font-bold text-[#111827]">{products.length}</div><div className="text-sm text-[#6B7280]">Total Products</div></div></div></CardContent></Card>
        <Card className="bg-white border-[#111827]/10"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-[#1A2B47]/10 flex items-center justify-center"><Barcode className="w-6 h-6 text-[#1A2B47]" /></div><div><div className="text-2xl font-bold text-[#111827]">{products.length}</div><div className="text-sm text-[#6B7280]">Unique SKUs</div></div></div></CardContent></Card>
        <Card className="bg-white border-[#111827]/10"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center"><Package className="w-6 h-6 text-[#F97316]" /></div><div><div className="text-2xl font-bold text-[#F97316]">{products.filter((p) => p.currentStock < p.minStock).length}</div><div className="text-sm text-[#6B7280]">Low Stock Items</div></div></div></CardContent></Card>
        <Card className="bg-white border-[#111827]/10"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-[#0891B2]/10 flex items-center justify-center"><Package className="w-6 h-6 text-[#0891B2]" /></div><div><div className="text-2xl font-bold text-[#111827]">{products.filter((p) => p.category_id === "cold_chain").reduce((sum, p) => sum + p.currentStock, 0)}</div><div className="text-sm text-[#6B7280]">Cold Chain Units</div></div></div></CardContent></Card>
      </div>

      <Card className="bg-[#1A2B47] border-[#00A3AD] shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-bold">Developer Debug Panel - Live API Monitor</CardTitle>
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setShowDebugPanel(!showDebugPanel)}>
              {showDebugPanel ? "Hide" : "Show"} Debug Panel
            </Button>
          </div>
          <p className="text-white/60 text-sm mt-2">Real-time monitoring of API requests, payloads, and responses</p>
        </CardHeader>
        {showDebugPanel && (
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-1">SUPABASE REST API ENDPOINT</div>
              <div className="text-sm text-white font-mono break-all">https://{projectId}.supabase.co/rest/v1/products</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">LAST PAYLOAD SENT</div>
              {lastPayload ? <pre className="text-xs text-[#00A3AD] font-mono overflow-x-auto">{JSON.stringify(lastPayload, null, 2)}</pre> : <div className="text-sm text-white/40">No payload sent yet</div>}
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">LAST API RESPONSE</div>
              {lastResponse ? <pre className="text-xs text-white font-mono overflow-x-auto">{JSON.stringify(lastResponse, null, 2)}</pre> : <div className="text-sm text-white/40">No response received yet</div>}
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/60 mb-2">ACTIVITY LOG</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {debugLogs.length > 0 ? debugLogs.slice(0, 10).map((log, idx) => (
                  <div key={idx} className="text-xs font-mono">
                    <span className={`inline-block px-2 py-1 rounded mr-2 ${log.type === "error" ? "bg-[#F97316] text-white" : log.type === "success" ? "bg-[#00A3AD] text-white" : "bg-white/10 text-white"}`}>{log.type.toUpperCase()}</span>
                    <span className="text-xs text-white/60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-white ml-2">{log.message}</span>
                  </div>
                )) : <div className="text-sm text-white/40">No activity logged yet</div>}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}