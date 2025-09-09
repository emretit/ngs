
import Activities from "@/pages/Activities";
import NewActivity from "@/pages/NewActivity";
import Opportunities from "@/pages/crm/Opportunities";
import PurchaseManagement from "@/pages/PurchaseManagement";
import { RouteConfig } from "./types";

// Define CRM and workflow routes
export const crmRoutes: RouteConfig[] = [
  { path: "/activities", component: Activities, protected: true },
  { path: "/activities/new", component: NewActivity, protected: true },
  { path: "/opportunities", component: Opportunities, protected: true },
  { path: "/purchase-management", component: PurchaseManagement, protected: true },
];
