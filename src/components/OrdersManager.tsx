import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import { createOrderLetterheadHTML } from "../utils/orderPrintTemplate";
import { formatCurrency } from "../utils/currency";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Printer,
  Mail,
  MoreHorizontal,
  ArrowUpRight
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
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { canAccess } from "../lib/permissions";
import { AccessDenied } from "./ui/AccessDenied";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productType: "paint" | "painting";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  type: "quote" | "sale" | "invoice";
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "completed" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid" | "overdue";
  paymentMethod?: string;
  dateCreated: string;
  notes?: string;
  discount?: number;
  shippingAddress?: string;
  billingAddress?: string;
  dueDate?: string;
}

export function OrdersManager() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!canAccess(user?.role, location.pathname)) {
    return <AccessDenied />;
  }
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  });
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    productName: "",
    productType: "painting",
    quantity: 1,
    unitPrice: 0,
  });
  const [editItem, setEditItem] = useState<Partial<OrderItem>>({
    productName: "",
    productType: "painting",
    quantity: 1,
    unitPrice: 0,
  });
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clients, setClients] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  useEffect(() => {
    // Load orders and clients from Supabase
    const loadData = async () => {
      try {
        // Load clients
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, name, email")
          .order("name");

        if (clientsData) setClients(clientsData);

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          toast.error("Failed to load orders from database");
          setOrders([]);
          return;
        }

        // Map Supabase data to our Order interface
        const mappedOrders = (data || []).map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          type: order.order_type || "sale",
          clientId: order.client_id || "",
          clientName: "Client Name", // Would need to join with clients table
          clientEmail: "client@example.com", // Would need to join with clients table
          items: order.items || [],
          subtotal: order.total ? order.total - (order.tax || 0) : 0,
          tax: order.tax || 0,
          total: order.total || 0,
          status: order.status || "draft",
          paymentStatus: order.payment_status || "pending",
          paymentMethod: order.payment_method || "",
          dateCreated: order.created_at
            ? new Date(order.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          dueDate: order.due_date || "", // Map due_date from database
          notes: order.notes || "",
          discount: order.discount || 0,
          shippingAddress: order.shipping_address || "",
          billingAddress: order.billing_address || "",
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Error loading orders from Supabase:", error);
        toast.error("Failed to load orders");
        setOrders([]);
      }
    };

    loadData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.orderNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (order.clientName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (order.clientEmail?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;
    const matchesTab = activeTab === "all" || order.type === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      accepted: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    } as const;

    return (
      <Badge variant="outline" className={cn("capitalize border", variants[status as keyof typeof variants] || "")}>
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      partial: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    } as const;

    return (
      <Badge variant="outline" className={cn("capitalize border", variants[status as keyof typeof variants] || "")}>
        {status}
      </Badge>
    );
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "quote":
        return <FileText className="h-4 w-4" />;
      case "invoice":
        return <CreditCard className="h-4 w-4" />;
      case "sale":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Helpers for totals and items (create)
  const recalcTotals = (items: OrderItem[], tax: number) => {
    const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    const total = subtotal + (tax || 0);
    return { subtotal, total };
  };

  const addItemToNewOrder = () => {
    if (!newItem.productName) return;
    const item: OrderItem = {
      id: `${Date.now()}`,
      productId: "",
      productName: newItem.productName!,
      productType: (newItem.productType as any) || "painting",
      quantity: Number(newItem.quantity) || 1,
      unitPrice: Number(newItem.unitPrice) || 0,
      totalPrice:
        (Number(newItem.quantity) || 1) * (Number(newItem.unitPrice) || 0),
    };
    const items = [...(newOrder.items as OrderItem[]), item];
    const { subtotal, total } = recalcTotals(items, Number(newOrder.tax) || 0);
    setNewOrder({ ...newOrder, items, subtotal, total });
    setNewItem({
      productName: "",
      productType: newItem.productType || "painting",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeItemFromNewOrder = (id: string) => {
    const items = (newOrder.items as OrderItem[]).filter((i) => i.id !== id);
    const { subtotal, total } = recalcTotals(items, Number(newOrder.tax) || 0);
    setNewOrder({ ...newOrder, items, subtotal, total });
  };

  const updateNewTax = (value: number) => {
    const { subtotal, total } = recalcTotals(
      (newOrder.items as OrderItem[]) || [],
      value || 0
    );
    setNewOrder({ ...newOrder, tax: value || 0, subtotal, total });
  };

  const genOrderNumber = (type: string) => {
    const prefix = (type || "ord").slice(0, 3).toUpperCase();
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `${prefix}-${new Date().getFullYear()}-${rand}`;
  };

  const handleCreateOrder = async () => {
    if (!newOrder.type || !newOrder.clientName || !newOrder.clientEmail) return;
    setCreating(true);
    const toastId = toast.loading("Creating order...");
    const items = (newOrder.items as OrderItem[]) || [];
    const { subtotal, total } = recalcTotals(items, Number(newOrder.tax) || 0);
    const localId = `${Date.now()}`;
    const order: Order = {
      id: localId,
      orderNumber: genOrderNumber(newOrder.type as string),
      type: newOrder.type as any,
      clientId: newOrder.clientId || "",
      clientName: newOrder.clientName!,
      clientEmail: newOrder.clientEmail!,
      items,
      subtotal,
      tax: Number(newOrder.tax) || 0,
      total,
      status: "draft",
      paymentStatus: (newOrder.paymentStatus as any) || "pending",
      paymentMethod: newOrder.paymentMethod,
      dateCreated: new Date().toISOString().split("T")[0],
      notes: newOrder.notes,
      discount: 0,
      shippingAddress: "",
      billingAddress: "",
      dueDate: newOrder.dueDate,
    };

    // Optimistic add
    setOrders((prev) => [order, ...prev]);
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: order.orderNumber,
          order_type: order.type,
          client_id: order.clientId || null,
          items: order.items,
          tax: order.tax,
          total: order.total,
          status: order.status,
          payment_status: order.paymentStatus,
          payment_method: order.paymentMethod || null,
          discount: order.discount || 0,
          shipping_address: order.shippingAddress || "",
          billing_address: order.billingAddress || "",
          notes: order.notes || null,
          due_date: order.dueDate || null,
          created_at: new Date().toISOString(),
        })
        .select("id, order_number")
        .single();
      if (error) throw error;
      // Reconcile id and number from DB
      if (data) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === localId
              ? {
                ...o,
                id: data.id || o.id,
                orderNumber: data.order_number || o.orderNumber,
              }
              : o
          )
        );
      }
      toast.success("Order created", { id: toastId });
    } catch (e: any) {
      const errorMsg = e?.message || "Unknown error";
      toast.error(`Database error: ${errorMsg}`, {
        id: toastId,
        duration: 5000,
      });
      console.error("Full error:", e);
    }
    setCreating(false);
    setIsAddDialogOpen(false);
    setNewOrder({ items: [], subtotal: 0, tax: 0, total: 0 });
    setNewItem({
      productName: "",
      productType: "painting",
      quantity: 1,
      unitPrice: 0,
    });
  };

  // Edit helpers
  const addItemToEditOrder = () => {
    if (!editOrder || !editItem.productName) return;
    const item: OrderItem = {
      id: `${Date.now()}`,
      productId: "",
      productName: editItem.productName!,
      productType: (editItem.productType as any) || "painting",
      quantity: Number(editItem.quantity) || 1,
      unitPrice: Number(editItem.unitPrice) || 0,
      totalPrice:
        (Number(editItem.quantity) || 1) * (Number(editItem.unitPrice) || 0),
    };
    const items = [...editOrder.items, item];
    const { subtotal, total } = recalcTotals(items, Number(editOrder.tax) || 0);
    setEditOrder({ ...editOrder, items, subtotal, total });
    setEditItem({
      productName: "",
      productType: editItem.productType || "painting",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeItemFromEditOrder = (id: string) => {
    if (!editOrder) return;
    const items = editOrder.items.filter((i) => i.id !== id);
    const { subtotal, total } = recalcTotals(items, Number(editOrder.tax) || 0);
    setEditOrder({ ...editOrder, items, subtotal, total });
  };

  const updateEditTax = (value: number) => {
    if (!editOrder) return;
    const { subtotal, total } = recalcTotals(editOrder.items, value || 0);
    setEditOrder({ ...editOrder, tax: value || 0, subtotal, total });
  };

  const handleSaveEditOrder = async () => {
    if (!editOrder) return;
    setSavingEdit(true);
    const id = toast.loading("Saving changes...");
    setOrders((prev) =>
      prev.map((o) => (o.id === editOrder.id ? editOrder : o))
    );
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_number: editOrder.orderNumber,
          order_type: editOrder.type,
          client_id: editOrder.clientId || null,
          items: editOrder.items,
          tax: editOrder.tax,
          total: editOrder.total,
          status: editOrder.status,
          payment_status: editOrder.paymentStatus,
          payment_method: editOrder.paymentMethod || null,
          discount: editOrder.discount || 0,
          shipping_address: editOrder.shippingAddress || "",
          billing_address: editOrder.billingAddress || "",
          notes: editOrder.notes || null,
          due_date: editOrder.dueDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editOrder.id);
      if (error) throw error;
      toast.success("Order updated", { id });
    } catch (e: any) {
      const errorMsg = e?.message || "Unknown error";
      toast.error(`Database error: ${errorMsg}`, { id, duration: 5000 });
      console.error("Full error:", e);
    }
    setSavingEdit(false);
    setIsEditDialogOpen(false);
    setEditOrder(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order?")) return;
    setDeletingId(orderId);
    const id = toast.loading("Deleting order...");
    // Optimistic delete
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Order deleted", { id });
    } catch (e: any) {
      const errorMsg = e?.message || "Unknown error";
      toast.error(`Database error: ${errorMsg}`, { id, duration: 5000 });
      console.error("Full error:", e);
    }
    setDeletingId(null);
  };

  const handlePrintOrder = (order: Order) => {
    const printContent = createOrderLetterheadHTML({
      orderNumber: order.orderNumber,
      type: order.type,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: order.status,
      dateCreated: order.dateCreated,
      dueDate: order.dueDate,
      notes: order.notes,
    });
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.focus();
      w.print();
      w.close();
    }
  };

  const handleDownloadOrder = (order: Order) => {
    const html = createOrderLetterheadHTML({
      orderNumber: order.orderNumber,
      type: order.type,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: order.status,
      dateCreated: order.dateCreated,
      dueDate: order.dueDate,
      notes: order.notes,
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailOrder = (order: Order) => {
    const subject = `${order.orderNumber} from Sambright Investment Ltd`;
    const body =
      `Dear ${order.clientName},\n\n` +
      `Please find attached your ${order.type} ${order.orderNumber}.\n\n` +
      `Order Details:\n` +
      `- Order Number: ${order.orderNumber}\n` +
      `- Date: ${new Date(order.dateCreated).toLocaleDateString()}\n` +
      `- Status: ${order.status}\n` +
      `- Total: ${order.total.toFixed(2)}\n\n` +
      `Thank you for your business!\n\n` +
      `Best regards,\nSambright Investment Ltd\nPainting Business CRM`;

    window.location.href = `mailto:${order.clientEmail
      }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Orders & Invoices
          </h2>
          <p className="text-muted-foreground">
            Manage quotes, sales orders, and invoices
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col glass-panel border-white/20">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Create a new quote, sale order, or invoice.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newOrder.type}
                  onValueChange={(value) =>
                    setNewOrder({ ...newOrder, type: value as any })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="sale">Sale Order</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client *
                </Label>
                <Select
                  value={newOrder.clientId}
                  onValueChange={(value) => {
                    const client = clients.find((c) => c.id === value);
                    setNewOrder({
                      ...newOrder,
                      clientId: value,
                      clientName: client?.name || "",
                      clientEmail: client?.email || "",
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newOrder.clientEmail || ""}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, clientEmail: e.target.value })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Auto-filled from client"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={(newOrder.dueDate as any) || ""}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, dueDate: e.target.value })
                  }
                  className="col-span-3 glass-input"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentStatus" className="text-right">
                  Payment Status
                </Label>
                <Select
                  value={newOrder.paymentStatus || "pending"}
                  onValueChange={(value) =>
                    setNewOrder({ ...newOrder, paymentStatus: value as any })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items builder */}
              <div className="space-y-3 border-t border-white/10 pt-3">
                <Label className="text-sm font-semibold">Order Items</Label>
                <div className="space-y-2">
                  <div className="grid gap-3">
                    <div>
                      <Label className="mb-1.5 block text-sm">
                        Item Description
                      </Label>
                      <Input
                        value={newItem.productName || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            productName: e.target.value,
                          })
                        }
                        placeholder="Enter product or service description"
                        className="h-10 text-base glass-input"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1.5 block text-sm">Type</Label>
                        <Select
                          value={(newItem.productType as any) || "painting"}
                          onValueChange={(v) =>
                            setNewItem({ ...newItem, productType: v as any })
                          }
                        >
                          <SelectTrigger className="h-10 glass-input">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="painting">Painting</SelectItem>
                            <SelectItem value="paint">Paint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={Number(newItem.quantity) || 1}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              quantity: Number(e.target.value),
                            })
                          }
                          className="h-10 text-base glass-input"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-sm">
                          Unit Price (KSh)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={Number(newItem.unitPrice) || 0}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              unitPrice: Number(e.target.value),
                            })
                          }
                          className="h-10 text-base glass-input"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={addItemToNewOrder}
                      className="w-full h-10 border-dashed border-2 hover:bg-primary/5"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item to Order
                    </Button>
                  </div>

                  {/* Items List */}
                  {newOrder.items && newOrder.items.length > 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 mt-4">
                      <div className="text-sm font-medium mb-2">Items Added:</div>
                      <div className="space-y-2">
                        {newOrder.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-white/10 p-2 rounded"
                          >
                            <div className="text-sm">
                              <span className="font-medium">
                                {item.productName}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                ({item.quantity} x {formatCurrency(item.unitPrice)})
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm">
                                {formatCurrency(item.totalPrice)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                                onClick={() => removeItemFromNewOrder(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3 pt-3 border-t border-white/10">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Subtotal: {formatCurrency(newOrder.subtotal || 0)}
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">Tax:</span>
                            <Input
                              type="number"
                              className="h-6 w-20 text-right glass-input"
                              value={newOrder.tax || 0}
                              onChange={(e) =>
                                updateNewTax(Number(e.target.value))
                              }
                            />
                          </div>
                          <div className="text-lg font-bold mt-1 text-primary">
                            Total: {formatCurrency(newOrder.total || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-white/10 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={creating} className="bg-primary text-white hover:bg-primary/90">
                {creating ? "Creating..." : "Create Order"}
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
              placeholder="Search orders by number, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 animate-enter" style={{ animationDelay: '200ms' }}>
        <TabsList className="p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/20">
          <TabsTrigger value="all" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">All Orders</TabsTrigger>
          <TabsTrigger value="quote" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Quotes</TabsTrigger>
          <TabsTrigger value="sale" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Sales</TabsTrigger>
          <TabsTrigger value="invoice" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="group glass-card rounded-xl p-0 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-enter"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        order.type === 'quote' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                          order.type === 'invoice' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" :
                            "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                      )}>
                        {getOrderTypeIcon(order.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {order.orderNumber}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {order.type}
                        </p>
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
                        <DropdownMenuItem onClick={() => handlePrintOrder(order)}>
                          <Printer className="h-4 w-4 mr-2" /> Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadOrder(order)}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEmailOrder(order)}>
                          <Mail className="h-4 w-4 mr-2" /> Email Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium truncate max-w-[120px]">{order.clientName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Payment</span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Total Amount</span>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(order.dateCreated).toLocaleDateString()}</span>
                    </div>
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
