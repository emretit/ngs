
import Service from "@/pages/Service";
import NewServiceRequest from "@/pages/service/NewServiceRequest";
import { RouteConfig } from "./types";

// Define service routes
export const serviceRoutes: RouteConfig[] = [
  { path: "/service", component: Service, protected: true },
  { path: "/service/new", component: NewServiceRequest, protected: true },
];
