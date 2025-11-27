import React from "react";
import { RouteConfig } from "./types";

// Lazy load all order pages
const Orders = React.lazy(() => import("@/pages/Orders"));
const OrdersList = React.lazy(() => import("@/pages/OrdersList"));
const PurchaseManagement = React.lazy(() => import("@/pages/PurchaseManagement"));
const NewOrderCreate = React.lazy(() => import("@/pages/NewOrderCreate"));

// Define order routes
export const orderRoutes: RouteConfig[] = [
  { path: "/orders/purchase", component: PurchaseManagement, protected: true },
  { path: "/orders/purchase/edit/:id", component: Orders, protected: true },
  { path: "/orders/create", component: Orders, protected: true }, // Eski - tekliften sipariş oluşturma
  { path: "/orders/new", component: NewOrderCreate, protected: true }, // Yeni - doğrudan sipariş oluşturma
  { path: "/orders/list", component: OrdersList, protected: true },
];
