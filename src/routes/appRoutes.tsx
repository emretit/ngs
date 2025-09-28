import { RouteConfig } from "./types";
import { publicRoutes } from "./publicRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { productRoutes } from "./productRoutes";
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


import Deliveries from "@/pages/Deliveries";
import Returns from "@/pages/Returns";
import InvoiceManagement from "@/pages/InvoiceManagement";
import ModulesTree from "@/pages/ModulesTree";



export const appRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...dashboardRoutes,
  ...productRoutes,
  ...customerRoutes,
  ...supplierRoutes,
  ...employeeRoutes,
  ...financeRoutes,
  ...cashflowRoutes,
  ...serviceRoutes,
  ...orderRoutes,
  ...crmRoutes,
  ...settingsRoutes,
  ...purchaseRoutes,
  ...proposalRoutes,
  ...vehicleRoutes,
  

  { path: "/deliveries", component: Deliveries, protected: true },
  { path: "/returns", component: Returns, protected: true },
  { path: "/invoices", component: InvoiceManagement, protected: true },
  { path: "/modules-tree", component: ModulesTree, protected: true },

];
