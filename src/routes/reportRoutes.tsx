import React from "react";
import { RouteConfig } from "./types";

// Lazy load report pages
const SalesReports = React.lazy(() => import("@/pages/reports/SalesReports"));
const FinancialReports = React.lazy(() => import("@/pages/reports/FinancialReports"));
const ServiceReports = React.lazy(() => import("@/pages/reports/ServiceReports"));
const InventoryReports = React.lazy(() => import("@/pages/reports/InventoryReports"));
const HRReports = React.lazy(() => import("@/pages/reports/HRReports"));
const VehicleReports = React.lazy(() => import("@/pages/reports/VehicleReports"));
const PurchasingReports = React.lazy(() => import("@/pages/reports/PurchasingReports"));
const ReportsOverview = React.lazy(() => import("@/pages/reports/ReportsOverview"));

export const reportRoutes: RouteConfig[] = [
  {
    path: "/reports",
    component: ReportsOverview,
    protected: true,
  },
  {
    path: "/reports/sales",
    component: SalesReports,
    protected: true,
  },
  {
    path: "/reports/financial",
    component: FinancialReports,
    protected: true,
  },
  {
    path: "/reports/service",
    component: ServiceReports,
    protected: true,
  },
  {
    path: "/reports/inventory",
    component: InventoryReports,
    protected: true,
  },
  {
    path: "/reports/hr",
    component: HRReports,
    protected: true,
  },
  {
    path: "/reports/vehicles",
    component: VehicleReports,
    protected: true,
  },
  {
    path: "/reports/purchasing",
    component: PurchasingReports,
    protected: true,
  },
];

