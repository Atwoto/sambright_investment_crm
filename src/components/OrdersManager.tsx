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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    // Load orders from Supabase
    const loadOrders = async () => {
      try {
        console.log("Attempting to load orders from Supabase...");
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

        console.log("Supabase data:", data);

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
          paymentStatus: "pending", // Default value
          paymentMethod: "", // Default value
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
        console.log(`Loaded ${mappedOrders.length} orders from database`);
      } catch (error) {
        console.error("Error loading orders from Supabase:", error);
        toast.error("Failed to load orders");
        setOrders([]);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;
    const matchesTab = activeTab === "all" || order.type === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      completed: "default",
      cancelled: "destructive",
    } as const;
    const colors = {
      draft: "text-gray-600",
      sent: "text-blue-600",
      accepted: "text-green-600",
      completed: "text-green-700",
      cancelled: "text-red-600",
    };
    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "outline"}
        className={colors[status as keyof typeof colors] || ""}
      >
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      partial: "outline",
      paid: "default",
      overdue: "destructive",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "sent":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (order: Order) => {
    if (!order.dueDate) return false;
    return (
      new Date(order.dueDate) < new Date() && order.paymentStatus !== "paid"
    );
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
      clientId: "",
      clientName: newOrder.clientName!,
      clientEmail: newOrder.clientEmail!,
      items,
      subtotal,
      tax: Number(newOrder.tax) || 0,
      total,
      status: "draft",
      paymentStatus: "pending",
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
    } catch (e) {
      toast.info("Saved locally (offline or server error)", { id: toastId });
      console.error(e);
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
    } catch (e) {
      toast.info("Updated locally (offline or server error)", { id });
      console.error(e);
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
    } catch (e) {
      // Revert optimistic delete on error
      // Note: In a real implementation, you'd want to re-fetch the orders from the database
      toast.info("Deleted locally (offline or server error)", { id });
      console.error("Error deleting order:", e);
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

    window.location.href = `mailto:${
      order.clientEmail
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900">
            Orders & Invoices
          </h2>
          <p className="text-gray-600">
            Manage quotes, sales orders, and invoices
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Create a new quote, sale order, or invoice.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
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
                  <SelectTrigger className="col-span-3">
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
                <Label htmlFor="clientName" className="text-right">
                  Client
                </Label>
                <Input
                  id="clientName"
                  value={newOrder.clientName || ""}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, clientName: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Client name"
                />
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
                  className="col-span-3"
                  placeholder="client@email.com"
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
                  className="col-span-3"
                />
              </div>

              {/* Items builder */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-sm font-semibold">Order Items</Label>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="mb-1 block text-xs">Item</Label>
                    <Input
                      value={newItem.productName || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, productName: e.target.value })
                      }
                      placeholder="Description"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block text-xs">Type</Label>
                    <Select
                      value={(newItem.productType as any) || "painting"}
                      onValueChange={(v) =>
                        setNewItem({ ...newItem, productType: v as any })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="paint">Paint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block text-xs">Qty</Label>
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
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block text-xs">Price</Label>
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
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addItemToNewOrder}
                      className="h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                {(newOrder.items as OrderItem[]).length > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <div className="bg-gray-50 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 sticky top-0">
                      <div className="col-span-4">Product</div>
                      <div className="col-span-2 text-center">Type</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {(newOrder.items as OrderItem[]).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 grid grid-cols-12 gap-2 border-t items-center text-sm hover:bg-gray-50"
                      >
                        <div className="col-span-4 font-medium text-sm">
                          {item.productName}
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.productType}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center">
                          {item.quantity}
                        </div>
                        <div className="col-span-2 text-right text-xs">
                          {formatCurrency(item.unitPrice)}
                        </div>
                        <div className="col-span-1 text-right font-semibold text-sm">
                          {formatCurrency(item.totalPrice)}
                        </div>
                        <div className="col-span-1 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromNewOrder(item.id)}
                            className="text-red-600 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax and totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taxAmount" className="text-right text-sm">
                    Tax/Fees
                  </Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    value={Number(newOrder.tax) || 0}
                    onChange={(e) => updateNewTax(Number(e.target.value))}
                    className="col-span-3 h-9"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4 bg-gray-50 p-3 rounded-lg">
                  <Label className="text-right text-sm font-semibold">
                    Totals
                  </Label>
                  <div className="col-span-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <strong>
                        {formatCurrency(Number(newOrder.subtotal) || 0)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax/Fees:</span>
                      <strong>
                        {formatCurrency(Number(newOrder.tax) || 0)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-base border-t pt-1">
                      <span className="font-semibold">Total:</span>
                      <strong className="text-green-600">
                        {formatCurrency(Number(newOrder.total) || 0)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="orderNotes" className="text-right text-sm pt-2">
                  Notes
                </Label>
                <Textarea
                  id="orderNotes"
                  value={newOrder.notes || ""}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, notes: e.target.value })
                  }
                  className="col-span-3 h-20"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t mt-4">
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const html = createOrderLetterheadHTML({
                      orderNumber: genOrderNumber(
                        (newOrder.type as string) || "ord"
                      ),
                      type: (newOrder.type as string) || "quote",
                      clientName: newOrder.clientName || "",
                      clientEmail: newOrder.clientEmail || "",
                      items: (newOrder.items as OrderItem[]) || [],
                      subtotal: Number(newOrder.subtotal) || 0,
                      tax: Number(newOrder.tax) || 0,
                      total: Number(newOrder.total) || 0,
                      status: "draft",
                      dateCreated: new Date().toISOString(),
                      dueDate: (newOrder.dueDate as any) || undefined,
                      notes: newOrder.notes || "",
                    });
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(html);
                      w.document.close();
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={creating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {creating ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-white/50 backdrop-blur-sm border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders by number, client name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-gray-200 focus:border-blue-500"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-white/80 border-gray-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
            value="all"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4" />
            <span>All Orders ({orders.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="quote"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            <span>
              Quotes ({orders.filter((o) => o.type === "quote").length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="sale"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>
              Sales ({orders.filter((o) => o.type === "sale").length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="invoice"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <CreditCard className="h-4 w-4" />
            <span>
              Invoices ({orders.filter((o) => o.type === "invoice").length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`${
                  isOverdue(order)
                    ? "border-red-200 bg-red-50"
                    : "bg-white/80 backdrop-blur-sm"
                } hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      {getOrderTypeIcon(order.type)}
                      <div>
                        <CardTitle className="text-lg">
                          {order.orderNumber}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{order.clientName}</span>
                          <span>•</span>
                          <span>{order.clientEmail}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                      {isOverdue(order) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="font-semibold">
                        {formatCurrency(order.subtotal)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tax</div>
                      <div className="font-semibold">
                        {formatCurrency(order.tax)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Payment</div>
                      <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Items ({order.items.length})
                    </div>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>
                            {item.productName} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Created:{" "}
                        {new Date(order.dateCreated).toLocaleDateString()}
                      </span>
                    </div>
                    {order.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Due: {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {order.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[100px]"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintOrder(order)}
                      className="hidden sm:flex"
                    >
                      <Printer className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadOrder(order)}
                      className="hidden sm:flex"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditOrder({ ...order });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingId === order.id}
                    >
                      {deletingId === order.id ? (
                        "Deleting…"
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                    {order.type === "quote" && order.status === "sent" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  {getOrderTypeIcon(selectedOrder.type)}
                  <div>
                    <div>{selectedOrder.orderNumber}</div>
                    <div className="text-sm text-gray-500 font-normal">
                      {selectedOrder.clientName}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Payment Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Order Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedOrder.status)}
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Created:{" "}
                        {new Date(
                          selectedOrder.dateCreated
                        ).toLocaleDateString()}
                      </div>
                      {selectedOrder.dueDate && (
                        <div className="text-sm text-gray-600">
                          Due:{" "}
                          {new Date(selectedOrder.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div>
                        {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                      {selectedOrder.paymentMethod && (
                        <div className="text-sm text-gray-600">
                          Method: {selectedOrder.paymentMethod}
                        </div>
                      )}
                      {isOverdue(selectedOrder) && (
                        <Badge variant="destructive">Payment Overdue</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-2 text-center">Type</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 grid grid-cols-12 gap-2 border-t"
                      >
                        <div className="col-span-5 font-medium">
                          {item.productName}
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.productType}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-center">
                          {item.quantity}
                        </div>
                        <div className="col-span-2 text-right">
                          ${item.unitPrice}
                        </div>
                        <div className="col-span-2 text-right font-semibold">
                          ${item.totalPrice}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="max-w-sm ml-auto space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedOrder.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium mb-3">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedOrder && handlePrintOrder(selectedOrder)
                    }
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedOrder && handleDownloadOrder(selectedOrder)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedOrder && handleEmailOrder(selectedOrder)
                    }
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  {selectedOrder.type === "quote" &&
                    selectedOrder.status === "sent" && (
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        Convert to Sale
                      </Button>
                    )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update details and items, then save.
            </DialogDescription>
          </DialogHeader>
          {editOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <Select
                  value={editOrder.type}
                  onValueChange={(v) =>
                    setEditOrder({ ...editOrder, type: v as any })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="sale">Sale Order</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Due Date</Label>
                <Input
                  className="col-span-3"
                  type="date"
                  value={editOrder.dueDate || ""}
                  onChange={(e) =>
                    setEditOrder({ ...editOrder, dueDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="mb-1 block">Item</Label>
                    <Input
                      value={editItem.productName || ""}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          productName: e.target.value,
                        })
                      }
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block">Type</Label>
                    <Select
                      value={(editItem.productType as any) || "painting"}
                      onValueChange={(v) =>
                        setEditItem({ ...editItem, productType: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="painting">Painting</SelectItem>
                        <SelectItem value="paint">Paint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Label className="mb-1 block">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={Number(editItem.quantity) || 1}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          quantity: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={Number(editItem.unitPrice) || 0}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          unitPrice: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={addItemToEditOrder}
                      className="mt-6"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-center">Type</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {editOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 grid grid-cols-12 gap-2 border-t items-center"
                    >
                      <div className="col-span-5 font-medium">
                        {item.productName}
                      </div>
                      <div className="col-span-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {item.productType}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right">
                        ${item.unitPrice.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-semibold">
                        ${item.totalPrice.toFixed(2)}
                      </div>
                      <div className="col-span-12 text-right mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromEditOrder(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tax/Fees</Label>
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  value={Number(editOrder.tax) || 0}
                  onChange={(e) => updateEditTax(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Totals</Label>
                <div className="col-span-3 text-sm">
                  <div>
                    Subtotal:{" "}
                    <strong>
                      ${(Number(editOrder.subtotal) || 0).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    Tax/Fees:{" "}
                    <strong>${(Number(editOrder.tax) || 0).toFixed(2)}</strong>
                  </div>
                  <div>
                    Total:{" "}
                    <strong className="text-green-600">
                      ${(Number(editOrder.total) || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Notes</Label>
                <Textarea
                  className="col-span-3"
                  value={editOrder.notes || ""}
                  onChange={(e) =>
                    setEditOrder({ ...editOrder, notes: e.target.value })
                  }
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEditOrder} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
