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
} from "lucide-react";

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
      alert(
        `Failed to load reports data: ${errorMsg}\n\nPlease check your database connection.`
      );
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Reports & Analytics
            </h2>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-8 bg-muted rounded w-16 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
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
          >
            <Download className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total revenue from all orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paintings Sold
            </CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaintingsSold}</div>
            <p className="text-xs text-muted-foreground">
              Total paintings sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Average order value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="clients">Client Analysis</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
                <CardDescription>
                  Revenue breakdown by product category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <YAxis
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${value}`, ""]}
                      contentStyle={{
                        backgroundColor:
                          theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${
                          theme === "dark" ? "#374151" : "#e5e7eb"
                        }`,
                        borderRadius: "6px",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="paintings"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="paints"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Growth</CardTitle>
                <CardDescription>Month-over-month total sales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <YAxis
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${value}`, "Total Sales"]}
                      contentStyle={{
                        backgroundColor:
                          theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${
                          theme === "dark" ? "#374151" : "#e5e7eb"
                        }`,
                        borderRadius: "6px",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#8884d8"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
              <CardDescription>
                Key performance indicators for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    $
                    {salesData
                      .reduce((sum, data) => sum + data.paintings, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Paintings Revenue
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    $
                    {salesData
                      .reduce((sum, data) => sum + data.paints, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Paints Revenue
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(
                      ...salesData.map((d) => d.total)
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Best Month
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {(totalRevenue / 12 / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Monthly
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>
                  Best performing products in your catalog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="horizontal">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={{
                        stroke: theme === "dark" ? "#374151" : "#e5e7eb",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${value}`, "Revenue"]}
                      contentStyle={{
                        backgroundColor:
                          theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${
                          theme === "dark" ? "#374151" : "#e5e7eb"
                        }`,
                        borderRadius: "6px",
                        color: theme === "dark" ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>
                  Revenue distribution by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                      (categoryRevenue / totalProductRevenue) * 100;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {category}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${categoryRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              category === "Paintings"
                                ? "bg-blue-600"
                                : "bg-green-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% of total revenue
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Product Performance</CardTitle>
              <CardDescription>
                Complete breakdown of all products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-center p-2">Units Sold</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((product, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{product.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-2 text-center">{product.sold}</td>
                        <td className="p-2 text-right font-semibold">
                          ${product.revenue.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          ${(product.revenue / product.sold).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Segments</CardTitle>
                <CardDescription>
                  Revenue distribution by client type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                    >
                      {clientSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>
                  New clients acquired over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{segment.value}%</div>
                        <div className="text-sm text-muted-foreground">
                          of revenue
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Client Insights</CardTitle>
              <CardDescription>
                Key metrics about your customer base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {clientSegments.reduce((sum, s) => sum + s.value, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Clients
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <div className="text-sm text-muted-foreground">
                    New This Month
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalRevenue > 0 &&
                    clientSegments.reduce((sum, s) => sum + s.value, 0) > 0
                      ? formatCurrency(
                          totalRevenue /
                            clientSegments.reduce((sum, s) => sum + s.value, 0)
                        )
                      : "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Client Value
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">-</div>
                  <div className="text-sm text-muted-foreground">
                    Repeat Customers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>
                  Items requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.currentStock <= alert.minStock
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{alert.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              alert.currentStock <= alert.minStock
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {alert.currentStock} / {alert.minStock}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.daysOfStock} days left
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>
                  Current stock valuation by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm">Inventory valuation coming soon</p>
                  <p className="text-xs mt-1">
                    Add product costs to calculate inventory value
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Turnover */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover Analysis</CardTitle>
              <CardDescription>How quickly inventory is moving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {productPerformance.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Products
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <div className="text-sm text-muted-foreground">
                    Avg Turnover Rate
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">-</div>
                  <div className="text-sm text-muted-foreground">
                    Slow Moving
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {inventoryAlerts.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Stock</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
