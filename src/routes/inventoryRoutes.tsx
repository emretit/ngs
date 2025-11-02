import { RouteConfig } from "./types";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard.tsx";
import InventoryTransactions from "@/pages/inventory/InventoryTransactions.tsx";
import Production from "@/pages/inventory/Production.tsx";

// Define inventory routes
export const inventoryRoutes: RouteConfig[] = [
  { path: "/inventory", component: InventoryDashboard, protected: true },
  { path: "/inventory/transactions", component: InventoryTransactions, protected: true },
  { path: "/production", component: Production, protected: true },
  { path: "/production/work-orders/new", component: Production, protected: true },
];
