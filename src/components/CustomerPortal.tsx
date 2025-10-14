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
import { Download, FileText, Search, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

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

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
              `${item.description} - Qty: ${
                item.quantity
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2>My Invoices & Receipts</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>My Invoices & Receipts</h2>
          <p className="text-muted-foreground">
            Welcome, {user?.name}! Download your invoices and receipts below.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Owed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOwed.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid This Year
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {invoices
                .filter((inv) => inv.status === "paid")
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No invoices found matching your search."
                  : "No invoices found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <CardDescription>
                      Issued: {new Date(invoice.date).toLocaleDateString()} •
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold">
                      ${invoice.amount.toFixed(2)}
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Items */}
                <div>
                  <Label className="text-sm font-medium">Items:</Label>
                  <div className="mt-2 space-y-2">
                    {invoice.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="flex-1">{item.description}</span>
                        <span className="text-muted-foreground mx-2">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-medium">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => generatePDF(invoice)}
                    disabled={generatingPDF === invoice.id}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {generatingPDF === invoice.id
                        ? "Generating..."
                        : "Download Invoice"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
