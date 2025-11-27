import React from "react";
import { RouteConfig } from "./types";

// Lazy load all CRM pages
const Activities = React.lazy(() => import("@/pages/Activities"));
const NewActivity = React.lazy(() => import("@/pages/NewActivity"));
const Opportunities = React.lazy(() => import("@/pages/crm/Opportunities"));
const PurchaseManagement = React.lazy(() => import("@/pages/PurchaseManagement"));

// Define CRM and workflow routes
export const crmRoutes: RouteConfig[] = [
  { path: "/activities", component: Activities, protected: true },
  { path: "/activities/new", component: NewActivity, protected: true },
  { path: "/opportunities", component: Opportunities, protected: true },
  { path: "/purchase-management", component: PurchaseManagement, protected: true },
];
