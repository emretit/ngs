import React from "react";
import { RouteConfig } from "./types";

// Lazy load all customer pages
const Contacts = React.lazy(() => import("@/pages/Contacts"));
const CustomerForm = React.lazy(() => import("@/pages/CustomerForm"));
const ContactDetails = React.lazy(() => import("@/pages/ContactDetails"));

// Define customer routes
export const customerRoutes: RouteConfig[] = [
  { path: "/customers", component: Contacts, protected: true },
  { path: "/customers/new", component: CustomerForm, protected: true },
  { path: "/customers/:id", component: ContactDetails, protected: true },
  { path: "/customers/:id/edit", component: CustomerForm, protected: true },
];
