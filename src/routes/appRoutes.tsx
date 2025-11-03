import { RouteConfig } from "./types";
import { publicRoutes } from "./publicRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { productRoutes } from "./productRoutes";
import { inventoryRoutes } from "./inventoryRoutes";
import { customerRoutes } from "./customerRoutes";
import { supplierRoutes } from "./supplierRoutes";
import { employeeRoutes } from "./employeeRoutes";
import { financeRoutes, cashflowRoutes } from "./financeRoutes";
import { serviceRoutes } from "./serviceRoutes";
import { orderRoutes } from "./orderRoutes";
import { crmRoutes } from "./crmRoutes";
import { settingsRoutes } from "./settingsRoutes";
import { purchaseRoutes } from "./purchaseRoutes";
import { proposalRoutes } from "./proposalRoutes";
import { vehicleRoutes } from "./vehicleRoutes";
import { adminRoutes } from "./adminRoutes";


import Deliveries from "@/pages/Deliveries";
import Returns from "@/pages/Returns";
import InvoiceManagement from "@/pages/InvoiceManagement";
import ModuleTreePage from "@/pages/ModuleTreePage";
import Profile from "@/pages/Profile";



export const appRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...dashboardRoutes,
  ...productRoutes,
  ...inventoryRoutes,
  ...customerRoutes,
  ...supplierRoutes,
  ...employeeRoutes,
  ...purchaseRoutes, // purchaseRoutes'u financeRoutes'dan önce koy
  ...financeRoutes,
  ...cashflowRoutes,
  ...serviceRoutes,
  ...orderRoutes,
  ...crmRoutes,
  ...settingsRoutes,
  ...proposalRoutes,
  ...vehicleRoutes,
  ...adminRoutes,
  

  { path: "/deliveries", component: Deliveries, protected: true },
  { path: "/deliveries/new", component: Deliveries, protected: true },
  { path: "/returns", component: Returns, protected: true },
  { path: "/invoices", component: InvoiceManagement, protected: true },
  { path: "/profile", component: Profile, protected: true },
  
  { path: "/modules-tree", component: ModuleTreePage, protected: true },

];
