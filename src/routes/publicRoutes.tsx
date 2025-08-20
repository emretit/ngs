
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import { RouteConfig } from "./types";

// Define public routes
export const publicRoutes: RouteConfig[] = [
  { path: "/", component: Index, protected: false },
  { path: "/auth", component: Auth, protected: false },
  { path: "/signin", component: SignIn, protected: false },
  { path: "/signup", component: SignUp, protected: false },
  { path: "/forgot-password", component: ForgotPassword, protected: false },
];
