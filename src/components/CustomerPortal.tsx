import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Download,
  FileText,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export function CustomerPortal() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  // Mock invoice data - in real implementation, this would come from the database
  useEffect(() => {
    // Simulate loading invoices for the current user
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        invoiceNumber: "INV-2024-001",
        date: "2024-01-15",
        dueDate: "2024-02-15",
        amount: 245.99,
        status: "paid",
        items: [
          {
            description: "Acrylic Paint Set - Primary Colors",
            quantity: 2,
            price: 89.99,
            total: 179.98,
          },
          {
            description: "Canvas Panel 16x20 inch",
            quantity: 3,
            price: 22.0,
            total: 66.01,
          },
        ],
      },
      {
        id: "2",
        invoiceNumber: "INV-2024-002",
        date: "2024-02-10",
        dueDate: "2024-03-10",
        amount: 125.5,
        status: "pending",
        items: [
          {
            description: "Oil Painting Brushes Set",
            quantity: 1,
            price: 75.5,
            total: 75.5,
          },
          {
            description: "Palette Knife Set",
            quantity: 1,
            price: 50.0,
            total: 50.0,
          },
        ],
      },
      {
        id: "3",
        invoiceNumber: "INV-2024-003",
        date: "2024-03-05",
        dueDate: "2024-03-20",
        amount: 89.99,
        status: "overdue",
        items: [
          {
            description: "Watercolor Paper - Premium Grade",
            quantity: 1,
            price: 89.99,
            total: 89.99,
          },
        ],
      },
    ];

    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.invoiceNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      invoice.items.some((item) =>
        (item.description?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        )
      )
  );

  const getStatusConfig = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return {
          color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
          icon: CheckCircle2
        };
      case "pending":
        return {
          color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
          icon: Clock
        };
      case "overdue":
        return {
          color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
          icon: AlertCircle
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
          icon: FileText
        };
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    setGeneratingPDF(invoice.id);

    try {
      // Simulate PDF generation - in real implementation, this would call the server
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a simple PDF-like content
      const pdfContent = `
        PAINTCRAFT CRM - INVOICE
        
        Invoice Number: ${invoice.invoiceNumber}
        Date: ${new Date(invoice.date).toLocaleDateString()}
        Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
        
        Bill To:
        ${user?.name}
        ${user?.email}
        
        Items:
        ${invoice.items
          .map(
            (item) =>
              `${item.description} - Qty: ${item.quantity
              } - Price: $${item.price.toFixed(
                2
              )} - Total: $${item.total.toFixed(2)}`
          )
          .join("\n")}
        
        Total Amount: $${invoice.amount.toFixed(2)}
        Status: ${invoice.status.toUpperCase()}
        
        Thank you for your business!
      `;

      // Create and download the file
      const blob = new Blob([pdfContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate invoice. Please try again.");
      console.error("PDF generation error:", error);
    } finally {
      setGeneratingPDF(null);
    }
  };

  const totalOwed = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">My Invoices & Receipts</h2>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            My Invoices & Receipts
          </h2>
          <p className="text-muted-foreground">
            Welcome, {user?.name}! Manage and download your invoices.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3 animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="h-24 w-24 text-blue-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Invoices</h3>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-24 w-24 text-red-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Amount Owed</h3>
            <div className="p-2 bg-red-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">${totalOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="h-24 w-24 text-emerald-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Paid This Year</h3>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <Calendar className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">
              $
              {invoices
                .filter((inv) => inv.status === "paid")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-6 rounded-xl animate-enter" style={{ animationDelay: '200ms' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number or item description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-input"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4 animate-enter" style={{ animationDelay: '300ms' }}>
        {filteredInvoices.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No invoices found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm
                ? "Try adjusting your search terms."
                : "You don't have any invoices yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={invoice.id}
                  className="glass-card p-6 rounded-xl transition-all duration-300 hover:shadow-md border-l-4 cursor-pointer"
                  style={{ borderLeftColor: invoice.status === 'overdue' ? '#ef4444' : invoice.status === 'paid' ? '#10b981' : '#f59e0b' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-foreground">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant="outline" className={cn("font-normal flex items-center gap-1.5", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Issued: {new Date(invoice.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-foreground">
                        ${invoice.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Amount</div>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Items</Label>
                    <div className="space-y-3">
                      {invoice.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm group"
                        >
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-medium text-foreground w-20 text-right">
                              ${item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button
                      onClick={() => generatePDF(invoice)}
                      disabled={generatingPDF === invoice.id}
                      className="glass-button group"
                    >
                      {generatingPDF === invoice.id ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                          Download Invoice
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
