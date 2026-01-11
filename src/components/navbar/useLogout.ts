
import { useState } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";

export const useLogout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
    } catch (error: any) {
      // Treat any signOut error as non-fatal, continue with cleanup
      logger.warn('Logout warning:', error);
    } finally {
      toast.success("Başarıyla çıkış yapıldı.", { duration: 1000 });
      navigate("/signin", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
