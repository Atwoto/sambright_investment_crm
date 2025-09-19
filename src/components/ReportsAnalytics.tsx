import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
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
  AreaChart
} from 'recharts';
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
  Brush
} from 'lucide-react';

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
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [clientSegments, setClientSegments] = useState<ClientSegment[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    // Mock data - in real implementation, fetch from Supabase
    setSalesData([
      { month: 'Jan', paintings: 2400, paints: 1200, total: 3600 },
      { month: 'Feb', paintings: 1800, paints: 1500, total: 3300 },
      { month: 'Mar', paintings: 3200, paints: 1800, total: 5000 },
      { month: 'Apr', paintings: 2800, paints: 1600, total: 4400 },
      { month: 'May', paintings: 3600, paints: 2200, total: 5800 },
      { month: 'Jun', paintings: 4200, paints: 2000, total: 6200 },
      { month: 'Jul', paintings: 3800, paints: 2400, total: 6200 },
      { month: 'Aug', paintings: 4600, paints: 2800, total: 7400 },
      { month: 'Sep', paintings: 4200, paints: 2600, total: 6800 },
      { month: 'Oct', paintings: 3800, paints: 2200, total: 6000 },
      { month: 'Nov', paintings: 4400, paints: 2800, total: 7200 },
      { month: 'Dec', paintings: 5200, paints: 3200, total: 8400 }
    ]);

    setProductPerformance([
      { name: 'Sunset Landscape', sold: 15, revenue: 12750, category: 'Paintings' },
      { name: 'Abstract Series', sold: 12, revenue: 9600, category: 'Paintings' },
      { name: 'Titanium White 500ml', sold: 48, revenue: 1199, category: 'Paints' },
      { name: 'Portrait Collection', sold: 8, revenue: 6400, category: 'Paintings' },
      { name: 'Ultramarine Blue 200ml', sold: 36, revenue: 666, category: 'Paints' },
      { name: 'Urban Sketches', sold: 10, revenue: 4500, category: 'Paintings' },
      { name: 'Oil Paint Set', sold: 24, revenue: 2880, category: 'Paints' },
      { name: 'Watercolor Studies', sold: 6, revenue: 2700, category: 'Paintings' }
    ]);

    setClientSegments([
      { name: 'Galleries', value: 35, color: '#8884d8' },
      { name: 'Individual Collectors', value: 25, color: '#82ca9d' },
      { name: 'Interior Designers', value: 20, color: '#ffc658' },
      { name: 'Artists', value: 15, color: '#ff7300' },
      { name: 'Other', value: 5, color: '#00ff00' }
    ]);

    setInventoryAlerts([
      { id: '1', productName: 'Titanium White 500ml', currentStock: 3, minStock: 5, category: 'Paint', daysOfStock: 8 },
      { id: '2', productName: 'Canvas 24x36', currentStock: 2, minStock: 6, category: 'Supply', daysOfStock: 5 },
      { id: '3', productName: 'Cadmium Red 100ml', currentStock: 1, minStock: 4, category: 'Paint', daysOfStock: 3 },
      { id: '4', productName: 'Professional Brushes Set', currentStock: 4, minStock: 8, category: 'Supply', daysOfStock: 12 }
    ]);
  }, []);

  const totalRevenue = salesData.reduce((sum, data) => sum + data.total, 0);
  const totalPaintingsSold = productPerformance.filter(p => p.category === 'Paintings').reduce((sum, p) => sum + p.sold, 0);
  const averageOrderValue = totalRevenue / (totalPaintingsSold + productPerformance.filter(p => p.category === 'Paints').reduce((sum, p) => sum + p.sold, 0));

  const topProducts = [...productPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const lowStockItems = inventoryAlerts.filter(item => item.currentStock <= item.minStock);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Business insights and performance metrics</p>
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paintings Sold</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaintingsSold}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              +4.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
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
                <CardDescription>Revenue breakdown by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, '']} />
                    <Area type="monotone" dataKey="paintings" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="paints" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Total Sales']} />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Summary</CardTitle>
              <CardDescription>Key performance indicators for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${salesData.reduce((sum, data) => sum + data.paintings, 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Paintings Revenue</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${salesData.reduce((sum, data) => sum + data.paints, 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Paints Revenue</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.max(...salesData.map(d => d.total)).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Best Month</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{((totalRevenue / 12) / 1000).toFixed(1)}K</div>
                  <div className="text-sm text-gray-600">Avg Monthly</div>
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
                <CardDescription>Best performing products in your catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>Revenue distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Paintings', 'Paints'].map((category) => {
                    const categoryProducts = productPerformance.filter(p => p.category === category);
                    const categoryRevenue = categoryProducts.reduce((sum, p) => sum + p.revenue, 0);
                    const totalProductRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
                    const percentage = (categoryRevenue / totalProductRevenue) * 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-gray-600">${categoryRevenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${category === 'Paintings' ? 'bg-blue-600' : 'bg-green-600'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total revenue</div>
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
              <CardDescription>Complete breakdown of all products</CardDescription>
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
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{product.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-2 text-center">{product.sold}</td>
                        <td className="p-2 text-right font-semibold">${product.revenue.toLocaleString()}</td>
                        <td className="p-2 text-right">${(product.revenue / product.sold).toFixed(0)}</td>
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
                <CardDescription>Revenue distribution by client type</CardDescription>
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
                      label={({name, value}) => `${name} ${value}%`}
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
                <CardDescription>New clients acquired over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }}></div>
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{segment.value}%</div>
                        <div className="text-sm text-gray-500">of revenue</div>
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
              <CardDescription>Key metrics about your customer base</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <div className="text-sm text-gray-600">New This Month</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">$2,847</div>
                  <div className="text-sm text-gray-600">Avg Client Value</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">68%</div>
                  <div className="text-sm text-gray-600">Repeat Customers</div>
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
                <CardDescription>Items requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${alert.currentStock <= alert.minStock ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{alert.productName}</div>
                          <div className="text-sm text-gray-600">{alert.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${alert.currentStock <= alert.minStock ? 'text-red-600' : 'text-orange-600'}`}>
                            {alert.currentStock} / {alert.minStock}
                          </div>
                          <div className="text-xs text-gray-500">{alert.daysOfStock} days left</div>
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
                <CardDescription>Current stock valuation by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Paintings</span>
                      <span className="text-sm text-gray-600">$32,450</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Paint Supplies</span>
                      <span className="text-sm text-gray-600">$12,800</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-green-600" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Canvases & Frames</span>
                      <span className="text-sm text-gray-600">$4,920</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-purple-600" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Inventory Value</span>
                      <span className="text-green-600">$50,170</span>
                    </div>
                  </div>
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
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-600">Total SKUs</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">4.2</div>
                  <div className="text-sm text-gray-600">Avg Turnover Rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">23</div>
                  <div className="text-sm text-gray-600">Slow Moving</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">8</div>
                  <div className="text-sm text-gray-600">Out of Stock</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}