
import React, { Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./RouteGuards";
import { AdminRouteGuard } from "./AdminRouteGuard";
import { appRoutes } from "./appRoutes";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import AdminLayout from "@/components/layouts/AdminLayout";

export const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          {/* Admin routes with admin layout */}
          <Route element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
            {appRoutes.filter(route => route.isAdmin).map((route) => (
              <Route key={route.path} path={route.path} element={<route.component />} />
            ))}
          </Route>

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
            {appRoutes.filter(route => route.protected && !route.isAdmin).map((route) => (
              <Route key={route.path} path={route.path} element={<route.component />} />
            ))}
          </Route>

          {/* Public routes */}
          {appRoutes.filter(route => !route.protected).map((route) => (
            <Route 
              key={route.path} 
              path={route.path} 
              element={<PublicRoute><route.component /></PublicRoute>} 
            />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
};
