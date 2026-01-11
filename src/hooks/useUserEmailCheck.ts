import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserCheckResult {
  exists: boolean;
  userId?: string;
  userInfo?: {
    full_name: string | null;
    email: string;
  };
  isLoading: boolean;
  error?: string;
}

interface UseUserEmailCheckReturn {
  checkResult: UserCheckResult;
  checkUserByEmail: (email: string) => Promise<UserCheckResult>;
  resetCheck: () => void;
}

export const useUserEmailCheck = (): UseUserEmailCheckReturn => {
  const [checkResult, setCheckResult] = useState<UserCheckResult>({
    exists: false,
    isLoading: false,
  });

  const checkUserByEmail = useCallback(async (email: string): Promise<UserCheckResult> => {
    if (!email || !email.includes("@")) {
      const result: UserCheckResult = { exists: false, isLoading: false };
      setCheckResult(result);
      return result;
    }

    setCheckResult({ exists: false, isLoading: true });

    try {
      // Get current user's company_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        const result: UserCheckResult = { 
          exists: false, 
          isLoading: false, 
          error: "Oturum bulunamadı" 
        };
        setCheckResult(result);
        return result;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.user.id)
        .single();

      if (!profile?.company_id) {
        const result: UserCheckResult = { 
          exists: false, 
          isLoading: false, 
          error: "Şirket bilgisi bulunamadı" 
        };
        setCheckResult(result);
        return result;
      }

      // Check if user exists with this email in the same company
      const { data: existingUser, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", email.toLowerCase().trim())
        
        .maybeSingle();

      if (error) {
        const result: UserCheckResult = { 
          exists: false, 
          isLoading: false, 
          error: error.message 
        };
        setCheckResult(result);
        return result;
      }

      if (existingUser) {
        const result: UserCheckResult = {
          exists: true,
          userId: existingUser.id,
          userInfo: {
            full_name: existingUser.full_name,
            email: existingUser.email,
          },
          isLoading: false,
        };
        setCheckResult(result);
        return result;
      }

      const result: UserCheckResult = { exists: false, isLoading: false };
      setCheckResult(result);
      return result;
    } catch (err: any) {
      const result: UserCheckResult = { 
        exists: false, 
        isLoading: false, 
        error: err.message 
      };
      setCheckResult(result);
      return result;
    }
  }, []);

  const resetCheck = useCallback(() => {
    setCheckResult({ exists: false, isLoading: false });
  }, []);

  return {
    checkResult,
    checkUserByEmail,
    resetCheck,
  };
};

