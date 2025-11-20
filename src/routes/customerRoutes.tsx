
import Contacts from "@/pages/Contacts";
import CustomerForm from "@/pages/CustomerForm";
import ContactDetails from "@/pages/ContactDetails";
import { RouteConfig } from "./types";

// Define customer routes
export const customerRoutes: RouteConfig[] = [
  { path: "/contacts", component: Contacts, protected: true },
  { path: "/contacts/new", component: CustomerForm, protected: true },
  { path: "/contacts/:id", component: ContactDetails, protected: true },
  { path: "/contacts/:id/edit", component: CustomerForm, protected: true },
];
