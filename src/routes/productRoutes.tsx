import React from "react";
import { RouteConfig } from "./types";

// Lazy load all product pages
const Products = React.lazy(() => import("@/pages/Products"));
const ProductForm = React.lazy(() => import("@/pages/ProductForm"));
const ProductDetails = React.lazy(() => import("@/pages/ProductDetails"));

// Define product routes
export const productRoutes: RouteConfig[] = [
  { path: "/products", component: Products, protected: true },
  { path: "/product-form", component: ProductForm, protected: true },
  { path: "/product-form/:id", component: ProductForm, protected: true },
  { path: "/product-details/:id", component: ProductDetails, protected: true },
];
