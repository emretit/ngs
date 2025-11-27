import React from "react";
import { RouteConfig } from "./types";

// Lazy load all vehicle pages
const VehicleMainPage = React.lazy(() => import("@/pages/vehicles/VehicleMainPage"));
const VehicleDetails = React.lazy(() => import("@/pages/vehicles/VehicleDetails"));

export const vehicleRoutes: RouteConfig[] = [
  { 
    path: "/vehicles", 
    component: VehicleMainPage, 
    protected: true 
  },
  { 
    path: "/vehicles/:id", 
    component: VehicleDetails, 
    protected: true 
  }
];
