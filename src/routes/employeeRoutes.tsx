import React from "react";
import { RouteConfig } from "./types";

// Lazy load all employee pages
const Employees = React.lazy(() => import("@/pages/Employees"));
const AddEmployee = React.lazy(() => import("@/pages/AddEmployee"));
const EmployeeDetails = React.lazy(() => import("@/pages/EmployeeDetails"));
const EmployeeForm = React.lazy(() => import("@/pages/EmployeeForm"));
const TimePayrollPage = React.lazy(() => import("@/pages/hr/TimePayrollPage"));
const EmployeeLeaves = React.lazy(() => import("@/pages/EmployeeLeaves"));
const LeaveSettingsPage = React.lazy(() => import("@/pages/LeaveSettingsPage"));
const EmployeeDocuments = React.lazy(() => import("@/pages/EmployeeDocuments"));
const OrganizationChart = React.lazy(() => import("@/pages/OrganizationChart"));

// Define employee routes
// NOTE: More specific routes must come before generic ones (e.g., :id parameter)
export const employeeRoutes: RouteConfig[] = [
  { path: "/employees", component: Employees, protected: true },
  { path: "/add-employee", component: AddEmployee, protected: true },
  { path: "/employees/leaves/settings", component: LeaveSettingsPage, protected: true }, // Most specific first
  { path: "/employees/payroll", component: TimePayrollPage, protected: true },
  { path: "/employees/leaves", component: EmployeeLeaves, protected: true },
  { path: "/employees/documents", component: EmployeeDocuments, protected: true },
  { path: "/organization-chart", component: OrganizationChart, protected: true },
  { path: "/employees/:id/edit", component: EmployeeForm, protected: true },
  { path: "/employees/:id", component: EmployeeDetails, protected: true }, // Generic route last
];
