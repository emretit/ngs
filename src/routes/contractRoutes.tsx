import React from "react";
import { RouteConfig } from "./types";

// Lazy load all contract pages
const ContractsDashboard = React.lazy(() => import("@/pages/contracts/ContractsDashboard"));
const ServiceContracts = React.lazy(() => import("@/pages/contracts/ServiceContracts"));
const VehicleContracts = React.lazy(() => import("@/pages/contracts/VehicleContracts"));
const CustomerContracts = React.lazy(() => import("@/pages/contracts/CustomerContracts"));

// Define contract routes
export const contractRoutes: RouteConfig[] = [
  // Dashboard - Ana Sayfa
  { path: "/contracts", component: ContractsDashboard, protected: true },
  
  // Sözleşme Türleri
  { path: "/contracts/service", component: ServiceContracts, protected: true },
  { path: "/contracts/vehicle", component: VehicleContracts, protected: true },
  { path: "/contracts/customer", component: CustomerContracts, protected: true },
];

