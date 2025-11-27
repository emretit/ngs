import React from "react";
import { RouteConfig } from "./types";

// Lazy load all supplier pages
const Suppliers = React.lazy(() => import("@/pages/Suppliers"));
const SupplierDetails = React.lazy(() => import("@/pages/SupplierDetails"));
const SupplierNew = React.lazy(() => import("@/pages/SupplierNew"));
const SupplierForm = React.lazy(() => import("@/pages/SupplierForm"));

// Define supplier routes
export const supplierRoutes: RouteConfig[] = [
  { path: "/suppliers", component: Suppliers, protected: true },
  { path: "/suppliers/:id", component: SupplierDetails, protected: true },
  { path: "/suppliers/new", component: SupplierNew, protected: true },
  { path: "/suppliers/:id/edit", component: SupplierForm, protected: true },
];
