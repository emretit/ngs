import React from "react";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";

type RouteGuardProps = {
  children: React.ReactNode;
};

export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => children;

// Protected routes require authentication
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      {children}
    </div>
  );
};
