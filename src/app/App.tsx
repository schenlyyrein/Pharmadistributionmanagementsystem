import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { DashboardLayout } from "./components/DashboardLayout";
import { LoginScreen } from "./components/screens/LoginScreen";
import { GlobalDashboard } from "./components/screens/GlobalDashboard";
import { ProductMaster } from "./components/screens/ProductMaster";
import { InboundProcurement } from "./components/screens/InboundProcurement";
import { WarehouseReceiving } from "./components/screens/WarehouseReceiving";
import { StockManagement } from "./components/screens/StockManagement";
import { OutboundDistribution } from "./components/screens/OutboundDistribution";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <>
            <LoginScreen />
            <Toaster />
          </>
        } />
        <Route path="/*" element={
          <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            <DashboardLayout>
              <Routes>
                <Route path="/dashboard" element={<GlobalDashboard />} />
                <Route path="/products" element={<ProductMaster />} />
                <Route path="/procurement" element={<InboundProcurement />} />
                <Route path="/warehouse" element={<WarehouseReceiving />} />
                <Route path="/stock" element={<StockManagement />} />
                <Route path="/distribution" element={<OutboundDistribution />} />
              </Routes>
            </DashboardLayout>
            <Toaster />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}