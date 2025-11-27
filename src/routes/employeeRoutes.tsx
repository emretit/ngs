import React from "react";
import { RouteConfig } from "./types";

// Lazy load all employee pages
const Employees = React.lazy(() => import("@/pages/Employees"));
const AddEmployee = React.lazy(() => import("@/pages/AddEmployee"));
const EmployeeDetails = React.lazy(() => import("@/pages/EmployeeDetails"));
const EmployeeForm = React.lazy(() => import("@/pages/EmployeeForm"));

// Define employee routes
export const employeeRoutes: RouteConfig[] = [
  { path: "/employees", component: Employees, protected: true },
  { path: "/add-employee", component: AddEmployee, protected: true },
  { path: "/employees/:id", component: EmployeeDetails, protected: true },
  { path: "/employees/:id/edit", component: EmployeeForm, protected: true },
];
