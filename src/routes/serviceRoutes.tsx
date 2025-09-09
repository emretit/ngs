
import Service from "@/pages/Service";
import { RouteConfig } from "./types";

// Define service routes
export const serviceRoutes: RouteConfig[] = [
  { path: "/service", component: Service, protected: true },
];
