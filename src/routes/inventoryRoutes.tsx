import { RouteConfig } from "./types";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard.tsx";
import Production from "@/pages/inventory/Production.tsx";
import Warehouses from "@/pages/inventory/Warehouses.tsx";
import WarehouseDetails from "@/pages/inventory/WarehouseDetails.tsx";
import WarehouseNew from "@/pages/inventory/WarehouseNew.tsx";
import WarehouseEdit from "@/pages/inventory/WarehouseEdit.tsx";

// Define inventory routes
export const inventoryRoutes: RouteConfig[] = [
  { path: "/inventory", component: InventoryDashboard, protected: true },
  { path: "/inventory/warehouses", component: Warehouses, protected: true },
  { path: "/inventory/warehouses/new", component: WarehouseNew, protected: true },
  { path: "/inventory/warehouses/:id/edit", component: WarehouseEdit, protected: true },
  { path: "/inventory/warehouses/:id", component: WarehouseDetails, protected: true },
  { path: "/production", component: Production, protected: true },
  { path: "/production/work-orders/new", component: Production, protected: true },
];
