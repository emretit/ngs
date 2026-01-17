import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, BarChart3, Users, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import LandingButton from "@/components/landing/LandingButton";
import { DashboardMockup } from "./mockups/DashboardMockup";

const HeroSection = () => {
  const { t } = useTranslation();

  const floatingIcons = [
    { icon: BarChart3, delay: 0, x: "10%", y: "20%" },
    { icon: Users, delay: 0.5, x: "85%", y: "15%" },
    { icon: Shield, delay: 1, x: "5%", y: "70%" },
    { icon: Globe, delay: 1.5, x: "90%", y: "65%" },
  ];

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-red-600/20 to-orange-500/10 blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-red-500/15 to-rose-600/10 blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-purple-600/10 to-red-500/5 blur-[150px]"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Background overlay removed */}
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Floating 3D icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.4,
            scale: 1,
            y: [0, -20, 0],
          }}
          transition={{ 
            delay: item.delay,
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
            <item.icon className="w-8 h-8 text-red-400/60" />
          </div>
        </motion.div>
      ))}

      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            {/* Announcement badge */}
            <div className="inline-flex items-center mb-8 animate-fade-in">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
                <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-xl">
                  <span className="flex items-center gap-2 text-sm font-medium text-white/90">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent font-bold">
                      Beta v0.4
                    </span>
                  </span>
                  <div className="w-px h-4 bg-white/20" />
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                    {t('landing.hero.badge') || 'Yapay Zeka Destekli'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main headline with animated gradient */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                <span className="block text-white/95 mb-2">{t('landing.hero.title1') || 'İşletmenizi Yönetin'}</span>
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    {t('landing.hero.title2') || 'Tek Platformda'}
                  </span>
                  {/* Underline decoration */}
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-scale-in" style={{ animationDelay: '1s' }} />
                </span>
                {(t('landing.hero.title3') || '') && (
                  <span className="block text-white/95 mt-2">{t('landing.hero.title3')}</span>
                )}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Yapay zeka destekli ERP sistemi ile işletmenizi geleceğe taşıyın. 
              Tüm iş süreçlerinizi tek platformda yönetin.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <LandingButton 
                to="/signup" 
                variant="primary"
                showArrow
                className="px-8 py-6 text-lg shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_60px_rgba(239,68,68,0.4)]"
              >
                {t('landing.hero.freeStart') || 'Ücretsiz Başla'}
              </LandingButton>
              <LandingButton 
                href="#modules" 
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                Modülleri Keşfet
              </LandingButton>
            </div>

            {/* Stats/Trust indicators */}
            <div 
              className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.8s' }}
            >
              {[
                { value: "10+", label: t('landing.hero.powerfulModules') || 'Güçlü Modül', icon: "📦" },
                { value: "AI", label: t('landing.hero.aiPowered') || 'Yapay Zeka', icon: "🧠" },
                { value: "∞", label: t('landing.hero.freeUsers') || 'Sınırsız Kullanıcı', icon: "👥" },
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="group relative hover:scale-105 transition-transform duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/50">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Dashboard Mockup */}
          <motion.div 
            className="hidden lg:block relative"
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Glow effect behind mockup */}
            <div className="absolute -inset-8 bg-gradient-to-r from-red-500/20 via-orange-500/10 to-red-500/20 blur-3xl rounded-3xl" />
            
            {/* 3D perspective wrapper */}
            <div className="relative transform perspective-1000 hover:scale-[1.02] transition-transform duration-500">
              <div className="transform rotate-y-[-2deg] rotate-x-[2deg]">
                <DashboardMockup variant="large" className="shadow-[0_0_80px_rgba(0,0,0,0.5)]" />
              </div>
            </div>

            {/* Floating decoration elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-full blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
