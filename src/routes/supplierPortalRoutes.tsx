import { RouteConfig } from "./types";

// Supplier Portal Pages
import SupplierPortalLogin from "@/pages/supplier-portal/index";
import SupplierPortalDashboard from "@/pages/supplier-portal/dashboard";
import SupplierPortalRFQs from "@/pages/supplier-portal/rfqs/index";
import SupplierPortalRFQDetail from "@/pages/supplier-portal/rfqs/[id]";
import SupplierPortalOrders from "@/pages/supplier-portal/orders/index";
import SupplierPortalOrderDetail from "@/pages/supplier-portal/orders/[id]";

export const supplierPortalRoutes: RouteConfig[] = [
  {
    path: "/supplier-portal",
    component: SupplierPortalLogin,
    protected: false,
  },
  {
    path: "/supplier-portal/login",
    component: SupplierPortalLogin,
    protected: false,
  },
  {
    path: "/supplier-portal/dashboard",
    component: SupplierPortalDashboard,
    protected: false, // Custom auth handled by portal
  },
  {
    path: "/supplier-portal/rfqs",
    component: SupplierPortalRFQs,
    protected: false,
  },
  {
    path: "/supplier-portal/rfqs/:id",
    component: SupplierPortalRFQDetail,
    protected: false,
  },
  {
    path: "/supplier-portal/orders",
    component: SupplierPortalOrders,
    protected: false,
  },
  {
    path: "/supplier-portal/orders/:id",
    component: SupplierPortalOrderDetail,
    protected: false,
  },
];

