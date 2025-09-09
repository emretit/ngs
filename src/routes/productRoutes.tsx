
import Products from "@/pages/Products";
import ProductForm from "@/pages/ProductForm";
import ProductDetails from "@/pages/ProductDetails";
import { RouteConfig } from "./types";

// Define product routes
export const productRoutes: RouteConfig[] = [
  { path: "/products", component: Products, protected: true },
  { path: "/product-form", component: ProductForm, protected: true },
  { path: "/product-form/:id", component: ProductForm, protected: true },
  { path: "/product-details/:id", component: ProductDetails, protected: true },
];
