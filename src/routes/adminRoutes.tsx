import React from "react";
import { RouteConfig } from "./types";

// Lazy load all admin pages
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const Companies = React.lazy(() => import("@/pages/admin/Companies"));
const CompanyEdit = React.lazy(() => import("@/pages/admin/CompanyEdit"));
const CompanyDetailPage = React.lazy(() => import("@/pages/admin/CompanyDetailPage"));
const CompanyUsers = React.lazy(() => import("@/pages/admin/CompanyUsers"));
const CompanyFinancials = React.lazy(() => import("@/pages/admin/CompanyFinancials"));
const AuditLogs = React.lazy(() => import("@/pages/admin/AuditLogs"));
const SecurityMonitoring = React.lazy(() => import("@/pages/admin/SecurityMonitoring"));
const UserDetail = React.lazy(() => import("@/pages/admin/UserDetail"));

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
    path: "/admin/companies/new", 
    component: CompanyEdit, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/companies/:id/edit", 
    component: CompanyEdit, 
    protected: true,
    isAdmin: true,
  },
  { 
    path: "/admin/companies/:id", 
    component: CompanyDetailPage, 
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
