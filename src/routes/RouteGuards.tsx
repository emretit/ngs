import React from "react";
import { logger } from '@/utils/logger';
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

type RouteGuardProps = {
  children: React.ReactNode;
  requiredModule?: string;
};

export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => children;

// Protected routes require authentication
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children, requiredModule }) => {
  let user, loading;
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
  } catch (error) {
    // Hot reload sırasında AuthProvider context'i kaybolabilir
    logger.warn('ProtectedRoute: Auth context not available');
    user = null;
    loading = true;
  }
  
  const navigate = useNavigate();
  const { hasModuleAccess, isLoading: permissionsLoading } = usePermissions();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);
  
  // Modül erişim kontrolü
  React.useEffect(() => {
    if (!loading && !permissionsLoading && user && requiredModule) {
      if (!hasModuleAccess(requiredModule)) {
        navigate("/");
      }
    }
  }, [user, loading, permissionsLoading, requiredModule, hasModuleAccess, navigate]);

  if (loading || permissionsLoading) {
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
