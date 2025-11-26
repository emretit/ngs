
import Contacts from "@/pages/Contacts";
import CustomerForm from "@/pages/CustomerForm";
import ContactDetails from "@/pages/ContactDetails";
import { RouteConfig } from "./types";

// Define customer routes
export const customerRoutes: RouteConfig[] = [
  { path: "/customers", component: Contacts, protected: true },
  { path: "/customers/new", component: CustomerForm, protected: true },
  { path: "/customers/:id", component: ContactDetails, protected: true },
  { path: "/customers/:id/edit", component: CustomerForm, protected: true },
];
