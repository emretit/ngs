import React from "react";
import { RouteConfig } from "./types";

// Lazy load all supplier portal pages
const SupplierPortalLogin = React.lazy(() => import("@/pages/supplier-portal/index"));
const SupplierPortalDashboard = React.lazy(() => import("@/pages/supplier-portal/dashboard"));
const SupplierPortalRFQs = React.lazy(() => import("@/pages/supplier-portal/rfqs/index"));
const SupplierPortalRFQDetail = React.lazy(() => import("@/pages/supplier-portal/rfqs/[id]"));
const SupplierPortalOrders = React.lazy(() => import("@/pages/supplier-portal/orders/index"));
const SupplierPortalOrderDetail = React.lazy(() => import("@/pages/supplier-portal/orders/[id]"));

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
