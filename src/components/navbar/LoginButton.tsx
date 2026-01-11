import { useNavigate } from "react-router-dom";
import { logger } from '@/utils/logger';
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
        logger.warn('Supabase signOut failed:', e);
      }
    }
    clearAuthTokens();
    setUser(null);
    navigate("/signin", { replace: true });
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/70 hidden lg:block">
          {t('landing.header.welcome')}, {user.email}
        </span>
        <button 
          onClick={() => navigate("/dashboard")}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
        >
          <span className="relative z-10">Dashboard</span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/20 text-white text-sm font-medium hover:bg-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
        >
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
    >
      <span className="relative z-10">{t('landing.header.login')}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default LoginButton;
