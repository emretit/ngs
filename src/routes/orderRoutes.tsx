
import Orders from "@/pages/Orders";
import OrdersList from "@/pages/OrdersList";
import PurchaseManagement from "@/pages/PurchaseManagement";
import NewOrderCreate from "@/pages/NewOrderCreate";
import { RouteConfig } from "./types";

// Define order routes
export const orderRoutes: RouteConfig[] = [
  { path: "/orders/purchase", component: PurchaseManagement, protected: true },
  { path: "/orders/purchase/edit/:id", component: Orders, protected: true },
  { path: "/orders/create", component: Orders, protected: true }, // Eski - tekliften sipariş oluşturma
  { path: "/orders/new", component: NewOrderCreate, protected: true }, // Yeni - doğrudan sipariş oluşturma
  { path: "/orders/list", component: OrdersList, protected: true },
];
