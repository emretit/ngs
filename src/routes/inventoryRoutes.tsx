import { RouteConfig } from "./types";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard.tsx";
import Production from "@/pages/inventory/Production.tsx";
import Warehouses from "@/pages/inventory/Warehouses.tsx";
import WarehouseDetails from "@/pages/inventory/WarehouseDetails.tsx";

// Define inventory routes
export const inventoryRoutes: RouteConfig[] = [
  { path: "/inventory", component: InventoryDashboard, protected: true },
  { path: "/inventory/warehouses", component: Warehouses, protected: true },
  { path: "/inventory/warehouses/:id", component: WarehouseDetails, protected: true },
  { path: "/production", component: Production, protected: true },
  { path: "/production/work-orders/new", component: Production, protected: true },
];
