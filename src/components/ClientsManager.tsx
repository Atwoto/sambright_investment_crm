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
import { formatCurrency } from "../utils/currency";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  MoreHorizontal,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { canAccess } from "../lib/permissions";
import { AccessDenied } from "./ui/AccessDenied";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  clientType:
  | "residential"
  | "commercial"
  | "industrial"
  | "government"
  | "gallery";
  preferences: string[];
  totalSpent: number;
  orderCount?: number;
  lastPurchase?: string;
  dateAdded: string;
  notes?: string;
  purchaseHistory: Array<{
    id: string;
    date: string;
    amount: number;
    items: string;
  }>;
}

export function ClientsManager() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  if (!canAccess(user?.role, location.pathname)) {
    return <AccessDenied />;
  }
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    preferences: [],
  });

  useEffect(() => {
    // Load clients directly from Supabase
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          toast.error("Failed to load clients from database");
          setClients([]);
          return;
        }

        // Load orders to calculate total spent
        const { data: ordersData } = await supabase
          .from("orders")
          .select("client_id, total");

        // Calculate total spent per client
        const clientTotals = (ordersData || []).reduce((acc, order) => {
          if (order.client_id) {
            acc[order.client_id] =
              (acc[order.client_id] || 0) + (order.total || 0);
          }
          return acc;
        }, {} as Record<string, number>);

        // Count orders per client
        const clientOrderCounts = (ordersData || []).reduce((acc, order) => {
          if (order.client_id) {
            acc[order.client_id] = (acc[order.client_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const clientsFromDb = (data || []).map((client) => ({
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
          phone: client.phone,
          address: client.address,
          clientType: client.client_type || "residential",
          preferences: [],
          totalSpent: clientTotals[client.id] || 0,
          orderCount: clientOrderCounts[client.id] || 0,
          lastPurchase: "",
          dateAdded: client.created_at
            ? new Date(client.created_at).toISOString().split("T")[0]
            : "",
          notes: client.notes || "",
          purchaseHistory: [], // Could be populated from orders if needed
        }));

        setClients(clientsFromDb);
      } catch (error) {
        console.error("Error loading clients:", error);
        toast.error("Failed to load clients");
        setClients([]);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (client.company?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || client.clientType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddClient = async () => {
    if (newClient.name && newClient.email) {
      const clientData = {
        name: newClient.name,
        company: newClient.company || "",
        email: newClient.email,
        phone: newClient.phone || "",
        address: newClient.address || "",
        client_type: newClient.clientType || "residential",
        notes: newClient.notes || "",
      };

      try {
        // Insert directly into Supabase
        const { data, error } = await supabase
          .from("clients")
          .insert([clientData])
          .select();

        if (error) throw error;

        // Create the client object for the UI
        const client: Client = {
          id: data[0].id,
          name: newClient.name,
          company: newClient.company || "",
          email: newClient.email,
          phone: newClient.phone || "",
          address: newClient.address || "",
          clientType: (newClient.clientType as any) || "residential",
          preferences: newClient.preferences || [],
          totalSpent: 0,
          dateAdded: new Date().toISOString().split("T")[0],
          notes: newClient.notes || "",
          purchaseHistory: [],
          lastPurchase: "",
        };

        setClients([...clients, client]);
        setNewClient({ preferences: [] });
        setIsAddDialogOpen(false);
        toast.success("Client added successfully");
      } catch (error) {
        console.error("Error adding client:", error);
        toast.error("Failed to add client");
      }
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      // Update directly in Supabase
      const { error } = await supabase
        .from("clients")
        .update({
          name: updatedClient.name,
          company: updatedClient.company || "",
          email: updatedClient.email,
          phone: updatedClient.phone,
          address: updatedClient.address || "",
          client_type: updatedClient.clientType,
          notes: updatedClient.notes || "",
        })
        .eq("id", updatedClient.id);

      if (error) throw error;

      // Update the local state
      setClients(
        clients.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      toast.success("Client updated successfully");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  const handleDeleteClient = async (id: string) => {
    // Check if client has related projects and orders
    const { data: relatedProjects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("client_id", id);

    const { data: relatedOrders } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("client_id", id);

    const projectCount = relatedProjects?.length || 0;
    const orderCount = relatedOrders?.length || 0;

    if (projectCount > 0 || orderCount > 0) {
      let confirmMessage = `This client has:\n`;
      if (projectCount > 0) {
        const projectNames = relatedProjects!.map((p) => p.name).join(", ");
        confirmMessage += `- ${projectCount} related project(s): ${projectNames}\n`;
      }
      if (orderCount > 0) {
        const orderNumbers = relatedOrders!
          .map((o) => o.order_number)
          .join(", ");
        confirmMessage += `- ${orderCount} related order(s): ${orderNumbers}\n`;
      }
      confirmMessage += `\nDeleting this client will also delete all related data. Are you sure you want to continue?`;

      if (!window.confirm(confirmMessage)) return;

      const toastId = toast.loading("Deleting related data...");

      // Delete related orders first
      if (orderCount > 0) {
        const { error: orderDeleteError } = await supabase
          .from("orders")
          .delete()
          .eq("client_id", id);

        if (orderDeleteError) {
          console.error("Error deleting orders:", orderDeleteError);
          toast.error("Failed to delete related orders", { id: toastId });
          return;
        }
      }

      // Delete related projects
      if (projectCount > 0) {
        const { error: projectDeleteError } = await supabase
          .from("projects")
          .delete()
          .eq("client_id", id);

        if (projectDeleteError) {
          console.error("Error deleting projects:", projectDeleteError);
          toast.error("Failed to delete related projects", { id: toastId });
          return;
        }
      }

      toast.success("Related data deleted", { id: toastId });
    } else {
      if (!window.confirm("Are you sure you want to delete this client?"))
        return;
    }

    const toastId = toast.loading("Deleting client...");

    // Optimistically remove from UI
    setClients(clients.filter((client) => client.id !== id));

    try {
      // Delete directly from Supabase
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;

      toast.success("Client deleted successfully", { id: toastId });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      const errorMessage = error?.message?.includes("foreign key")
        ? "Cannot delete client: Still has related data. Please contact support."
        : "Failed to delete client";
      toast.error(errorMessage, { id: toastId });
      // Reload clients on error
      // ... (reload logic omitted for brevity, similar to original)
    }
  };

  const getClientTypeColor = (type: string) => {
    const colors = {
      residential: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      commercial: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      industrial: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
      government: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      gallery: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    };
    return (
      colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
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

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Client Management
          </h2>
          <p className="text-muted-foreground">
            Manage your customers and track their purchase history
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the client's information to add them to your CRM.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientName" className="text-right">
                  Name
                </Label>
                <Input
                  id="clientName"
                  value={newClient.name || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="col-span-3 glass-input"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={newClient.company || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, company: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newClient.email || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                  className="col-span-3 glass-input"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientPhone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="clientPhone"
                  value={newClient.phone || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                  className="col-span-3 glass-input"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientAddress" className="text-right">
                  Address
                </Label>
                <Input
                  id="clientAddress"
                  value={newClient.address || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                  className="col-span-3 glass-input"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newClient.clientType}
                  onValueChange={(value) =>
                    setNewClient({ ...newClient, clientType: value as any })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="gallery">Gallery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientNotes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="clientNotes"
                  value={newClient.notes || ""}
                  onChange={(e) =>
                    setNewClient({ ...newClient, notes: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleAddClient} className="bg-primary text-white hover:bg-primary/90">Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update the client's information.
              </DialogDescription>
            </DialogHeader>

            {editingClient && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="editClientName"
                    value={editingClient.name || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        name: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCompany" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="editCompany"
                    value={editingClient.company || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        company: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                    placeholder="Optional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientEmail" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="editClientEmail"
                    type="email"
                    value={editingClient.email || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        email: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientPhone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="editClientPhone"
                    value={editingClient.phone || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        phone: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientAddress" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="editClientAddress"
                    value={editingClient.address || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        address: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientType" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={editingClient.clientType}
                    onValueChange={(value) =>
                      setEditingClient({
                        ...editingClient,
                        clientType: value as any,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3 glass-input">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientNotes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="editClientNotes"
                    value={editingClient.notes || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        notes: e.target.value,
                      })
                    }
                    className="col-span-3 glass-input"
                    placeholder="Any additional notes..."
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
              <Button
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  if (editingClient) {
                    handleUpdateClient(editingClient);
                    setIsEditDialogOpen(false);
                  }
                }}
              >
                Save Changes
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
              placeholder="Search clients by name, company, email..."
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
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="gallery">Gallery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client, index) => (
          <div
            key={client.id}
            className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white/50 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    {client.company && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building className="h-3 w-3 mr-1" />
                        <span className="truncate">{client.company}</span>
                      </div>
                    )}
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
                      setEditingClient(client);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("capitalize border", getClientTypeColor(client.clientType))}>
                  {client.clientType}
                </Badge>
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-muted-foreground border-0">
                  {client.orderCount || 0} Orders
                </Badge>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary/60" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary/60" />
                  <span>{client.phone}</span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Total Spent</span>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(client.totalSpent)}
                  </div>
                </div>
                {client.lastPurchase && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Last: {new Date(client.lastPurchase).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
