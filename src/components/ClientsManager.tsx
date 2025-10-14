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
} from "lucide-react";
import { toast } from "sonner";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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
        console.log(`Loaded ${clientsFromDb.length} clients from database`);
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
      } catch (error) {
        console.error("Error adding client:", error);
        // Fallback to local state only if there's an error
        const client: Client = {
          id: Date.now().toString(),
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
    } catch (error) {
      console.error("Error updating client:", error);
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
      const { data } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const clientsFromDb = data.map((client) => ({
          id: client.id,
          name: client.name,
          company: client.company,
          email: client.email,
          phone: client.phone,
          address: client.address,
          clientType: client.client_type || "residential",
          preferences: [],
          totalSpent: 0,
          lastPurchase: "",
          dateAdded: client.created_at
            ? new Date(client.created_at).toISOString().split("T")[0]
            : "",
          notes: client.notes || "",
          purchaseHistory: [],
        }));
        setClients(clientsFromDb);
      }
    }
  };

  const getClientTypeColor = (type: string) => {
    const colors = {
      residential: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      commercial: "bg-green-500/20 text-green-600 dark:text-green-400",
      industrial: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
      government: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
      gallery: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
    };
    return (
      colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-foreground">
            Client Management
          </h2>
          <p className="text-muted-foreground">
            Manage your customers and track their purchase history
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
                  className="col-span-3"
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
                  className="col-span-3"
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
                  className="col-span-3"
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
                  className="col-span-3"
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
                  className="col-span-3"
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
                  <SelectTrigger className="col-span-3">
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
                  className="col-span-3"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleAddClient}>Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
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
                    className="col-span-3"
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
                    className="col-span-3"
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
                    className="col-span-3"
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
                    className="col-span-3"
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
                    className="col-span-3"
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
                    <SelectTrigger className="col-span-3">
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
                    className="col-span-3"
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
      <Card className="p-6 backdrop-blur-sm border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus:border-blue-500"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
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
      </Card>

      {/* Client Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {client.name}
                  </CardTitle>
                  {client.company && (
                    <CardDescription className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{client.company}</span>
                    </CardDescription>
                  )}
                  <div className="mt-2">
                    <Badge className={getClientTypeColor(client.clientType)}>
                      {client.clientType}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
              {client.address && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{client.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(client.totalSpent)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Spent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {client.orderCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
              </div>

              {client.lastPurchase && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Last purchase:{" "}
                    {new Date(client.lastPurchase).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {client.preferences.map((pref, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {pref}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedClient(client);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingClient({ ...client });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{selectedClient.name}</div>
                    {selectedClient.company && (
                      <div className="text-sm text-muted-foreground">
                        {selectedClient.company}
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    {selectedClient.address && (
                      <div className="col-span-2 flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h4 className="font-medium mb-3">Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-semibold text-green-600">
                        ${selectedClient.totalSpent.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Spent
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-semibold">
                        {selectedClient.purchaseHistory.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Orders
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-semibold">
                        {selectedClient.purchaseHistory.length > 0
                          ? `$${(
                              selectedClient.totalSpent /
                              selectedClient.purchaseHistory.length
                            ).toFixed(0)}`
                          : "$0"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Order
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <h4 className="font-medium mb-3">Recent Purchases</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedClient.purchaseHistory.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex justify-between items-start p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{purchase.items}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(purchase.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="font-semibold text-green-600">
                          ${purchase.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedClient.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
