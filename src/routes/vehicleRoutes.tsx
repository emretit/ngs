import { RouteConfig } from "./types";
import VehicleMainPage from "@/pages/vehicles/VehicleMainPage";
import VehicleDetails from "@/pages/vehicles/VehicleDetails";

// Wrapper components to pass layout props
const VehicleMainPageWrapper = (props: any) => <VehicleMainPage {...props} />;
const VehicleDetailsWrapper = (props: any) => <VehicleDetails {...props} />;

export const vehicleRoutes: RouteConfig[] = [
  { 
    path: "/vehicles", 
    component: VehicleMainPageWrapper, 
    protected: true 
  },
  { 
    path: "/vehicles/:id", 
    component: VehicleDetailsWrapper, 
    protected: true 
  }
];
