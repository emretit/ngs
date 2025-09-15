import { RouteConfig } from "./types";
import VehicleList from "@/pages/vehicles/VehicleList";
import VehicleMaintenance from "@/pages/vehicles/VehicleMaintenance";
import VehicleFuel from "@/pages/vehicles/VehicleFuel";
import VehicleCosts from "@/pages/vehicles/VehicleCosts";
import VehicleDocuments from "@/pages/vehicles/VehicleDocuments";
import VehicleIncidents from "@/pages/vehicles/VehicleIncidents";

// Wrapper components to pass layout props
const VehicleListWrapper = (props: any) => <VehicleList {...props} />;
const VehicleMaintenanceWrapper = (props: any) => <VehicleMaintenance {...props} />;
const VehicleFuelWrapper = (props: any) => <VehicleFuel {...props} />;
const VehicleCostsWrapper = (props: any) => <VehicleCosts {...props} />;
const VehicleDocumentsWrapper = (props: any) => <VehicleDocuments {...props} />;
const VehicleIncidentsWrapper = (props: any) => <VehicleIncidents {...props} />;

export const vehicleRoutes: RouteConfig[] = [
  { 
    path: "/vehicles", 
    component: VehicleListWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/maintenance", 
    component: VehicleMaintenanceWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/fuel", 
    component: VehicleFuelWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/costs", 
    component: VehicleCostsWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/documents", 
    component: VehicleDocumentsWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/incidents", 
    component: VehicleIncidentsWrapper, 
    protected: true 
  }
];
