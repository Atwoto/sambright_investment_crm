import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Palette,
  Brush,
  AlertTriangle,
  Package,
  Filter,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Paint {
  id: string;
  sku: string;
  brand: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  supplier: string;
  stockLevel: number;
  minStockLevel: number;
  category: string;
}

interface Painting {
  id: string;
  title: string;
  category: string;
  artist: string;
  medium: string;
  size: string;
  price: number;
  galleryLocation?: string;
  status: "available" | "sold" | "reserved" | "consignment";
  dateCreated: string;
  description?: string;
}

export function ProductsManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("paints");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paints, setPaints] = useState<Paint[]>([]);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; company_name: string }>
  >([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Paint | Painting | null>(null);
  const [newPaint, setNewPaint] = useState<Partial<Paint>>({});
  const [newPainting, setNewPainting] = useState<Partial<Painting>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Load products and suppliers from Supabase
    const loadData = async () => {
      try {
        // Load suppliers
        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, company_name")
          .order("company_name");

        if (suppliersData) setSuppliers(suppliersData);

        // Load products
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          toast.error("Failed to load products from database");
          setPaints([]);
          setPaintings([]);
          return;
        }

        const paintsFromDb = (data || [])
          .filter((p) => p.product_type === "paint")
          .map((p) => ({
            id: p.id,
            sku: p.sku,
            brand: p.brand,
            name: p.name,
            size: p.size,
            color: p.color,
            unitPrice: p.unit_price,
            supplier: p.supplier,
            stockLevel: p.stock_level,
            minStockLevel: p.min_stock_level,
            category: p.category,
          }));

        const paintingsFromDb = (data || [])
          .filter((p) => p.product_type === "painting")
          .map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            artist: p.artist,
            medium: p.medium,
            size: p.size,
            price: p.price,
            galleryLocation: p.gallery_location,
            status: p.status,
            dateCreated: p.date_created,
            description: p.description,
          }));

        setPaints(paintsFromDb);
        setPaintings(paintingsFromDb);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
        setPaints([]);
        setPaintings([]);
      }
    };

    loadData();
  }, []);

  // Helper function to create inventory transaction
  const createInventoryTransaction = async (
    productId: string,
    productName: string,
    productType: "paint" | "painting",
    quantity: number,
    unitCost: number,
    reason: string,
    supplierName?: string
  ) => {
    try {
      const transactionData = {
        transaction_number: `TXN-${new Date().getFullYear()}-${String(
          Math.floor(Math.random() * 1000)
        ).padStart(3, "0")}`,
        type: "stock_in",
        product_id: productId,
        product_name: productName,
        product_type: productType,
        quantity: quantity,
        unit_cost: unitCost,
        total_cost: unitCost * quantity,
        reason: reason,
        supplier_name: supplierName || "",
        created_by: user?.name || user?.email || "System",
        created_at: new Date().toISOString(),
      };

      await supabase.from("inventory_transactions").insert([transactionData]);
    } catch (error) {
      console.error("Error creating inventory transaction:", error);
    }
  };

  const filteredPaints = paints.filter((paint) => {
    const matchesSearch =
      (paint.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (paint.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (paint.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || paint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPaintings = paintings.filter((painting) => {
    const matchesSearch =
      (painting.title?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (painting.category?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (painting.medium?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || painting.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddPaint = async () => {
    if (newPaint.name && newPaint.brand && newPaint.unitPrice) {
      const paint = {
        id: Date.now().toString(),
        sku:
          newPaint.sku ||
          `${newPaint.brand?.substr(0, 3).toUpperCase()}-${Date.now()}`,
        brand: newPaint.brand,
        name: newPaint.name,
        size: newPaint.size || "100ml",
        color: newPaint.color || "Various",
        unitPrice: newPaint.unitPrice,
        supplier: newPaint.supplier || "Unknown",
        stockLevel: newPaint.stockLevel || 0,
        minStockLevel: newPaint.minStockLevel || 5,
        category: newPaint.category || "Other",
      };

      // Optimistic update
      setPaints([...paints, paint as Paint]);
      const loadingId = toast.loading("Adding paint...");

      try {
        // Insert directly into Supabase
        const { data, error } = await supabase
          .from("products")
          .insert([
            {
              product_type: "paint",
              sku: paint.sku,
              brand: paint.brand,
              name: paint.name,
              size: paint.size,
              color: paint.color,
              unit_price: paint.unitPrice,
              supplier: paint.supplier,
              stock_level: paint.stockLevel,
              min_stock_level: paint.minStockLevel,
              category: paint.category,
            },
          ])
          .select();

        if (error) throw error;

        // Update the local state with the actual ID from the database
        if (data && data.length > 0) {
          setPaints((prev) =>
            prev.map((p) => (p.id === paint.id ? { ...p, id: data[0].id } : p))
          );

          // Create inventory transaction for initial stock
          if (paint.stockLevel > 0) {
            await createInventoryTransaction(
              data[0].id,
              paint.name,
              "paint",
              paint.stockLevel,
              paint.unitPrice,
              "Initial stock - Product added",
              paint.supplier
            );
          }
        }

        toast.success("Paint added successfully", { id: loadingId });
      } catch (error) {
        console.error("Error adding paint:", error);
        toast.error("Failed to add paint", { id: loadingId });
        // Remove the optimistic update if there was an error
        setPaints((prev) => prev.filter((p) => p.id !== paint.id));
      }

      setNewPaint({});
      setIsAddDialogOpen(false);
    }
  };

  const handleAddPainting = async () => {
    if (newPainting.title && newPainting.price && newPainting.medium) {
      const painting = {
        id: Date.now().toString(),
        title: newPainting.title,
        category: newPainting.category || "Other",
        artist: newPainting.artist || "You",
        medium: newPainting.medium,
        size: newPainting.size || "Unknown",
        price: newPainting.price,
        galleryLocation: newPainting.galleryLocation,
        status: (newPainting.status as any) || "available",
        dateCreated: new Date().toISOString().split("T")[0],
        description: newPainting.description,
      };

      // Optimistic update
      setPaintings([...paintings, painting as Painting]);
      const loadingId = toast.loading("Adding painting...");

      try {
        // Insert directly into Supabase
        const { data, error } = await supabase
          .from("products")
          .insert([
            {
              product_type: "painting",
              title: painting.title,
              category: painting.category,
              artist: painting.artist,
              medium: painting.medium,
              size: painting.size,
              price: painting.price,
              gallery_location: painting.galleryLocation,
              status: painting.status,
              date_created: painting.dateCreated,
              description: painting.description,
            },
          ])
          .select();

        if (error) throw error;

        // Update the local state with the actual ID from the database
        if (data && data.length > 0) {
          setPaintings((prev) =>
            prev.map((p) =>
              p.id === painting.id ? { ...p, id: data[0].id } : p
            )
          );
        }

        toast.success("Painting added successfully", { id: loadingId });
      } catch (error) {
        console.error("Error adding painting:", error);
        toast.error("Failed to add painting", { id: loadingId });
        // Remove the optimistic update if there was an error
        setPaintings((prev) => prev.filter((p) => p.id !== painting.id));
      }

      setNewPainting({});
      setIsAddDialogOpen(false);
    }
  };

  const handleEditPaint = (paint: Paint) => {
    setEditingItem(paint);
    setNewPaint(paint);
    setIsEditDialogOpen(true);
  };

  const handleEditPainting = (painting: Painting) => {
    setEditingItem(painting);
    setNewPainting(painting);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    if (activeTab === "paints" && "sku" in editingItem) {
      const updatedPaints = paints.map((paint) =>
        paint.id === editingItem.id
          ? ({ ...paint, ...newPaint } as Paint)
          : paint
      );
      setPaints(updatedPaints);

      setSaving(true);
      const id = toast.loading("Saving changes...");

      try {
        // Update directly in Supabase
        const { error } = await supabase
          .from("products")
          .update({
            product_type: "paint",
            sku: newPaint.sku,
            brand: newPaint.brand,
            name: newPaint.name,
            size: newPaint.size,
            color: newPaint.color,
            unit_price: newPaint.unitPrice,
            supplier: newPaint.supplier,
            stock_level: newPaint.stockLevel,
            min_stock_level: newPaint.minStockLevel,
            category: newPaint.category,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Product updated successfully", { id });
      } catch (error) {
        console.error("Error updating product:", error);
        toast.error("Failed to update product", { id });
      }

      setSaving(false);
    } else if (activeTab === "paintings" && "title" in editingItem) {
      const updatedPaintings = paintings.map((painting) =>
        painting.id === editingItem.id
          ? ({ ...painting, ...newPainting } as Painting)
          : painting
      );
      setPaintings(updatedPaintings);

      setSaving(true);
      const id = toast.loading("Saving changes...");

      try {
        // Update directly in Supabase
        const { error } = await supabase
          .from("products")
          .update({
            product_type: "painting",
            title: newPainting.title,
            category: newPainting.category,
            artist: newPainting.artist,
            medium: newPainting.medium,
            size: newPainting.size,
            price: newPainting.price,
            gallery_location: newPainting.galleryLocation,
            status: newPainting.status,
            date_created: newPainting.dateCreated,
            description: newPainting.description,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Product updated successfully", { id });
      } catch (error) {
        console.error("Error updating product:", error);
        toast.error("Failed to update product", { id });
      }

      setSaving(false);
    }

    setIsEditDialogOpen(false);
    setEditingItem(null);
    setNewPaint({});
    setNewPainting({});
  };

  const handleDeleteProduct = async (
    id: string,
    type: "paint" | "painting"
  ) => {
    if (!window.confirm("Delete this product?")) return;
    setDeletingId(id);
    const toastId = toast.loading("Deleting product...");

    if (type === "paint") setPaints((prev) => prev.filter((p) => p.id !== id));
    else setPaintings((prev) => prev.filter((p) => p.id !== id));

    try {
      // Delete directly from Supabase
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      toast.success("Product deleted successfully", { id: toastId });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product", { id: toastId });
      // If there was an error, we might want to add the product back to the UI
    }

    setDeletingId(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      sold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      reserved: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      consignment: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    } as const;

    const className = variants[status as keyof typeof variants] || "bg-gray-100 text-gray-700";

    return (
      <Badge variant="outline" className={cn("capitalize border", className)}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Product Management
          </h2>
          <p className="text-muted-foreground">
            Manage your paints inventory and artwork collection
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass-panel border-white/20">
              <DialogHeader>
                <DialogTitle>
                  Add New {activeTab === "paints" ? "Paint" : "Painting"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details for your new{" "}
                  {activeTab === "paints" ? "paint product" : "artwork"}.
                </DialogDescription>
              </DialogHeader>

              {activeTab === "paints" ? (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right">
                      Brand
                    </Label>
                    <Input
                      id="brand"
                      value={newPaint.brand || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, brand: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newPaint.name || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, name: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="size" className="text-right">
                      Size
                    </Label>
                    <Input
                      id="size"
                      value={newPaint.size || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, size: e.target.value })
                      }
                      className="col-span-3 glass-input"
                      placeholder="e.g., 100ml"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <Input
                      id="color"
                      value={newPaint.color || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, color: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPaint.unitPrice || ""}
                      onChange={(e) =>
                        setNewPaint({
                          ...newPaint,
                          unitPrice: parseFloat(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">
                      Stock
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newPaint.stockLevel || ""}
                      onChange={(e) =>
                        setNewPaint({
                          ...newPaint,
                          stockLevel: parseInt(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="supplier" className="text-right">
                      Supplier
                    </Label>
                    <Select
                      value={newPaint.supplier}
                      onValueChange={(value) => {
                        const supplier = suppliers.find((s) => s.id === value);
                        setNewPaint({
                          ...newPaint,
                          supplier: supplier?.company_name || value,
                        });
                      }}
                    >
                      <SelectTrigger className="col-span-3 glass-input">
                        <SelectValue placeholder="Select supplier (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={newPainting.title || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          title: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="medium" className="text-right">
                      Medium
                    </Label>
                    <Input
                      id="medium"
                      value={newPainting.medium || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          medium: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                      placeholder="e.g., Oil on Canvas"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paintingSize" className="text-right">
                      Size
                    </Label>
                    <Input
                      id="paintingSize"
                      value={newPainting.size || ""}
                      onChange={(e) =>
                        setNewPainting({ ...newPainting, size: e.target.value })
                      }
                      className="col-span-3 glass-input"
                      placeholder="e.g., 24 x 36 inches"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paintingPrice" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="paintingPrice"
                      type="number"
                      value={newPainting.price || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newPainting.description || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          description: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={
                    activeTab === "paints" ? handleAddPaint : handleAddPainting
                  }
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Add {activeTab === "paints" ? "Paint" : "Painting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md glass-panel border-white/20">
              <DialogHeader>
                <DialogTitle>
                  Edit {activeTab === "paints" ? "Paint" : "Painting"}
                </DialogTitle>
                <DialogDescription>
                  Update the details for this{" "}
                  {activeTab === "paints" ? "paint product" : "artwork"}.
                </DialogDescription>
              </DialogHeader>

              {activeTab === "paints" ? (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-brand" className="text-right">
                      Brand
                    </Label>
                    <Input
                      id="edit-brand"
                      value={newPaint.brand || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, brand: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={newPaint.name || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, name: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-size" className="text-right">
                      Size
                    </Label>
                    <Input
                      id="edit-size"
                      value={newPaint.size || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, size: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-color" className="text-right">
                      Color
                    </Label>
                    <Input
                      id="edit-color"
                      value={newPaint.color || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, color: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={newPaint.unitPrice || ""}
                      onChange={(e) =>
                        setNewPaint({
                          ...newPaint,
                          unitPrice: parseFloat(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-stock" className="text-right">
                      Stock
                    </Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={newPaint.stockLevel || ""}
                      onChange={(e) =>
                        setNewPaint({
                          ...newPaint,
                          stockLevel: parseInt(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="edit-title"
                      value={newPainting.title || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          title: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-medium" className="text-right">
                      Medium
                    </Label>
                    <Input
                      id="edit-medium"
                      value={newPainting.medium || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          medium: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-painting-size" className="text-right">
                      Size
                    </Label>
                    <Input
                      id="edit-painting-size"
                      value={newPainting.size || ""}
                      onChange={(e) =>
                        setNewPainting({ ...newPainting, size: e.target.value })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-painting-price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="edit-painting-price"
                      type="number"
                      value={newPainting.price || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={newPainting.description || ""}
                      onChange={(e) =>
                        setNewPainting({
                          ...newPainting,
                          description: e.target.value,
                        })
                      }
                      className="col-span-3 glass-input"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem} className="bg-primary text-white">
                  Update {activeTab === "paints" ? "Paint" : "Painting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 rounded-2xl animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name, brand, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Acrylic">Acrylic</SelectItem>
              <SelectItem value="Oil">Oil</SelectItem>
              <SelectItem value="Watercolor">Watercolor</SelectItem>
              <SelectItem value="Landscape">Landscape</SelectItem>
              <SelectItem value="Portrait">Portrait</SelectItem>
              <SelectItem value="Abstract">Abstract</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8 animate-enter"
        style={{ animationDelay: '200ms' }}
      >
        <TabsList className="p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20">
          <TabsTrigger
            value="paints"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Brush className="h-4 w-4" />
              <span>Paints</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {paints.length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="paintings"
            className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>Paintings</span>
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {paintings.length}
              </Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paints" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPaints.map((paint, index) => (
              <div
                key={paint.id}
                className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-enter"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                        {paint.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {paint.brand} • {paint.size}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditPaint(paint)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          onClick={() => handleDeleteProduct(paint.id, "paint")}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          paint.stockLevel <= paint.minStockLevel ? "text-orange-600 dark:text-orange-400" : "text-foreground"
                        )}>
                          {paint.stockLevel} units
                        </span>
                        {paint.stockLevel <= paint.minStockLevel && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          paint.stockLevel <= paint.minStockLevel ? "bg-orange-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min((paint.stockLevel / (paint.minStockLevel * 3)) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-lg text-primary">
                        {formatCurrency(paint.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 border-0">
                      {paint.color}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                      {paint.sku}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paintings" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPaintings.map((painting, index) => (
              <div
                key={painting.id}
                className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-enter"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image Placeholder or Gradient */}
                <div className="h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 mix-blend-overlay"></div>
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(painting.status)}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                        {painting.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {painting.medium} • {painting.size}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditPainting(painting)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          onClick={() => handleDeleteProduct(painting.id, "painting")}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{painting.category}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-lg text-primary">
                        {formatCurrency(painting.price)}
                      </span>
                    </div>
                  </div>

                  {painting.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                      {painting.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Palette className="h-3 w-3" />
                    <span>Added {new Date(painting.dateCreated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
