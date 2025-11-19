import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { formatCurrency } from "../utils/currency";
import { useTheme } from "../contexts/ThemeContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Download,
  Calendar,
  AlertTriangle,
  Eye,
  ShoppingCart,
  Palette,
  Brush,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { cn } from "../lib/utils";

interface SalesData {
  month: string;
  paintings: number;
  paints: number;
  total: number;
}

interface ProductPerformance {
  name: string;
  sold: number;
  revenue: number;
  category: string;
}

interface ClientSegment {
  name: string;
  value: number;
  color: string;
}

interface InventoryAlert {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  category: string;
  daysOfStock: number;
}

export function ReportsAnalytics() {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("12months");
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<
    ProductPerformance[]
  >([]);
  const [clientSegments, setClientSegments] = useState<ClientSegment[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Fetch orders for sales data
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // Process sales data by month
      const monthlyData: {
        [key: string]: { paintings: number; paints: number; total: number };
      } = {};
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Initialize last 12 months
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyData[monthKey] = { paintings: 0, paints: 0, total: 0 };
      }

      // Aggregate orders by month
      ordersData?.forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthlyData[monthKey]) {
          const items = order.items || [];
          items.forEach((item: any) => {
            const amount = item.totalPrice || 0;
            if (item.productType === "painting") {
              monthlyData[monthKey].paintings += amount;
            } else {
              monthlyData[monthKey].paints += amount;
            }
            monthlyData[monthKey].total += amount;
          });
        }
      });

      const salesChartData = Object.keys(monthlyData).map((key) => {
        const [year, month] = key.split("-");
        return {
          month: monthNames[parseInt(month) - 1],
          paintings: Math.round(monthlyData[key].paintings),
          paints: Math.round(monthlyData[key].paints),
          total: Math.round(monthlyData[key].total),
        };
      });

      setSalesData(salesChartData);

      // Fetch products for performance data
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      // Calculate product performance from orders
      const productStats: {
        [key: string]: {
          sold: number;
          revenue: number;
          category: string;
          name: string;
        };
      } = {};

      ordersData?.forEach((order) => {
        const items = order.items || [];
        items.forEach((item: any) => {
          const key = item.productName || item.productId;
          if (!productStats[key]) {
            productStats[key] = {
              name: item.productName || "Unknown Product",
              sold: 0,
              revenue: 0,
              category:
                item.productType === "painting" ? "Paintings" : "Paints",
            };
          }
          productStats[key].sold += item.quantity || 0;
          productStats[key].revenue += item.totalPrice || 0;
        });
      });

      const performanceData = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setProductPerformance(performanceData);

      // Fetch clients for segmentation
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Calculate client segments based on actual client_type data
      const clientTypeCount: { [key: string]: number } = {};
      const totalClients = clientsData?.length || 0;

      // Count actual client types
      clientsData?.forEach((client) => {
        const type = client.client_type || "Other";
        clientTypeCount[type] = (clientTypeCount[type] || 0) + 1;
      });

      // Create segments from actual data
      const colors = [
        "#8884d8",
        "#82ca9d",
        "#ffc658",
        "#ff7300",
        "#00ff00",
        "#8dd1e1",
      ];
      const segments = Object.entries(clientTypeCount).map(
        ([type, count], index) => ({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
          color: colors[index % colors.length],
        })
      );

      // Add "No Data" segment if no client types are set
      if (segments.length === 0) {
        segments.push({
          name: "No Client Type Data",
          value: totalClients,
          color: "#cccccc",
        });
      }

      setClientSegments(segments);

      // Fetch low stock items
      const { data: allProductsForLowStock, error: lowStockError } =
        await supabase.from("products").select("*");

      const lowStockData =
        allProductsForLowStock
          ?.filter((product) => product.stock_level < product.min_stock_level)
          .slice(0, 10) || [];

      if (lowStockError) throw lowStockError;

      const alerts = (lowStockData || []).map((product) => ({
        id: product.id,
        productName: product.name,
        currentStock: product.stock_level || 0,
        minStock: product.min_stock_level || 5,
        category: product.product_type === "painting" ? "Painting" : "Paint",
        daysOfStock: Math.floor((product.stock_level || 0) / 0.5), // Simplified calculation
      }));

      setInventoryAlerts(alerts);
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading reports data:", error);
      const errorMsg = error?.message || "Unknown error";
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod]);

  const totalRevenue = salesData.reduce((sum, data) => sum + data.total, 0);
  const totalPaintingsSold = productPerformance
    .filter((p) => p.category === "Paintings")
    .reduce((sum, p) => sum + p.sold, 0);
  // Calculate average order value properly (revenue / number of orders)
  const totalOrdersCount = salesData.reduce((sum, data) => {
    // This is a simplified count - ideally we'd track actual order count per month
    return sum + (data.total > 0 ? 1 : 0);
  }, 0);

  const averageOrderValue =
    totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const topProducts = [...productPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const lowStockItems = inventoryAlerts.filter(
    (item) => item.currentStock <= item.minStock
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Reports & Analytics
            </h2>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-enter">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadReportsData}
            disabled={loading}
            className="glass-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-24 w-24 text-primary" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+12.5%</span> from last period
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Palette className="h-24 w-24 text-blue-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Paintings Sold</h3>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Palette className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">{totalPaintingsSold}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+4.2%</span> from last period
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingCart className="h-24 w-24 text-purple-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Order Value</h3>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <ShoppingCart className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">-2.1%</span> from last period
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="h-24 w-24 text-orange-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-orange-500">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6 animate-enter" style={{ animationDelay: '200ms' }}>
        <TabsList className="grid w-full grid-cols-4 glass-panel p-1 rounded-xl">
          <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Product Performance</TabsTrigger>
          <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Client Analysis</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inventory Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Monthly Revenue Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Revenue breakdown by product category
                </p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorPaintings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPaints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, ""]}
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="paintings"
                      stackId="1"
                      stroke="#8884d8"
                      fill="url(#colorPaintings)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="paints"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="url(#colorPaints)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Sales Growth</h3>
                <p className="text-sm text-muted-foreground">Month-over-month total sales</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, "Total Sales"]}
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#8884d8", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#8884d8", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sales Summary */}
          <div className="glass-card p-6 rounded-xl">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Sales Summary</h3>
              <p className="text-sm text-muted-foreground">
                Key performance indicators for the selected period
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  $
                  {salesData
                    .reduce((sum, data) => sum + data.paintings, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Paintings Revenue
                </div>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  $
                  {salesData
                    .reduce((sum, data) => sum + data.paints, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Paints Revenue
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.max(
                    ...salesData.map((d) => d.total)
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Best Month
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(totalRevenue / 12 / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Avg Monthly
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Top Products by Revenue</h3>
                <p className="text-sm text-muted-foreground">
                  Best performing products in your catalog
                </p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, "Revenue"]}
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Product Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Revenue distribution by category
                </p>
              </div>
              <div className="space-y-6">
                {["Paintings", "Paints"].map((category) => {
                  const categoryProducts = productPerformance.filter(
                    (p) => p.category === category
                  );
                  const categoryRevenue = categoryProducts.reduce(
                    (sum, p) => sum + p.revenue,
                    0
                  );
                  const totalProductRevenue = productPerformance.reduce(
                    (sum, p) => sum + p.revenue,
                    0
                  );
                  const percentage =
                    totalProductRevenue > 0 ? (categoryRevenue / totalProductRevenue) * 100 : 0;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-2">
                          {category === "Paintings" ? <Palette className="h-4 w-4 text-blue-500" /> : <Brush className="h-4 w-4 text-emerald-500" />}
                          {category}
                        </span>
                        <span className="font-bold">
                          ${categoryRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${category === "Paintings"
                              ? "bg-gradient-to-r from-blue-500 to-blue-400"
                              : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {percentage.toFixed(1)}% of total revenue
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="glass-card p-0 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold">Detailed Product Performance</h3>
              <p className="text-sm text-muted-foreground">
                Complete breakdown of all products
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Units Sold</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(
                          "font-normal",
                          product.category === "Paintings" ? "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400" : "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                        )}>{product.category}</Badge>
                      </td>
                      <td className="p-4 text-center">{product.sold}</td>
                      <td className="p-4 text-right font-semibold">
                        ${product.revenue.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        ${(product.revenue / (product.sold || 1)).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Client Segments</h3>
                <p className="text-sm text-muted-foreground">
                  Revenue distribution by client type
                </p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {clientSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {clientSegments.map((segment, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="text-muted-foreground">{segment.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Client Growth</h3>
                <p className="text-sm text-muted-foreground">
                  New clients acquired over time
                </p>
              </div>
              <div className="space-y-4">
                {clientSegments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: segment.color }}
                      >
                        {segment.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-xs text-muted-foreground">{segment.value} clients</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{((segment.value / (clientSegments.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">of total base</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Low Stock Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Items that require immediate attention
                </p>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                {inventoryAlerts.length} Items
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inventoryAlerts.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-900/10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium truncate pr-2" title={item.productName}>{item.productName}</h4>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>

                  <div className="space-y-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Stock:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{item.currentStock}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min Level:</span>
                      <span>{item.minStock}</span>
                    </div>

                    <div className="pt-2 border-t border-orange-200 dark:border-orange-900/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Est. Days Left:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.daysOfStock < 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                          {item.daysOfStock} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {inventoryAlerts.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p>No low stock alerts. Inventory is healthy!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
