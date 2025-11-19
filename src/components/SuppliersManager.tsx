import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Star,
  Clock,
  MoreHorizontal,
  Globe,
  CreditCard
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { formatCurrency } from "../utils/currency";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  supplierType: "paints" | "canvas" | "frames" | "brushes" | "general";
  paymentTerms: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  dateAdded: string;
  notes?: string;
  products: string[];
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    status: "completed" | "pending" | "cancelled";
  }>;
}

export function SuppliersManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    products: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load suppliers directly from Supabase
    const loadSuppliers = async () => {
      try {
        const { data, error } = await supabase.from("suppliers").select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          const suppliersFromDb = data.map((supplier) => ({
            id: supplier.id,
            name: supplier.company_name,
            contactPerson: supplier.contact_person,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            website: "", // You might want to add this to your database
            supplierType: "general", // Default value, you might want to add this to your database
            paymentTerms: "", // You might want to add this to your database
            rating: supplier.rating || 0,
            totalOrders: supplier.total_orders || 0,
            totalSpent: supplier.total_spent || 0,
            lastOrder: "", // You might want to add this to your database
            dateAdded: supplier.created_at
              ? new Date(supplier.created_at).toISOString().split("T")[0]
              : "",
            notes: "", // You might want to add this to your database
            products: [], // You might want to add this to your database
            recentTransactions: supplier.recent_transactions || [],
          }));

          setSuppliers(suppliersFromDb);
        } else {
          // Seed demo content if DB empty
          setSuppliers([
            {
              id: "1",
              name: "Winsor & Newton",
              contactPerson: "James Wilson",
              email: "orders@winsornewton.com",
              phone: "+1 (800) 555-0123",
              address: "123 Art Supply Blvd, Creative City, NY 10001",
              website: "www.winsornewton.com",
              supplierType: "paints",
              paymentTerms: "Net 30",
              rating: 4.8,
              totalOrders: 24,
              totalSpent: 12450,
              lastOrder: "2024-09-15",
              dateAdded: "2023-01-15",
              notes: "Premium paints supplier. Always delivers on time.",
              products: ["Oil Paints", "Watercolors", "Brushes"],
              recentTransactions: [
                {
                  id: "1",
                  date: "2024-09-15",
                  amount: 850,
                  description: "Professional oil paint set",
                  status: "completed"
                },
                {
                  id: "2",
                  date: "2024-08-22",
                  amount: 420,
                  description: "Watercolor tubes assortment",
                  status: "completed"
                },
              ],
            },
            {
              id: "2",
              name: "Canvas & More Co.",
              contactPerson: "Lisa Thompson",
              email: "lisa@canvasmore.com",
              phone: "+1 (800) 555-0456",
              address: "456 Canvas Street, Art District, CA 90210",
              website: "www.canvasmore.com",
              supplierType: "canvas",
              paymentTerms: "Net 15",
              rating: 4.5,
              totalOrders: 18,
              totalSpent: 3280,
              lastOrder: "2024-09-10",
              dateAdded: "2023-03-22",
              notes: "Good quality canvases at competitive prices.",
              products: ["Stretched Canvases", "Canvas Panels", "Primers"],
              recentTransactions: [
                {
                  id: "1",
                  date: "2024-09-10",
                  amount: 320,
                  description: "Large canvas set (10 pieces)",
                  status: "completed"
                },
                {
                  id: "2",
                  date: "2024-08-05",
                  amount: 180,
                  description: "Canvas panels bulk order",
                  status: "completed"
                },
              ],
            },
            {
              id: "3",
              name: "Frame Masters",
              contactPerson: "Robert Chen",
              email: "robert@framemasters.com",
              phone: "+1 (800) 555-0789",
              address: "789 Frame Avenue, Gallery District, FL 33101",
              website: "www.framemasters.com",
              supplierType: "frames",
              paymentTerms: "Net 30",
              rating: 4.9,
              totalOrders: 15,
              totalSpent: 4670,
              lastOrder: "2024-09-05",
              dateAdded: "2023-05-10",
              notes: "Specializes in custom framing. Excellent craftsmanship.",
              products: ["Wooden Frames", "Metal Frames", "Custom Framing"],
              recentTransactions: [
                {
                  id: "1",
                  date: "2024-09-05",
                  amount: 850,
                  description: "Custom frames for gallery show",
                  status: "completed"
                },
                {
                  id: "2",
                  date: "2024-07-18",
                  amount: 620,
                  description: "Bulk order wooden frames",
                  status: "completed"
                },
              ],
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading suppliers:", error);
        // Fallback to seed data if there's an error
      }
    };

    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      (supplier.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (supplier.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || supplier.supplierType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddSupplier = async () => {
    if (newSupplier.name && newSupplier.email) {
      setLoading(true);
      const toastId = toast.loading("Adding supplier...");

      const supplierData = {
        company_name: newSupplier.name,
        contact_person: newSupplier.contactPerson,
        email: newSupplier.email,
        phone: newSupplier.phone || "",
        address: newSupplier.address,
        total_orders: 0,
        total_spent: 0,
        rating: 0,
        recent_transactions: [],
      };

      try {
        // Insert directly into Supabase
        const { data, error } = await supabase
          .from("suppliers")
          .insert([supplierData])
          .select();

        if (error) throw error;

        // Create the supplier object for the UI
        const supplier: Supplier = {
          id: data[0].id,
          name: newSupplier.name,
          contactPerson: newSupplier.contactPerson || "",
          email: newSupplier.email,
          phone: newSupplier.phone || "",
          address: newSupplier.address,
          website: newSupplier.website,
          supplierType: (newSupplier.supplierType as any) || "general",
          paymentTerms: newSupplier.paymentTerms || "Net 30",
          rating: 0,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: newSupplier.lastOrder,
          dateAdded: new Date().toISOString().split("T")[0],
          notes: newSupplier.notes,
          products: newSupplier.products || [],
          recentTransactions: [],
        };

        setSuppliers([...suppliers, supplier]);
        setNewSupplier({
          products: [],
          recentTransactions: [],
        });
        setIsAddDialogOpen(false);
        toast.success("Supplier added successfully", { id: toastId });
      } catch (error) {
        console.error("Error adding supplier:", error);
        toast.error("Failed to add supplier", { id: toastId });

        // Fallback to local state only if there's an error (for demo purposes)
        const supplier: Supplier = {
          id: Date.now().toString(),
          name: newSupplier.name,
          contactPerson: newSupplier.contactPerson || "",
          email: newSupplier.email,
          phone: newSupplier.phone || "",
          address: newSupplier.address,
          website: newSupplier.website,
          supplierType: (newSupplier.supplierType as any) || "general",
          paymentTerms: newSupplier.paymentTerms || "Net 30",
          rating: 0,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: newSupplier.lastOrder,
          dateAdded: new Date().toISOString().split("T")[0],
          notes: newSupplier.notes,
          products: newSupplier.products || [],
          recentTransactions: [],
        };
        setSuppliers([...suppliers, supplier]);
        setNewSupplier({
          products: [],
          recentTransactions: [],
        });
        setIsAddDialogOpen(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    setLoading(true);
    const toastId = toast.loading("Updating supplier...");
    try {
      // Update directly in Supabase
      const { error } = await supabase
        .from("suppliers")
        .update({
          company_name: updatedSupplier.name,
          contact_person: updatedSupplier.contactPerson,
          email: updatedSupplier.email,
          phone: updatedSupplier.phone,
          address: updatedSupplier.address,
          total_orders: updatedSupplier.totalOrders,
          total_spent: updatedSupplier.totalSpent,
          rating: updatedSupplier.rating,
          recent_transactions: updatedSupplier.recentTransactions,
        })
        .eq("id", updatedSupplier.id);

      if (error) throw error;

      // Update the local state
      setSuppliers(
        suppliers.map((supplier) =>
          supplier.id === updatedSupplier.id ? updatedSupplier : supplier
        )
      );
      setIsEditDialogOpen(false);
      setEditingSupplier(null);
      toast.success("Supplier updated successfully", { id: toastId });
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?"))
      return;

    const toastId = toast.loading("Deleting supplier...");
    try {
      // Delete directly from Supabase
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) throw error;

      // Update the local state
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
      toast.success("Supplier deleted successfully", { id: toastId });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier", { id: toastId });
    }
  };

  const getSupplierTypeColor = (type: string) => {
    const colors = {
      paints: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      canvas: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      frames: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      brushes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    };
    return (
      colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300 dark:text-gray-600"
          }`}
      />
    ));
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Supplier Management
          </h2>
          <p className="text-muted-foreground">
            Manage your vendors and track purchase history
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the supplier's information to add them to your vendor
                list.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierName" className="text-right">
                  Name
                </Label>
                <Input
                  id="supplierName"
                  value={newSupplier.name || ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Company Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPerson" className="text-right">
                  Contact
                </Label>
                <Input
                  id="contactPerson"
                  value={newSupplier.contactPerson || ""}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      contactPerson: e.target.value,
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Contact person name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  value={newSupplier.email || ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, email: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierPhone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="supplierPhone"
                  value={newSupplier.phone || ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, phone: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierAddress" className="text-right">
                  Address
                </Label>
                <Input
                  id="supplierAddress"
                  value={newSupplier.address || ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, address: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Full Address"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newSupplier.supplierType}
                  onValueChange={(value) =>
                    setNewSupplier({
                      ...newSupplier,
                      supplierType: value as any,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select supplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paints">Paints</SelectItem>
                    <SelectItem value="canvas">Canvas</SelectItem>
                    <SelectItem value="frames">Frames</SelectItem>
                    <SelectItem value="brushes">Brushes</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentTerms" className="text-right">
                  Payment
                </Label>
                <Input
                  id="paymentTerms"
                  value={newSupplier.paymentTerms || ""}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      paymentTerms: e.target.value,
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="e.g., Net 30"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierNotes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="supplierNotes"
                  value={newSupplier.notes || ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, notes: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSupplier} disabled={loading} className="bg-primary text-white">
                {loading ? "Adding..." : "Add Supplier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Supplier Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update the supplier's information.
              </DialogDescription>
            </DialogHeader>

            {editingSupplier && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSupplierName" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="editSupplierName"
                    value={editingSupplier.name || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        name: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editContactPerson" className="text-right">
                    Contact
                  </Label>
                  <Input
                    id="editContactPerson"
                    value={editingSupplier.contactPerson || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        contactPerson: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSupplierEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="editSupplierEmail"
                    type="email"
                    value={editingSupplier.email || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        email: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSupplierPhone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="editSupplierPhone"
                    value={editingSupplier.phone || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        phone: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSupplierAddress" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="editSupplierAddress"
                    value={editingSupplier.address || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        address: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSupplierType" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={editingSupplier.supplierType}
                    onValueChange={(value) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        supplierType: value as any,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3 glass-input">
                      <SelectValue placeholder="Select supplier type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paints">Paints</SelectItem>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="frames">Frames</SelectItem>
                      <SelectItem value="brushes">Brushes</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editPaymentTerms" className="text-right">
                    Payment
                  </Label>
                  <Input
                    id="editPaymentTerms"
                    value={editingSupplier.paymentTerms || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        paymentTerms: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => editingSupplier && handleUpdateSupplier(editingSupplier)} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 rounded-2xl animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search suppliers by name, email, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="paints">Paints</SelectItem>
              <SelectItem value="canvas">Canvas</SelectItem>
              <SelectItem value="frames">Frames</SelectItem>
              <SelectItem value="brushes">Brushes</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-enter" style={{ animationDelay: '200ms' }}>
        {filteredSuppliers.map((supplier, index) => (
          <div
            key={supplier.id}
            className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 animate-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white/50 shadow-sm">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(supplier.name)}&background=random`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(supplier.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {supplier.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn("mt-1 capitalize border", getSupplierTypeColor(supplier.supplierType))}
                    >
                      {supplier.supplierType}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      setEditingSupplier(supplier);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedSupplier(supplier);
                      setIsViewDialogOpen(true);
                    }}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Building className="h-4 w-4 text-primary/60" />
                  <span className="truncate">{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary/60" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary/60" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.website && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 text-primary/60" />
                    <a href={`https://${supplier.website}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary truncate">
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="font-bold text-foreground">{formatCurrency(supplier.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-0.5">
                    {renderStars(supplier.rating)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
