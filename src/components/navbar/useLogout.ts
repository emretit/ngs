
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/auth/AuthContext";

export const useLogout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
    } catch (error: any) {
      // Treat any signOut error as non-fatal, continue with cleanup
      console.warn('Logout warning:', error);
    } finally {
      toast({
        title: "Başarılı",
        description: "Başarıyla çıkış yapıldı.",
      });
      navigate("/signin", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return {
    handleLogout,
    isLoggingOut
  };
};
