import React from "react";
import { RouteConfig } from "./types";

// Lazy load all public pages
const Index = React.lazy(() => import("@/pages/Index"));
const LandingV2 = React.lazy(() => import("@/pages/LandingV2"));
const SignIn = React.lazy(() => import("@/pages/SignIn"));
const SignUp = React.lazy(() => import("@/pages/SignUp"));
const InviteSetup = React.lazy(() => import("@/pages/InviteSetup"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const SetPassword = React.lazy(() => import("@/pages/SetPassword"));
const PrivacyPolicy = React.lazy(() => import("@/pages/PrivacyPolicy"));

// Define public routes
export const publicRoutes: RouteConfig[] = [
  { path: "/", component: Index, protected: false },
  { path: "/landing-v2", component: LandingV2, protected: false },
  { path: "/signin", component: SignIn, protected: false },
  { path: "/signup", component: SignUp, protected: false },
  { path: "/invite-setup", component: InviteSetup, protected: false },
  { path: "/forgot-password", component: ForgotPassword, protected: false },
  { path: "/set-password", component: SetPassword, protected: false },
  { path: "/reset-password", component: SetPassword, protected: false },
  { path: "/privacy-policy", component: PrivacyPolicy, protected: false },
];
