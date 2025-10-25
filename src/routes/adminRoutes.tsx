import { RouteConfig } from "./types";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Companies from "@/pages/admin/Companies";
import CompanyDetail from "@/pages/admin/CompanyDetail";

export const adminRoutes: RouteConfig[] = [
  { 
    path: "/admin", 
    component: AdminDashboard, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/companies", 
    component: Companies, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/companies/:id", 
    component: CompanyDetail, 
    protected: true,
    isAdmin: true,
  },
];
