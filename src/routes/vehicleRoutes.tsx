import { RouteConfig } from "./types";
import VehicleMainPage from "@/pages/vehicles/VehicleMainPage";

// Wrapper component to pass layout props
const VehicleMainPageWrapper = (props: any) => <VehicleMainPage {...props} />;

export const vehicleRoutes: RouteConfig[] = [
  { 
    path: "/vehicles", 
    component: VehicleMainPageWrapper, 
    protected: true 
  }
];
