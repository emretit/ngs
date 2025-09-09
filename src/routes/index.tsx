
import React, { Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { PublicRoute, ProtectedRoute } from "./RouteGuards";
import { appRoutes } from "./appRoutes";

interface AppRoutesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          {appRoutes.map((route) => {
            // Create route element with props for protected routes
            const RouteElement = route.protected ? (
              <ProtectedRoute>
                <route.component isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              </ProtectedRoute>
            ) : (
              <PublicRoute>
                <route.component />
              </PublicRoute>
            );

            return <Route key={route.path} path={route.path} element={RouteElement} />;
          })}
        </Routes>
      </Suspense>
    </Router>
  );
};
