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
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../utils/api";
import { formatCurrency } from "../utils/currency";

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
  const [activeTab, setActiveTab] = useState("paints");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paints, setPaints] = useState<Paint[]>([]);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Paint | Painting | null>(null);
  const [newPaint, setNewPaint] = useState<Partial<Paint>>({});
  const [newPainting, setNewPainting] = useState<Partial<Painting>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Load products directly from Supabase
    const loadProducts = async () => {
      try {
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
        console.log(
          `Loaded ${paintsFromDb.length} paints and ${paintingsFromDb.length} paintings from database`
        );
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
        setPaints([]);
        setPaintings([]);
      }
    };

    loadProducts();
  }, []);

  const filteredPaints = paints.filter((paint) => {
    const matchesSearch =
      paint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paint.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paint.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || paint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPaintings = paintings.filter((painting) => {
    const matchesSearch =
      painting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      painting.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      painting.medium.toLowerCase().includes(searchTerm.toLowerCase());
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
      available: "default",
      sold: "secondary",
      reserved: "outline",
      consignment: "default",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">
            Product Management
          </h2>
          <p className="text-gray-600">
            Manage your paints inventory and artwork collection
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
                    />
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={
                    activeTab === "paints" ? handleAddPaint : handleAddPainting
                  }
                >
                  Add {activeTab === "paints" ? "Paint" : "Painting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                      className="col-span-3"
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
                <Button onClick={handleUpdateItem}>
                  Update {activeTab === "paints" ? "Paint" : "Painting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-white/50 backdrop-blur-sm border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products by name, brand, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
              <SelectValue placeholder="Filter by category" />
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
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="bg-white/80 backdrop-blur-sm border shadow-sm">
          <TabsTrigger
            value="paints"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <Brush className="h-4 w-4" />
            <span>Paints ({paints.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="paintings"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <Palette className="h-4 w-4" />
            <span>Paintings ({paintings.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paints" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPaints.map((paint) => (
              <Card
                key={paint.id}
                className={`${
                  paint.stockLevel <= paint.minStockLevel
                    ? "border-orange-200 bg-gradient-to-br from-orange-50 to-red-50"
                    : "bg-white/80 backdrop-blur-sm"
                } hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">
                        {paint.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {paint.brand} - {paint.size}
                      </CardDescription>
                    </div>
                    {paint.stockLevel <= paint.minStockLevel && (
                      <Badge
                        variant="destructive"
                        className="flex items-center space-x-1 animate-pulse shrink-0"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">Low</span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">SKU:</span>
                    <span className="text-sm font-mono">{paint.sku}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Color:</span>
                    <Badge variant="outline">{paint.color}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold">
                      {formatCurrency(paint.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <span
                      className={
                        paint.stockLevel <= paint.minStockLevel
                          ? "text-orange-600 font-semibold"
                          : "text-green-600"
                      }
                    >
                      {paint.stockLevel} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="text-sm">{paint.supplier}</span>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditPaint(paint)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteProduct(paint.id, "paint")}
                      disabled={deletingId === paint.id}
                    >
                      {deletingId === paint.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paintings" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPaintings.map((painting) => (
              <Card
                key={painting.id}
                className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">
                        {painting.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {painting.medium}
                      </CardDescription>
                    </div>
                    {getStatusBadge(painting.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Category:</span>
                    <Badge variant="outline">{painting.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm">{painting.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold">
                      {formatCurrency(painting.price)}
                    </span>
                  </div>
                  {painting.galleryLocation && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm">
                        {painting.galleryLocation}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">
                      {new Date(painting.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  {painting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {painting.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => handleEditPainting(painting)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() =>
                        handleDeleteProduct(painting.id, "painting")
                      }
                      disabled={deletingId === painting.id}
                    >
                      {deletingId === painting.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
