
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Authentication disabled - no auth checks
  useEffect(() => {
    setUser(null);
    setLoading(false);
  }, []);

  // Calculate user initials from name or email
  const getUserInitials = () => {
    if (!user) return "";
    
    return user.user_metadata?.full_name 
      ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
      : user.email?.substring(0, 2).toUpperCase() || "UK";
  };

  // Check if user is a primary account
  const isPrimaryAccount = () => {
    if (!user) return false;
    return user.user_metadata?.is_primary_account === true;
  };

  // Get company name
  const getCompanyName = () => {
    if (!user) return "";
    return user.user_metadata?.company_name || "";
  };

  return {
    user,
    loading,
    userInitials: getUserInitials(),
    isPrimaryAccount: isPrimaryAccount(),
    companyName: getCompanyName()
  };
};
