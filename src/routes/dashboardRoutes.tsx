
import Dashboard from "@/pages/Dashboard";
import CrmDashboard from "@/pages/crm/CrmDashboard";
import IncomeManagement from "@/pages/IncomeManagement";
import ExpenseManagement from "@/pages/ExpenseManagement";
import InvestmentManagement from "@/pages/InvestmentManagement";
import FinancingManagement from "@/pages/FinancingManagement";
import OtherActivitiesManagement from "@/pages/OtherActivitiesManagement";
import { RouteConfig } from "./types";

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
    path: "/income-management",
    component: IncomeManagement,
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
  }
];
