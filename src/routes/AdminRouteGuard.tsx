import React from "react";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";

type AdminRouteGuardProps = {
  children: React.ReactNode;
};

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !superAdminLoading) {
      if (!user) {
        navigate("/signin");
      } else if (!isSuperAdmin) {
        navigate("/");
      }
    }
  }, [user, loading, isSuperAdmin, superAdminLoading, navigate]);

  if (loading || superAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
};
