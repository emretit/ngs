import React from "react";
import { RouteConfig } from "./types";

// Lazy load all employee pages
const Employees = React.lazy(() => import("@/pages/Employees"));
const AddEmployee = React.lazy(() => import("@/pages/AddEmployee"));
const EmployeeDetails = React.lazy(() => import("@/pages/EmployeeDetails"));
const EmployeeForm = React.lazy(() => import("@/pages/EmployeeForm"));
const EmployeePayroll = React.lazy(() => import("@/pages/EmployeePayroll"));
const EmployeeLeaves = React.lazy(() => import("@/pages/EmployeeLeaves"));
const EmployeeDocuments = React.lazy(() => import("@/pages/EmployeeDocuments"));

// Define employee routes
export const employeeRoutes: RouteConfig[] = [
  { path: "/employees", component: Employees, protected: true },
  { path: "/add-employee", component: AddEmployee, protected: true },
  { path: "/employees/:id", component: EmployeeDetails, protected: true },
  { path: "/employees/:id/edit", component: EmployeeForm, protected: true },
  { path: "/employees/payroll", component: EmployeePayroll, protected: true },
  { path: "/employees/leaves", component: EmployeeLeaves, protected: true },
  { path: "/employees/documents", component: EmployeeDocuments, protected: true },
];
