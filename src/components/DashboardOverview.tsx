import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowUpRight,
  Activity,
  DollarSign,
  Zap,
  Palette,
  Brush,
  Eye,
  BarChart3
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { cn } from "../lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { canAccess } from "../lib/permissions";
import { AccessDenied } from "./ui/AccessDenied";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

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

// Mock data for the chart - in a real app this would come from the database
const chartData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 2000 },
  { name: "Apr", revenue: 2780 },
  { name: "May", revenue: 1890 },
  { name: "Jun", revenue: 2390 },
  { name: "Jul", revenue: 3490 },
];

export function DashboardOverview() {
  const { user } = useAuth();
  const location = useLocation();
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

  if (!canAccess(user?.role, location.pathname)) {
    return <AccessDenied />;
  }

  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
        try {
          setLoading(true);
    
          const [
            productsCount,
            clientsCount,
            ordersCount,
            paintingsCount,
            paintsCount,
            allProducts,
            ordersData,
            recentTransactions,
          ] = await Promise.all([
            supabase.from("products").select("*", { count: "exact", head: true }),
            supabase.from("clients").select("*", { count: "exact", head: true }),
            supabase.from("orders").select("*", { count: "exact", head: true }),
            supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("product_type", "painting"),
            supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("product_type", "paint"),
            supabase.from("products").select("id, stock_level, min_stock_level"),
            supabase
              .from("orders")
              .select("total")
              .gte(
                "created_at",
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ).toISOString()
              ),
            supabase
              .from("inventory_transactions")
              .select("*, product:products(name, product_type)")
              .order("created_at", { ascending: false })
              .limit(5),
          ]);
    
          const lowStockItems =
            allProducts.data?.filter(
              (item) => item.stock_level < item.min_stock_level
            ) || [];
    
          const monthlyRevenue =
            ordersData.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    
          const recentActivity = (recentTransactions.data || []).map(
            (transaction) => {
              let message = "";
              let type: "sale" | "restock" | "new_client" | "low_stock" = "restock";
    
              switch (transaction.type) {
                case "stock_in":
                  message = `Stocked in ${transaction.quantity} units of ${transaction.product?.name}`;
                  type = "restock";
                  break;
                case "stock_out":
                  message = `Sold ${transaction.quantity} units of ${transaction.product?.name}`;
                  type = "sale";
                  break;
                case "damaged":
                  message = `${transaction.quantity} units of ${transaction.product?.name} marked damaged`;
                  type = "low_stock";
                  break;
                default:
                  message = `${transaction.type} for ${transaction.product?.name}`;
              }
    
              // Calculate time ago
              const diffMs =
                new Date().getTime() - new Date(transaction.created_at).getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const timestamp =
                diffHours > 24
                  ? `${Math.floor(diffHours / 24)} days ago`
                  : `${diffHours} hours ago`;
    
              return { id: transaction.id, type, message, timestamp };
            }
          );
    
          setStats({
            totalProducts: productsCount.count || 0,
            totalClients: clientsCount.count || 0,
            pendingOrders: ordersCount.count || 0,
            monthlyRevenue,
            lowStockItems: lowStockItems.length,
            paintingsAvailable: paintingsCount.count || 0,
            paintsInStock: paintsCount.count || 0,
            recentActivity,
          });
        } catch (error) {
          console.error("Error loading dashboard:", error);
        } finally {
          setLoading(false);
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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-4xl font-display tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground text-base">Overview of your business performance</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadDashboardData}
            className="bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 gap-2 transition-all duration-300"
          >
            <Activity className="h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          trend="+12.5% from last month"
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-500"
          delay={0}
        />
        <MetricCard
          title="Active Clients"
          value={stats.totalClients.toString()}
          trend="+4 new this week"
          icon={Users}
          gradient="from-blue-500 to-indigo-500"
          delay={100}
        />
        <MetricCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          trend="Requires attention"
          icon={ShoppingCart}
          gradient="from-violet-500 to-purple-500"
          delay={200}
        />
        <MetricCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          trend="Restock needed"
          icon={AlertTriangle}
          gradient="from-orange-500 to-red-500"
          delay={300}
          alert={stats.lowStockItems > 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-7">

        {/* Left Column - Charts & Inventory (4 cols) */}
        <div className="md:col-span-4 space-y-6 animate-enter" style={{ animationDelay: '400ms' }}>

          {/* Revenue Chart */}
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer group transition-all hover:-translate-y-1">
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm">Add Product</span>
            </div>
            <div className="glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer group transition-all hover:-translate-y-1">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <span className="font-medium text-sm">Add Client</span>
            </div>
          </div>
        </div>

        {/* Right Column - Inventory & Activity (3 cols) */}
        <div className="md:col-span-3 space-y-6 animate-enter" style={{ animationDelay: '500ms' }}>

          {/* Inventory Status */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Inventory Status</h3>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-6">
              {/* Paintings */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Paintings
                  </span>
                  <span className="font-medium">{stats.paintingsAvailable} Available</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              {/* Paints */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Brush className="h-4 w-4" /> Paint Supplies
                  </span>
                  <span className="font-medium">{stats.paintsInStock} Units</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card h-full p-6 rounded-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Recent Activity</h3>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-6 flex-1">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, i) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {i !== stats.recentActivity.length - 1 && (
                      <div className="absolute left-2.5 top-8 bottom-[-24px] w-px bg-border" />
                    )}
                    <div className={`
                      mt-1 h-5 w-5 rounded-full border-2 flex-shrink-0 z-10 bg-background
                      ${activity.type === 'sale' ? 'border-green-500' :
                        activity.type === 'low_stock' ? 'border-red-500' : 'border-blue-500'}
                    `} />
                    <div>
                      <p className="text-sm font-medium leading-none">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">No recent activity</div>
              )}
            </div>

            <button className="w-full mt-6 py-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-2">
              View All Activity <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, gradient, delay, alert }: any) {
  return (
    <div
      className={cn(
        "glass-card p-6 rounded-2xl relative overflow-hidden group animate-enter hover:-translate-y-1 transition-all duration-300",
        alert && "border-red-500/50 shadow-red-500/20"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all duration-300 bg-gradient-to-br ${gradient} rounded-bl-3xl group-hover:scale-110`}>
        <Icon className="h-14 w-14 text-white drop-shadow-lg" />
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="text-3xl font-bold tracking-tight font-display">{value}</div>
        <div className={cn(
          "text-sm font-medium flex items-center gap-1.5",
          alert ? "text-red-500" : "text-emerald-600 dark:text-emerald-500"
        )}>
          {alert ? <AlertTriangle className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          {trend}
        </div>
      </div>
    </div>
  );
}
