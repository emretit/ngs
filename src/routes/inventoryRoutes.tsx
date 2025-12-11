import React from "react";
import { RouteConfig } from "./types";

// Lazy load all inventory pages
const InventoryDashboard = React.lazy(() => import("@/pages/inventory/InventoryDashboard"));
const Production = React.lazy(() => import("@/pages/inventory/Production"));
const ProductionBOMs = React.lazy(() => import("@/pages/inventory/ProductionBOMs"));
const ProductionBOMNew = React.lazy(() => import("@/pages/inventory/ProductionBOMNew"));
const ProductionBOMDetail = React.lazy(() => import("@/pages/inventory/ProductionBOMDetail"));
const NewWorkOrderCreate = React.lazy(() => import("@/pages/inventory/NewWorkOrderCreate"));
const Warehouses = React.lazy(() => import("@/pages/inventory/Warehouses"));
const WarehouseDetails = React.lazy(() => import("@/pages/inventory/WarehouseDetails"));
const WarehouseNew = React.lazy(() => import("@/pages/inventory/WarehouseNew"));
const WarehouseEdit = React.lazy(() => import("@/pages/inventory/WarehouseEdit"));
const InventoryTransactions = React.lazy(() => import("@/pages/inventory/InventoryTransactions"));
const InventoryCounts = React.lazy(() => import("@/pages/inventory/InventoryCounts"));
const NewInventoryCount = React.lazy(() => import("@/pages/inventory/transactions/sayim/new"));
const NewStockEntry = React.lazy(() => import("@/pages/inventory/transactions/giris/new"));
const NewStockExit = React.lazy(() => import("@/pages/inventory/transactions/cikis/new"));
const NewStockTransfer = React.lazy(() => import("@/pages/inventory/transactions/transfer/new"));
const InventoryTransactionDetail = React.lazy(() => import("@/pages/inventory/transactions/[id]"));

// Define inventory routes
export const inventoryRoutes: RouteConfig[] = [
  { path: "/inventory", component: InventoryDashboard, protected: true },
  { path: "/inventory/warehouses", component: Warehouses, protected: true },
  { path: "/inventory/warehouses/new", component: WarehouseNew, protected: true },
  { path: "/inventory/warehouses/:id/edit", component: WarehouseEdit, protected: true },
  { path: "/inventory/warehouses/:id", component: WarehouseDetails, protected: true },
  { path: "/inventory/transactions", component: InventoryTransactions, protected: true },
  { path: "/inventory/transactions/:id", component: InventoryTransactionDetail, protected: true },
  { path: "/inventory/transactions/giris/new", component: NewStockEntry, protected: true },
  { path: "/inventory/transactions/cikis/new", component: NewStockExit, protected: true },
  { path: "/inventory/transactions/transfer/new", component: NewStockTransfer, protected: true },
  { path: "/inventory/counts", component: InventoryCounts, protected: true },
  { path: "/inventory/transactions/sayim/new", component: NewInventoryCount, protected: true },
  { path: "/production", component: Production, protected: true },
  { path: "/production/work-orders/new", component: NewWorkOrderCreate, protected: true },
  { path: "/production/work-orders/:id/edit", component: NewWorkOrderCreate, protected: true },
  { path: "/production/boms", component: ProductionBOMs, protected: true },
  { path: "/production/bom/new", component: ProductionBOMNew, protected: true },
  { path: "/production/bom/:id/edit", component: ProductionBOMNew, protected: true },
  { path: "/production/bom/:id", component: ProductionBOMDetail, protected: true },
];
