
import Service from "@/pages/Service";
import ServiceRequestNew from "@/pages/ServiceRequestNew";
import ServiceRequestEdit from "@/pages/ServiceRequestEdit";
import { RouteConfig } from "./types";

// Define service routes
export const serviceRoutes: RouteConfig[] = [
  { path: "/service", component: Service, protected: true },
  { path: "/service/new", component: ServiceRequestNew, protected: true },
  { path: "/service/edit/:id", component: ServiceRequestEdit, protected: true },
];
