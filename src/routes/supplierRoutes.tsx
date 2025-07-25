
import Suppliers from "@/pages/Suppliers";
import SupplierDetails from "@/pages/SupplierDetails";
import SupplierForm from "@/pages/SupplierForm";
import { RouteConfig } from "./types";

// Define supplier routes
export const supplierRoutes: RouteConfig[] = [
  { path: "/suppliers", component: Suppliers, protected: true },
  { path: "/suppliers/:id", component: SupplierDetails, protected: true },
  { path: "/suppliers/new", component: SupplierForm, protected: true },
  { path: "/suppliers/:id/edit", component: SupplierForm, protected: true },
];
