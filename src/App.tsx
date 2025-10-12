import React, { useState, useEffect } from "react";
import {
  Plus,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Palette,
  Brush,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { DashboardOverview } from "./components/DashboardOverview";
import { ProductsManager } from "./components/ProductsManager";
import { ClientsManager } from "./components/ClientsManager";
import { SuppliersManager } from "./components/SuppliersManager";
import { OrdersManager } from "./components/OrdersManager";
import { ProjectsManager } from "./components/ProjectsManager";
import { InventoryTransactions } from "./components/InventoryTransactions";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { Login } from "./components/Login";
import { CustomerPortal } from "./components/CustomerPortal";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lowStockAlerts, setLowStockAlerts] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock data for demo - in real implementation, this would come from the database
  useEffect(() => {
    // Simulate loading dashboard metrics
    setLowStockAlerts(3);
    setPendingOrders(8);
  }, []);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "products", label: "Products", icon: Package },
    { id: "clients", label: "Clients", icon: Users },
    { id: "projects", label: "Projects", icon: Palette },
    { id: "suppliers", label: "Suppliers", icon: Brush },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "reports", label: "Reports", icon: TrendingUp },
  ];

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show customer portal for clients
  if (user.role === "client") {
    return (
      <div className="min-h-screen bg-background">
        {/* Customer Portal Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Sambright Investment Ltd
                </h1>
                <p className="text-sm text-muted-foreground">Customer Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Customer Portal Content */}
        <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
          <CustomerPortal />
        </main>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sambright Investment Ltd
              </h1>
              <p className="text-sm text-gray-600">Painting Business CRM</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* User info and sign out - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>

            {/* Alerts - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-3">
              {lowStockAlerts > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center space-x-1 animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>{lowStockAlerts} Low Stock</span>
                </Badge>
              )}
              {pendingOrders > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1 border-blue-200 bg-blue-50 text-blue-700"
                >
                  <ShoppingCart className="h-3 w-3" />
                  <span>{pendingOrders} Pending</span>
                </Badge>
              )}
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Navigation</h2>
                    <Button variant="ghost" size="sm" onClick={toggleTheme}>
                      {theme === "light" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Mobile user info and sign out */}
                  <div className="space-y-2 pb-4 border-b">
                    <div className="text-sm text-muted-foreground">
                      Welcome, {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      Role: {user.role}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                      className="w-full flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Button>
                  </div>

                  {/* Mobile alerts */}
                  <div className="space-y-2">
                    {lowStockAlerts > 0 && (
                      <Badge
                        variant="destructive"
                        className="flex items-center space-x-2 w-full justify-center py-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span>{lowStockAlerts} Low Stock Items</span>
                      </Badge>
                    )}
                    {pendingOrders > 0 && (
                      <Badge
                        variant="outline"
                        className="flex items-center space-x-2 w-full justify-center py-2 border-blue-200 bg-blue-50 text-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{pendingOrders} Pending Orders</span>
                      </Badge>
                    )}
                  </div>

                  {/* Mobile navigation */}
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className="justify-start w-full py-3"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          {/* Desktop Navigation */}
          <div className="hidden sm:block overflow-x-auto">
            <TabsList className="inline-flex bg-white/80 backdrop-blur-sm border shadow-sm">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Mobile breadcrumb */}
          <div className="block sm:hidden">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <span>Current:</span>
              <Badge variant="outline" className="bg-white">
                {navigationItems.find((item) => item.id === activeTab)?.label}
              </Badge>
            </div>
          </div>

          <TabsContent
            value="dashboard"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <DashboardOverview />
          </TabsContent>

          <TabsContent
            value="products"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <ProductsManager />
          </TabsContent>

          <TabsContent
            value="clients"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <ClientsManager />
          </TabsContent>

          <TabsContent
            value="projects"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <ProjectsManager />
          </TabsContent>

          <TabsContent
            value="suppliers"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <SuppliersManager />
          </TabsContent>

          <TabsContent
            value="orders"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <OrdersManager />
          </TabsContent>

          <TabsContent
            value="inventory"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <InventoryTransactions />
          </TabsContent>

          <TabsContent
            value="reports"
            className="space-y-8 animate-in fade-in-50 duration-200"
          >
            <ReportsAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
