
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import InviteSetup from "@/pages/InviteSetup";
import ForgotPassword from "@/pages/ForgotPassword";
import SetPassword from "@/pages/SetPassword";
import { RouteConfig } from "./types";

// Define public routes
export const publicRoutes: RouteConfig[] = [
  { path: "/", component: Index, protected: false },
  { path: "/signin", component: SignIn, protected: false },
  { path: "/signup", component: SignUp, protected: false },
  { path: "/invite-setup", component: InviteSetup, protected: false },
  { path: "/forgot-password", component: ForgotPassword, protected: false },
  { path: "/set-password", component: SetPassword, protected: false },
  { path: "/reset-password", component: SetPassword, protected: false },
];
