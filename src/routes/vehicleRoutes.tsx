import { RouteConfig } from "./types";
import VehicleList from "@/pages/vehicles/VehicleList";
import VehicleMaintenance from "@/pages/vehicles/VehicleMaintenance";
import VehicleFuel from "@/pages/vehicles/VehicleFuel";
import VehicleCosts from "@/pages/vehicles/VehicleCosts";
import VehicleDocuments from "@/pages/vehicles/VehicleDocuments";
import VehicleIncidents from "@/pages/vehicles/VehicleIncidents";

export const vehicleRoutes: RouteConfig[] = [
  { 
    path: "/vehicles", 
    component: VehicleList, 
    protected: true 
  },
  { 
    path: "/vehicles/maintenance", 
    component: VehicleMaintenance, 
    protected: true 
  },
  { 
    path: "/vehicles/fuel", 
    component: VehicleFuel, 
    protected: true 
  },
  { 
    path: "/vehicles/costs", 
    component: VehicleCosts, 
    protected: true 
  },
  { 
    path: "/vehicles/documents", 
    component: VehicleDocuments, 
    protected: true 
  },
  { 
    path: "/vehicles/incidents", 
    component: VehicleIncidents, 
    protected: true 
  }
];
