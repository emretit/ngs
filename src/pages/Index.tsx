import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/landing/HeroSection";
import ModuleShowcaseSection from "@/components/landing/ModuleShowcaseSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import FooterSection from "@/components/landing/FooterSection";
import LoginButton from "@/components/navbar/LoginButton";
import MobileMenu from "@/components/landing/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import LandingButton from "@/components/landing/LandingButton";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Kullanıcı giriş durumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Timeout ile session kontrolü - 2 saniye içinde tamamlanmazsa devam et
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) => 
          setTimeout(() => resolve({ data: { session: null } }), 2000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { data: { session } } = result;
        
        // Eğer invite-setup sayfasına yönlendirme varsa (URL'de access_token), bekle
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasInviteToken = hashParams.get("access_token") && hashParams.get("type");
        const isInviteSetupPath = window.location.pathname === '/invite-setup';
        if (hasInviteToken || isInviteSetupPath) {
          console.log('Invite token detected or on invite-setup page, not redirecting to dashboard');
          setLoading(false);
          return;
        }
        if (session) {
          // Kullanıcı giriş yapmışsa session state'ini set et ve dashboard'a yönlendir
          setHasSession(true);
          navigate("/dashboard");
          return;
        }
        // Session yoksa loading'i false yap
        setLoading(false);
      } catch (error) {
        console.error("Session kontrol hatası:", error);
        // Hata durumunda da loading'i false yap
        setLoading(false);
      }
    };
    checkSession();
    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Invite setup sürecindeyse otomatik yönlendirmeyi engelle
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasInviteToken = hashParams.get("access_token");
        const isInviteSetupPath = window.location.pathname === '/invite-setup';
        if (event === 'SIGNED_IN' && session && !hasInviteToken && !isInviteSetupPath) {
          // Giriş yapıldığında session state'ini set et ve dashboard'a yönlendir
          setHasSession(true);
          navigate("/dashboard");
        } else if (event === 'SIGNED_OUT') {
          // Çıkış yapıldığında landing page'de kal
          setHasSession(false);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);
  // Loading veya session varsa boş sayfa göster (yönlendirme yapılacak)
  if (loading || hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Modern Glassmorphism Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto px-6 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <img 
                    src="/logo.svg" 
                    alt="PAFTA Logo" 
                    className="h-8 w-auto transition-all duration-300 group-hover:scale-110"
                  />
                  <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent uppercase tracking-wider">Beta</span>
                </div>
              </Link>

              {/* Navigation - Pill Style */}
              <nav className="hidden lg:flex items-center bg-white/[0.02] rounded-full p-1 border border-white/5">
                {[
                  { href: "#modules", label: t('landing.header.modules') },
                  { href: "#pricing", label: t('landing.header.pricing') },
                  { href: "#faq", label: t('landing.header.faq') },
                  { href: "#contact", label: t('landing.header.contact') },
                ].map((item) => (
                  <a 
                    key={item.href}
                    href={item.href} 
                    className="relative px-5 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/5"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* CTA Section */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3">
                  <LoginButton />
                  <LandingButton 
                    to="/signup" 
                    variant="primary"
                    showArrow
                  >
                    {t('landing.header.freeStart')}
                  </LandingButton>
                  <LanguageSwitcher />
                </div>
                
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 pt-16">
        <HeroSection />
        <ModuleShowcaseSection />
        <PricingSection />
        <FaqSection />
        <FooterSection />
      </main>
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </div>
  );
};
export default Index;
