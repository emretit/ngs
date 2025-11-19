import { RouteConfig } from "./types";
import InventoryDashboard from "@/pages/inventory/InventoryDashboard.tsx";
import Production from "@/pages/inventory/Production.tsx";
import ProductionBOMNew from "@/pages/inventory/ProductionBOMNew.tsx";
import ProductionBOMDetail from "@/pages/inventory/ProductionBOMDetail.tsx";
import Warehouses from "@/pages/inventory/Warehouses.tsx";
import WarehouseDetails from "@/pages/inventory/WarehouseDetails.tsx";
import WarehouseNew from "@/pages/inventory/WarehouseNew.tsx";
import WarehouseEdit from "@/pages/inventory/WarehouseEdit.tsx";
import InventoryTransactions from "@/pages/inventory/InventoryTransactions.tsx";
import InventoryCounts from "@/pages/inventory/InventoryCounts.tsx";
import NewInventoryCount from "@/pages/inventory/transactions/sayim/new.tsx";
import NewStockEntry from "@/pages/inventory/transactions/giris/new.tsx";
import NewStockExit from "@/pages/inventory/transactions/cikis/new.tsx";
import NewStockTransfer from "@/pages/inventory/transactions/transfer/new.tsx";
import InventoryTransactionDetail from "@/pages/inventory/transactions/[id].tsx";

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
  { path: "/production/work-orders/new", component: Production, protected: true },
  { path: "/production/bom/new", component: ProductionBOMNew, protected: true },
  { path: "/production/bom/:id", component: ProductionBOMDetail, protected: true },
];
