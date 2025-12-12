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
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Kullanıcı giriş durumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
          // Kullanıcı giriş yapmışsa dashboard'a yönlendir
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Session kontrol hatası:", error);
      } finally {
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
          // Giriş yapıldığında dashboard'a yönlendir (invite setup değilse)
          navigate("/dashboard");
        } else if (event === 'SIGNED_OUT') {
          // Çıkış yapıldığında landing page'de kal
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);
  // Loading sırasında boş sayfa göster
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
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-red-900/40">
      {/* Dynamic dark background elements - optimized with will-change and reduced motion support */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated grid pattern */}
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.05]"></div>
        {/* Large dynamic gradient orbs - reduced from 3 to 2 */}
        <div className="absolute top-1/4 -left-1/3 w-[800px] h-[800px] bg-gradient-to-br from-red-500/30 to-rose-600/20 rounded-full blur-3xl animate-pulse opacity-70 will-change-transform motion-reduce:animate-none"></div>
        <div className="absolute top-3/4 -right-1/3 w-[700px] h-[700px] bg-gradient-to-bl from-red-400/25 to-gray-600/20 rounded-full blur-3xl animate-pulse opacity-70 will-change-transform motion-reduce:animate-none" style={{ animationDelay: '1s' }}></div>
        {/* Dynamic lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/25 to-transparent"></div>
        {/* Floating dynamic particles - reduced from 8 to 4 */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-red-500/30 rounded-full animate-pulse will-change-transform motion-reduce:animate-none" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-red-400/35 rounded-full animate-pulse will-change-transform motion-reduce:animate-none" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-4 h-4 bg-gray-500/25 rounded-full animate-pulse will-change-transform motion-reduce:animate-none" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-red-300/30 rounded-full animate-pulse will-change-transform motion-reduce:animate-none" style={{ animationDelay: '2s' }}></div>
        {/* Animated geometric shapes - reduced from 3 to 2 */}
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-red-500/20 rotate-45 animate-spin will-change-transform motion-reduce:animate-none" style={{ animationDelay: '7s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-12 h-12 border border-gray-400/20 rotate-12 animate-pulse will-change-transform motion-reduce:animate-none" style={{ animationDelay: '8s' }}></div>
      </div>
      <header className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl shadow-2xl z-50 border-b border-red-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo with Beta Badge */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="PAFTA Logo" 
                  className="h-9 w-auto transition-transform group-hover:scale-105"
                />
                <div className="absolute -inset-1 bg-red-100/50 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              {/* Beta Badge - Desktop Only */}
              <div className="hidden lg:flex items-center px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                <span className="text-xs font-semibold text-red-400">Beta</span>
              </div>
            </div>
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <a href="#modules" className="relative px-4 py-2.5 text-gray-300 hover:text-red-400 transition-all duration-200 font-medium rounded-lg hover:bg-red-500/10 group">
                <span className="relative z-10">{t('landing.header.modules')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <a href="#pricing" className="relative px-4 py-2.5 text-gray-300 hover:text-red-400 transition-all duration-200 font-medium rounded-lg hover:bg-red-500/10 group">
                <span className="relative z-10">{t('landing.header.pricing')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <a href="#faq" className="relative px-4 py-2.5 text-gray-300 hover:text-red-400 transition-all duration-200 font-medium rounded-lg hover:bg-red-500/10 group">
                <span className="relative z-10">{t('landing.header.faq')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
              <a href="#contact" className="relative px-4 py-2.5 text-gray-300 hover:text-red-400 transition-all duration-200 font-medium rounded-lg hover:bg-red-500/10 group">
                <span className="relative z-10">{t('landing.header.contact')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </a>
            </nav>
            {/* CTA Section */}
            <div className="flex items-center space-x-4">
              {/* Desktop CTA */}
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/signup" className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                  <span>{t('landing.header.freeStart')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <LoginButton />
                <LanguageSwitcher />
              </div>
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-3 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 pt-20">
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
