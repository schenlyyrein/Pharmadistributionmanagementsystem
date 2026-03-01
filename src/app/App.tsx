import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router";
import { Toaster } from "./components/ui/sonner";
import { DashboardLayout } from "./components/DashboardLayout";
import { LoginScreen } from "./components/screens/LoginScreen";
import { GlobalDashboard } from "./components/screens/GlobalDashboard";
import { ProductMaster } from "./components/screens/ProductMaster";
import { InboundProcurement } from "./components/screens/InboundProcurement";
import { WarehouseReceiving } from "./components/screens/WarehouseReceiving";
import { StockManagement } from "./components/screens/StockManagement";
import { OutboundDistribution } from "./components/screens/OutboundDistribution";
import { DiscrepancyApprovals } from "./components/screens/DiscrepancyApprovals";
import { POList } from "./components/screens/POlist";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: (
      <>
        <LoginScreen />
        <Toaster />
      </>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <GlobalDashboard />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/products",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <ProductMaster />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/procurement",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <InboundProcurement />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <WarehouseReceiving />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/stock",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <StockManagement />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/distribution",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <OutboundDistribution />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/discrepancies",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <DiscrepancyApprovals />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
  {
    path: "/po-list",
    element: (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <DashboardLayout>
          <POList />
        </DashboardLayout>
        <Toaster />
      </div>
    ),
  },
]);

// Force refresh after dialog component updates
export default function App() {
  return <RouterProvider router={router} />;
}