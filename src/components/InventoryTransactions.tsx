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
import { formatCurrency } from "../utils/currency";
import { toast } from "sonner";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Trash2,
  Filter,
  MoreHorizontal
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

interface InventoryTransaction {
  id: string;
  transactionNumber: string;
  type: "stock_in" | "stock_out" | "adjustment" | "return" | "damaged" | "lost";
  productId: string;
  productName: string;
  productType: "paint" | "painting";
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
  referenceType?: "purchase" | "sale" | "return" | "adjustment";
  referenceId?: string;
  dateCreated: string;
  createdBy: string;
  notes?: string;
  supplierId?: string;
  supplierName?: string;
  clientId?: string;
  clientName?: string;
}

export function InventoryTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; company_name: string }>
  >([]);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; product_type: string }>
  >([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<
    Partial<InventoryTransaction>
  >({});

  useEffect(() => {
    // Load transactions, suppliers, and products from Supabase
    const loadData = async () => {
      try {
        // Load suppliers
        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, company_name")
          .order("company_name");

        if (suppliersData) setSuppliers(suppliersData);

        // Load products (full data for both dropdown and lookup)
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("name");

        if (productsError) throw productsError;

        // Set products for dropdown (simplified data)
        if (productsData) {
          setProducts(
            productsData.map((p) => ({
              id: p.id,
              name: p.name || p.title,
              product_type: p.product_type,
            }))
          );
        }

        // Load inventory transactions
        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from("inventory_transactions")
            .select("*")
            .order("created_at", { ascending: false });

        if (transactionsError) throw transactionsError;

        // Create a product lookup map
        const productLookup =
          productsData?.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
          }, {} as any) || {};

        // Map transaction data to our interface
        const mappedTransactions = transactionsData.map((transaction) => ({
          id: transaction.id,
          transactionNumber: transaction.transaction_number,
          type: transaction.type,
          productId: transaction.product_id,
          productName:
            productLookup[transaction.product_id]?.name ||
            transaction.product_name ||
            "Unknown Product",
          productType:
            productLookup[transaction.product_id]?.product_type || "paint",
          quantity: transaction.quantity,
          unitCost: transaction.unit_cost || 0,
          totalCost: transaction.total_cost || 0,
          reason: transaction.reason || "",
          referenceType: transaction.reference_type || "",
          referenceId: transaction.reference_id || "",
          dateCreated: transaction.created_at
            ? new Date(transaction.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          createdBy: transaction.created_by || "System",
          notes: transaction.notes || "",
          supplierId: transaction.supplier_id || "",
          supplierName: transaction.supplier_name || "",
          clientId: transaction.client_id || "",
          clientName: transaction.client_name || "",
        }));

        setTransactions(mappedTransactions);
      } catch (error) {
        console.error("Error loading inventory transactions:", error);
        toast.error("Failed to load inventory transactions");
        setTransactions([]);
      }
    };

    loadData();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.transactionNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (transaction.productName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (transaction.reason?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
    const matchesType =
      selectedType === "all" || transaction.type === selectedType;

    let matchesDate = true;
    if (selectedDateRange !== "all") {
      const transactionDate = new Date(transaction.dateCreated);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (selectedDateRange) {
        case "7":
          matchesDate = daysDiff <= 7;
          break;
        case "30":
          matchesDate = daysDiff <= 30;
          break;
        case "90":
          matchesDate = daysDiff <= 90;
          break;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const handleAddTransaction = async () => {
    if (
      newTransaction.productName &&
      newTransaction.quantity &&
      newTransaction.type
    ) {
      // Create a new transaction
      const transactionData = {
        transaction_number: `TXN-${new Date().getFullYear()}-${String(
          transactions.length + 1
        ).padStart(3, "0")}`,
        type: newTransaction.type,
        product_id: newTransaction.productId || null,
        product_name: newTransaction.productName,
        product_type: newTransaction.productType || "paint",
        quantity: newTransaction.quantity,
        unit_cost: newTransaction.unitCost || 0,
        total_cost:
          newTransaction.unitCost && newTransaction.quantity
            ? newTransaction.unitCost * Math.abs(newTransaction.quantity)
            : 0,
        reason: newTransaction.reason || "",
        reference_type: newTransaction.referenceType || null,
        reference_id: newTransaction.referenceId || null,
        notes: newTransaction.notes || "",
        supplier_id: newTransaction.supplierId || null,
        supplier_name: newTransaction.supplierName || "",
        client_id: newTransaction.clientId || null,
        client_name: newTransaction.clientName || "",
        created_by: user?.name || user?.email || "System",
        created_at: new Date().toISOString(),
      };

      try {
        // Insert the transaction into Supabase
        const { data, error } = await supabase
          .from("inventory_transactions")
          .insert([transactionData])
          .select()
          .single();

        if (error) throw error;

        // Create the transaction object for the UI
        const transaction: InventoryTransaction = {
          id: data.id,
          transactionNumber: transactionData.transaction_number,
          type: transactionData.type as any,
          productId: transactionData.product_id || "",
          productName: transactionData.product_name,
          productType: transactionData.product_type as any,
          quantity: transactionData.quantity,
          unitCost: transactionData.unit_cost,
          totalCost: transactionData.total_cost,
          reason: transactionData.reason,
          referenceType: transactionData.reference_type || undefined,
          referenceId: transactionData.reference_id || undefined,
          dateCreated: new Date(transactionData.created_at)
            .toISOString()
            .split("T")[0],
          createdBy: transactionData.created_by,
          notes: transactionData.notes,
          supplierId: transactionData.supplier_id || undefined,
          supplierName: transactionData.supplier_name || undefined,
          clientId: transactionData.client_id || undefined,
          clientName: transactionData.client_name || undefined,
        };

        // If this transaction affects a product's stock, update the product stock level
        if (newTransaction.productId) {
          await updateProductStockLevel(
            newTransaction.productId,
            newTransaction.type,
            newTransaction.quantity
          );
        }

        // Optimistically update the UI
        setTransactions([transaction, ...transactions]);
        setNewTransaction({});
        setIsAddDialogOpen(false);
        toast.success("Transaction added successfully");
      } catch (error) {
        console.error("Error adding transaction:", error);
        // Fallback to local state only if there's an error
        const transaction: InventoryTransaction = {
          id: Date.now().toString(),
          transactionNumber: `TXN-${new Date().getFullYear()}-${String(
            transactions.length + 1
          ).padStart(3, "0")}`,
          type: newTransaction.type as any,
          productId: newTransaction.productId || "",
          productName: newTransaction.productName,
          productType: (newTransaction.productType as any) || "paint",
          quantity: newTransaction.quantity,
          unitCost: newTransaction.unitCost,
          totalCost:
            newTransaction.unitCost && newTransaction.quantity
              ? newTransaction.unitCost * Math.abs(newTransaction.quantity)
              : undefined,
          reason: newTransaction.reason || "",
          dateCreated: new Date().toISOString().split("T")[0],
          createdBy: user?.name || user?.email || "System",
          notes: newTransaction.notes,
        };
        setTransactions([transaction, ...transactions]);
        setNewTransaction({});
        setIsAddDialogOpen(false);
        toast.success("Transaction added (offline mode)");
      }
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      // First, get the transaction to reverse its effect on stock
      const { data: transactionData, error: fetchError } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the transaction from Supabase
      const { error: deleteError } = await supabase
        .from("inventory_transactions")
        .delete()
        .eq("id", transactionId);

      if (deleteError) throw deleteError;

      // If the transaction affected a product's stock, we should reverse that effect
      if (transactionData.product_id) {
        // Get current product stock level
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("stock_level")
          .eq("id", transactionData.product_id)
          .single();

        if (!productError && productData) {
          // Reverse the transaction effect
          // For stock_in transactions, we subtract from stock
          // For stock_out transactions, we add to stock
          let stockChange = 0;
          if (transactionData.type === "stock_in") {
            stockChange = -transactionData.quantity;
          } else if (
            ["stock_out", "damaged", "lost", "return"].includes(
              transactionData.type
            )
          ) {
            stockChange = Math.abs(transactionData.quantity);
          }

          // Update product stock level
          if (stockChange !== 0) {
            const newStockLevel = Math.max(
              0,
              (productData.stock_level || 0) + stockChange
            );
            await supabase
              .from("products")
              .update({ stock_level: newStockLevel })
              .eq("id", transactionData.product_id);
          }
        }
      }

      // Update the local state
      setTransactions(transactions.filter((t) => t.id !== transactionId));
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const updateProductStockLevel = async (
    productId: string,
    transactionType: string,
    quantity: number
  ) => {
    try {
      // Get current product stock level
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("stock_level")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Calculate stock change based on transaction type
      let stockChange = 0;
      if (transactionType === "stock_in") {
        stockChange = Math.abs(quantity);
      } else if (
        ["stock_out", "damaged", "lost", "return"].includes(transactionType)
      ) {
        stockChange = -Math.abs(quantity);
      }

      // Update product stock level
      if (stockChange !== 0) {
        const newStockLevel = Math.max(
          0,
          (productData.stock_level || 0) + stockChange
        );
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_level: newStockLevel })
          .eq("id", productId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error updating product stock level:", error);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "stock_in":
        return <ArrowUp className="h-4 w-4 text-emerald-600" />;
      case "stock_out":
        return <ArrowDown className="h-4 w-4 text-blue-600" />;
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case "return":
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      case "damaged":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "lost":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const configs = {
      stock_in: {
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        label: "Stock In",
      },
      stock_out: {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        label: "Stock Out",
      },
      adjustment: {
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        label: "Adjustment",
      },
      return: {
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        label: "Return",
      },
      damaged: {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        label: "Damaged",
      },
      lost: {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        label: "Lost",
      },
    };

    const config = configs[type as keyof typeof configs] || {
      className: "",
      label: type,
    };
    return (
      <Badge variant="outline" className={cn("border", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getQuantityDisplay = (transaction: InventoryTransaction) => {
    const isPositive = ["stock_in", "return"].includes(transaction.type);
    const quantity = Math.abs(transaction.quantity);
    const sign = isPositive ? "+" : "-";
    const colorClass = isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";

    return (
      <span className={`font-bold ${colorClass}`}>
        {sign}
        {quantity}
      </span>
    );
  };

  // Calculate summary stats
  const totalStockIn = filteredTransactions
    .filter((t) => ["stock_in", "return"].includes(t.type))
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  const totalStockOut = filteredTransactions
    .filter((t) => ["stock_out", "damaged", "lost"].includes(t.type))
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Inventory Transactions
          </h2>
          <p className="text-muted-foreground">
            Track all inventory movements and adjustments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md glass-panel border-white/20">
            <DialogHeader>
              <DialogTitle>Add Inventory Transaction</DialogTitle>
              <DialogDescription>
                Record a new inventory movement or adjustment.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, type: value as any })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">Stock In</SelectItem>
                    <SelectItem value="stock_out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product" className="text-right">
                  Product
                </Label>
                <Select
                  value={newTransaction.productId}
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    setNewTransaction({
                      ...newTransaction,
                      productId: value,
                      productName: product?.name || "",
                      productType: (product?.product_type as any) || "paint",
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.product_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productName" className="text-right">
                  Or Manual
                </Label>
                <Input
                  id="productName"
                  value={newTransaction.productName || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      productName: e.target.value,
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="productType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newTransaction.productType}
                  onValueChange={(value) =>
                    setNewTransaction({
                      ...newTransaction,
                      productType: value as any,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3 glass-input">
                    <SelectValue placeholder="Product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paint">Paint/Supply</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newTransaction.quantity || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Quantity (positive number)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unitCost" className="text-right">
                  Unit Cost
                </Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={newTransaction.unitCost || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      unitCost: parseFloat(e.target.value),
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Optional"
                />
              </div>
              {newTransaction.type === "stock_in" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier" className="text-right">
                    Supplier
                  </Label>
                  <Select
                    value={newTransaction.supplierId}
                    onValueChange={(value) => {
                      const supplier = suppliers.find((s) => s.id === value);
                      setNewTransaction({
                        ...newTransaction,
                        supplierId: value,
                        supplierName: supplier?.company_name || "",
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
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  Reason
                </Label>
                <Input
                  id="reason"
                  value={newTransaction.reason || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      reason: e.target.value,
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Reason for transaction"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionNotes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="transactionNotes"
                  value={newTransaction.notes || ""}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      notes: e.target.value,
                    })
                  }
                  className="col-span-3 glass-input"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTransaction} className="bg-primary text-white">Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24 text-emerald-600 transform rotate-12" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Stock In</h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              +{totalStockIn}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Units received</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="h-24 w-24 text-blue-600 transform -rotate-12" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Stock Out</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              -{totalStockOut}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Units removed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl animate-enter" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="stock_in">Stock In</SelectItem>
              <SelectItem value="stock_out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-full sm:w-48 glass-input border-0 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4 animate-enter" style={{ animationDelay: '300ms' }}>
        {filteredTransactions.map((transaction, index) => (
          <div
            key={transaction.id}
            className="glass-card p-4 rounded-xl hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer animate-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              {getTransactionTypeIcon(transaction.type)}
            </div>

            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
              <div className="sm:col-span-1">
                <div className="font-medium text-foreground truncate">{transaction.productName}</div>
                <div className="text-xs text-muted-foreground">{transaction.transactionNumber}</div>
              </div>

              <div className="sm:col-span-1 flex items-center">
                {getTransactionTypeBadge(transaction.type)}
              </div>

              <div className="sm:col-span-1 flex flex-col justify-center">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(transaction.dateCreated).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {transaction.reason || "No reason provided"}
                </div>
              </div>

              <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <div className="text-lg">{getQuantityDisplay(transaction)}</div>
                  {transaction.unitCost && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(transaction.unitCost)} / unit
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="glass-card p-12 text-center rounded-xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No transactions found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Try adjusting your filters or add a new transaction to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
