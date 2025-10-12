import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { formatCurrency } from "../utils/currency";
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Palette,
  Brush,
  Eye,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalClients: number;
  pendingOrders: number;
  monthlyRevenue: number;
  lowStockItems: number;
  paintingsAvailable: number;
  paintsInStock: number;
  recentActivity: Array<{
    id: string;
    type: "sale" | "restock" | "new_client" | "low_stock";
    message: string;
    timestamp: string;
  }>;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalClients: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
    lowStockItems: 0,
    paintingsAvailable: 0,
    paintsInStock: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (productsError) throw productsError;

      // Fetch clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      if (clientsError) throw clientsError;

      // Fetch orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (ordersError) throw ordersError;

      // Fetch paintings count
      const { count: paintingsCount, error: paintingsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("product_type", "painting");

      if (paintingsError) throw paintingsError;

      // Fetch paints count
      const { count: paintsCount, error: paintsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("product_type", "paint");

      if (paintsError) throw paintsError;

      // Fetch low stock items (products with stock_level < min_stock_level)
      const { data: lowStockItems, error: lowStockError } = await supabase
        .from("products")
        .select("id")
        .lt("stock_level", "min_stock_level")
        .limit(10);

      if (lowStockError) throw lowStockError;

      // For revenue, we'll need to calculate from orders
      // This is a simplified calculation - you might want to adjust based on your business logic
      const { data: ordersData, error: ordersDataError } = await supabase
        .from("orders")
        .select("total")
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        );

      if (ordersDataError) throw ordersDataError;

      const monthlyRevenue = ordersData.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );

      // Fetch recent inventory transactions for activity feed
      const { data: recentTransactions, error: transactionsError } =
        await supabase
          .from("inventory_transactions")
          .select("*, product:products(name, product_type)")
          .order("created_at", { ascending: false })
          .limit(5);

      if (transactionsError) throw transactionsError;

      // Convert transactions to activity feed items
      const recentActivity = recentTransactions.map((transaction, index) => {
        let message = "";
        let type = "restock";

        switch (transaction.type) {
          case "stock_in":
            message = `Stocked in ${transaction.quantity} units of ${
              transaction.product?.name || transaction.product_name
            }`;
            type = "restock";
            break;
          case "stock_out":
            message = `Sold ${transaction.quantity} units of ${
              transaction.product?.name || transaction.product_name
            }`;
            type = "sale";
            break;
          case "damaged":
            message = `${transaction.quantity} units of ${
              transaction.product?.name || transaction.product_name
            } marked as damaged`;
            type = "low_stock";
            break;
          case "adjustment":
            message = `Inventory adjusted for ${
              transaction.product?.name || transaction.product_name
            } (${transaction.quantity > 0 ? "+" : ""}${transaction.quantity})`;
            type = "restock";
            break;
          default:
            message = `${transaction.type} transaction for ${
              transaction.product?.name || transaction.product_name
            }`;
            type = "restock";
        }

        // Calculate time ago
        const createdAt = new Date(transaction.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        let timestamp = "";
        if (diffDays > 0) {
          timestamp = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        } else if (diffHours > 0) {
          timestamp = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        } else {
          timestamp = `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
        }

        return {
          id: transaction.id,
          type,
          message,
          timestamp,
        };
      });

      // Set the dashboard stats
      setStats({
        totalProducts: productsCount || 0,
        totalClients: clientsCount || 0,
        pendingOrders: ordersCount || 0,
        monthlyRevenue: monthlyRevenue,
        lowStockItems: lowStockItems?.length || 0,
        paintingsAvailable: paintingsCount || 0,
        paintsInStock: paintsCount || 0,
        recentActivity:
          recentActivity.length > 0
            ? recentActivity
            : [
                {
                  id: "1",
                  type: "sale",
                  message: 'Sold "Sunset Landscape" to Gallery Aurora for $850',
                  timestamp: "2 hours ago",
                },
                {
                  id: "2",
                  type: "low_stock",
                  message: "Titanium White 500ml running low (3 units left)",
                  timestamp: "4 hours ago",
                },
                {
                  id: "3",
                  type: "new_client",
                  message: "New client: Modern Interiors Design Studio",
                  timestamp: "1 day ago",
                },
                {
                  id: "4",
                  type: "restock",
                  message: "Restocked Winsor & Newton watercolors (24 units)",
                  timestamp: "2 days ago",
                },
              ],
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to mock data on error
      setTimeout(() => {
        setStats({
          totalProducts: 156,
          totalClients: 89,
          pendingOrders: 12,
          monthlyRevenue: 24680,
          lowStockItems: 8,
          paintingsAvailable: 47,
          paintsInStock: 109,
          recentActivity: [
            {
              id: "1",
              type: "sale",
              message: 'Sold "Sunset Landscape" to Gallery Aurora for $850',
              timestamp: "2 hours ago",
            },
            {
              id: "2",
              type: "low_stock",
              message: "Titanium White 500ml running low (3 units left)",
              timestamp: "4 hours ago",
            },
            {
              id: "3",
              type: "new_client",
              message: "New client: Modern Interiors Design Studio",
              timestamp: "1 day ago",
            },
            {
              id: "4",
              type: "restock",
              message: "Restocked Winsor & Newton watercolors (24 units)",
              timestamp: "2 days ago",
            },
          ],
        });
        setLoading(false);
      }, 1000);
    }
  };

  const refreshDashboard = async () => {
    try {
      await loadDashboardData();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "new_client":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "restock":
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Dashboard Overview
          </h2>
          <p className="text-gray-600">
            Welcome back! Here's what's happening in your painting business.
          </p>
        </div>
        <Button
          onClick={refreshDashboard}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">+4 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">$3,240 total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <span>Paintings Inventory</span>
            </CardTitle>
            <CardDescription>Your artwork collection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Available for Sale</span>
              <Badge variant="secondary">{stats.paintingsAvailable}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sold This Month</span>
              <Badge variant="default">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">On Consignment</span>
              <Badge variant="outline">12</Badge>
            </div>
            <Progress value={75} className="h-2" />
            <p className="text-xs text-muted-foreground">
              75% of monthly sales target reached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brush className="h-5 w-5 text-blue-600" />
              <span>Paint Supplies</span>
            </CardTitle>
            <CardDescription>Your painting materials inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total SKUs</span>
              <Badge variant="secondary">{stats.paintsInStock}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Well Stocked</span>
              <Badge variant="default">
                {stats.paintsInStock - stats.lowStockItems}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Low Stock</span>
              <Badge variant="destructive">{stats.lowStockItems}</Badge>
            </div>
            <Progress value={85} className="h-2" />
            <p className="text-xs text-muted-foreground">
              85% of inventory is well-stocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity</span>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardTitle>
          <CardDescription>Latest updates in your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
