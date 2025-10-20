import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { clearAuthTokens } from "@/lib/supabase-utils";
import { useTranslation } from "react-i18next";

const LoginButton = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleClick = () => {
    if (user) {
      // User is logged in, go to dashboard
      navigate("/dashboard");
    } else {
      // User is not logged in, go to signin page
      navigate("/signin");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e: any) {
      // Only warn if it's not a session error
      if (!e.message?.includes('session_not_found') && !e.message?.includes('Session not found')) {
        console.warn('Supabase signOut failed:', e);
      }
    }
    clearAuthTokens();
    setUser(null);
    window.location.replace("/signin");
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 hidden lg:block">
          {t('landing.header.welcome')}, {user.email}
        </span>
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
        >
          <span>Dashboard</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium border border-gray-200"
        >
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
    >
      <span>{t('landing.header.login')}</span>
    </button>
  );
};

export default LoginButton;
