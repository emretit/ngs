
import Employees from "@/pages/Employees";
import AddEmployee from "@/pages/AddEmployee";
import EmployeeDetails from "@/pages/EmployeeDetails";
import EmployeeForm from "@/pages/EmployeeForm";
import { RouteConfig } from "./types";

// Define employee routes
export const employeeRoutes: RouteConfig[] = [
  { path: "/employees", component: Employees, protected: true },
  { path: "/add-employee", component: AddEmployee, protected: true },
  { path: "/employees/:id", component: EmployeeDetails, protected: true },
  { path: "/employees/:id/edit", component: EmployeeForm, protected: true },
];
