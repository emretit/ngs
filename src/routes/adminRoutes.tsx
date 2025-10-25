import { RouteConfig } from "./types";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Companies from "@/pages/admin/Companies";
import CompanyDetail from "@/pages/admin/CompanyDetail";
import CompanyUsers from "@/pages/admin/CompanyUsers";
import CompanyFinancials from "@/pages/admin/CompanyFinancials";
import AuditLogs from "@/pages/admin/AuditLogs";
import SecurityMonitoring from "@/pages/admin/SecurityMonitoring";
import UserDetail from "@/pages/admin/UserDetail";

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
  { 
    path: "/admin/companies/:id/users", 
    component: CompanyUsers, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/companies/:id/financials", 
    component: CompanyFinancials, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/audit-logs", 
    component: AuditLogs, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/security", 
    component: SecurityMonitoring, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/users/:id", 
    component: UserDetail, 
    protected: true,
    isAdmin: true,
  },
];
