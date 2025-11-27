import React from "react";
import { RouteConfig } from "./types";

// Lazy load all dashboard pages
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const CrmDashboard = React.lazy(() => import("@/pages/crm/CrmDashboard"));
const ExpenseManagement = React.lazy(() => import("@/pages/ExpenseManagement"));
const InvestmentManagement = React.lazy(() => import("@/pages/InvestmentManagement"));
const FinancingManagement = React.lazy(() => import("@/pages/FinancingManagement"));
const OtherActivitiesManagement = React.lazy(() => import("@/pages/OtherActivitiesManagement"));
const Reports = React.lazy(() => import("@/pages/Reports"));
const GeneralCalendar = React.lazy(() => import("@/pages/GeneralCalendar"));

export const dashboardRoutes: RouteConfig[] = [
  { 
    path: "/dashboard", 
    component: Dashboard, 
    protected: true 
  },
  {
    path: "/crm", 
    component: CrmDashboard, 
    protected: true 
  },
  {
    path: "/expense-management",
    component: ExpenseManagement,
    protected: true
  },
  {
    path: "/investment-management",
    component: InvestmentManagement,
    protected: true
  },
  {
    path: "/financing-management",
    component: FinancingManagement,
    protected: true
  },
  {
    path: "/other-activities",
    component: OtherActivitiesManagement,
    protected: true
  },
  {
    path: "/reports",
    component: Reports,
    protected: true
  },
  {
    path: "/calendar",
    component: GeneralCalendar,
    protected: true
  }
];
