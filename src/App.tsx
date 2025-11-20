import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <MainLayout activeTab={window.location.pathname.slice(1) || "dashboard"} navigate={navigate}>
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
