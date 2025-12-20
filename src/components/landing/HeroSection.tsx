import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, BarChart3, Users, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import LandingButton from "@/components/landing/LandingButton";

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

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
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
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Announcement badge */}
          <motion.div 
            className="inline-flex items-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
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
                  {t('landing.hero.badge')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Main headline with animated gradient */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="block text-white/95 mb-2">{t('landing.hero.title1')}</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  {t('landing.hero.title2')}
                </span>
                {/* Underline decoration */}
                <motion.div 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                />
              </span>
              {t('landing.hero.title3') && (
                <span className="block text-white/95 mt-2">{t('landing.hero.title3')}</span>
              )}
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Yapay zeka destekli ERP sistemi ile işletmenizi geleceğe taşıyın. 
            Tüm iş süreçlerinizi tek platformda yönetin.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <LandingButton 
              to="/signup" 
              variant="primary"
              showArrow
              className="px-8 py-6 text-lg shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_60px_rgba(239,68,68,0.4)]"
            >
              {t('landing.hero.freeStart')}
            </LandingButton>
            <LandingButton 
              href="#modules" 
              variant="outline"
              className="px-8 py-6 text-lg"
            >
              Modülleri Keşfet
            </LandingButton>
          </motion.div>

          {/* Stats/Trust indicators */}
          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            {[
              { value: "10+", label: t('landing.hero.powerfulModules'), icon: "📦" },
              { value: "AI", label: t('landing.hero.aiPowered'), icon: "🧠" },
              { value: "∞", label: t('landing.hero.freeUsers'), icon: "👥" },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="group relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1.5, duration: 0.5 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <a href="#modules" className="flex flex-col items-center gap-2 text-white/40 hover:text-white/60 transition-colors">
              <span className="text-xs uppercase tracking-widest">Keşfet</span>
              <div className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-2">
                <motion.div 
                  className="w-1 h-2 bg-current rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
