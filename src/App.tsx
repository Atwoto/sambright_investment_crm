import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { Button } from "./components/ui/button";
import { Palette, Sun, Moon } from "lucide-react";
import { Login } from "./components/Login";
import { CustomerPortal } from "./components/CustomerPortal";
import { MainLayout } from "./components/layout/MainLayout";
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

export default function App() {
  const { user, loading } = useAuth();
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
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

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

