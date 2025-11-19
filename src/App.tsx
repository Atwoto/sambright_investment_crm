import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import {
  TrendingUp,
  Package,
  Users,
  Palette,
  Brush,
  ShoppingCart,
  Sparkles,
  Shield,
  LogOut,
  Sun,
  Moon,
  Menu
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { DashboardOverview } from "./components/DashboardOverview";
import { ProductsManager } from "./components/ProductsManager";
import { ClientsManager } from "./components/ClientsManager";
import { SuppliersManager } from "./components/SuppliersManager";
import { OrdersManager } from "./components/OrdersManager";
import { ProjectsManager } from "./components/ProjectsManager";
import { InventoryTransactions } from "./components/InventoryTransactions";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { AIColorAdvisor } from "./components/AIColorAdvisor";
import { UserManagement } from "./components/UserManagement";
import { Login } from "./components/Login";
import { CustomerPortal } from "./components/CustomerPortal";
import { MainLayout } from "./components/layout/MainLayout";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.slice(1) || "dashboard";

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  // Admin/Staff Layout
  return (
    <MainLayout activeTab={activeTab} navigate={navigate}>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/products" element={<ProductsManager />} />
        <Route path="/clients" element={<ClientsManager />} />
        <Route path="/projects" element={<ProjectsManager />} />
        <Route path="/suppliers" element={<SuppliersManager />} />
        <Route path="/orders" element={<OrdersManager />} />
        <Route path="/inventory" element={<InventoryTransactions />} />
        <Route path="/ai-advisor" element={<AIColorAdvisor />} />
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </MainLayout>
  );
}

