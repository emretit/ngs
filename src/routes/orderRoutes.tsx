
import Orders from "@/pages/Orders";
import OrdersList from "@/pages/OrdersList";
import PurchaseManagement from "@/pages/PurchaseManagement";
import { RouteConfig } from "./types";

// Define order routes
export const orderRoutes: RouteConfig[] = [
  { path: "/orders/purchase", component: PurchaseManagement, protected: true },
  { path: "/orders/purchase/edit/:id", component: Orders, protected: true },
  { path: "/orders/create", component: Orders, protected: true },
  { path: "/orders/list", component: OrdersList, protected: true },
];
