
import React from "react";
import AuthGuard from "@/components/AuthGuard";

type RouteGuardProps = {
  children: React.ReactNode;
};

export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => children;

// Protected routes now require authentication
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => (
  <AuthGuard>{children}</AuthGuard>
);
