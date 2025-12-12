import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Brain, Zap, Shield } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useMouseParallax } from '@/hooks/useMouseParallax';

const HeroSection = () => {
  const { t } = useTranslation();
  const { tiltX, tiltY, isEnabled } = useMouseParallax({
    maxTilt: 6,
    smoothing: 0.08,
    respectReducedMotion: true,
    disableOnMobile: true,
  });

  return (
    <section 
      id="hero" 
      className="hero-stage relative min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* ===== DEEP LAYER - Grid/Space ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 hero-grid opacity-[0.04]" />
      
      {/* ===== MID LAYER - Fog Gradients with Drift ===== */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_30%_20%,rgba(220,38,38,0.2),transparent_60%)] animate-fog-drift" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_80%,rgba(220,38,38,0.12),transparent_60%)] animate-fog-drift-reverse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0),rgba(0,0,0,0.4)_100%)]" />
      
      {/* ===== LIGHT SWEEP OVERLAY ===== */}
      <div className="light-sweep-overlay" />
      
      {/* ===== NOISE OVERLAY ===== */}
      <div className="noise-overlay" />

      {/* ===== FOREGROUND - Content with 3D Transform ===== */}
      <div 
        className="relative mx-auto max-w-7xl text-center z-10"
        style={{
          transformStyle: 'preserve-3d',
          transform: isEnabled 
            ? `rotateX(${tiltX * 0.3}deg) rotateY(${tiltY * 0.3}deg)` 
            : 'none',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Dual Floating Badge */}
        <div className="flex justify-center mb-10 animate-fade-in">
          <div className="inline-flex items-center rounded-full border border-red-500/40 overflow-hidden backdrop-blur-md shadow-2xl shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-500">
            {/* Beta Version Badge */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <span className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Beta v0.4
              </span>
            </div>
            {/* Separator */}
            <div className="w-px h-7 bg-red-500/30" />
            {/* AI Badge */}
            <div className="px-5 py-2.5 bg-red-600/20 flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <span className="text-sm font-semibold text-red-400">
                {t('landing.hero.badge')}
              </span>
            </div>
          </div>
        </div>

        {/* ===== MAIN HEADING - Cinematic Typography ===== */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl font-sans mb-8 leading-[1.1]">
            <span className="block text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              {t('landing.hero.title1')}
            </span>
            <span className="block bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(220,38,38,0.4)]">
              {t('landing.hero.title2')}
            </span>
            {t('landing.hero.title3') && (
              <span className="block text-white/90 text-4xl sm:text-5xl md:text-6xl mt-2 font-bold">
                {t('landing.hero.title3')}
              </span>
            )}
          </h1>
        </div>

        {/* ===== ENHANCED CTA BUTTONS ===== */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Primary CTA - "Sisteme Gir" Feel */}
          <Link to="/signup">
            <Button
              size="lg"
              className="group relative px-10 py-6 text-xl font-bold 
                bg-gradient-to-r from-red-600 via-red-500 to-red-600 
                hover:from-red-500 hover:via-red-400 hover:to-red-500
                shadow-[0_0_40px_rgba(220,38,38,0.4)] 
                hover:shadow-[0_0_60px_rgba(220,38,38,0.6)]
                transform hover:scale-105 transition-all duration-300
                border border-red-400/30 overflow-hidden rounded-2xl"
            >
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span>{t('landing.hero.freeStart')}</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Button>
          </Link>
          
          {/* Secondary CTA - Ghost/Minimal */}
          <a href="#contact">
            <Button
              variant="ghost"
              size="lg"
              className="group px-8 py-6 text-lg font-medium
                text-gray-300 hover:text-white
                border border-gray-600/50 hover:border-red-500/50
                bg-white/5 hover:bg-white/10
                backdrop-blur-sm transition-all duration-300 rounded-2xl"
            >
              <Shield className="mr-2 h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              {t('landing.hero.detailedInfo')}
            </Button>
          </a>
        </div>

        {/* ===== FLOATING DASHBOARD PANEL ===== */}
        <div 
          className="floating-dashboard-panel relative max-w-4xl mx-auto animate-fade-in"
          style={{ 
            animationDelay: '0.6s',
            transformStyle: 'preserve-3d',
            transform: isEnabled 
              ? `rotateX(${-5 + tiltX}deg) rotateY(${3 + tiltY}deg) translateZ(50px)` 
              : 'rotateX(-5deg) rotateY(3deg)',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-red-600/30 via-red-500/20 to-red-600/30 rounded-3xl blur-2xl opacity-60" />
          
          {/* Soft Shadow */}
          <div className="absolute inset-0 translate-y-8 bg-black/40 rounded-3xl blur-3xl" />
          
          {/* Panel Container */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 - AI Powered */}
            <div className="group relative p-7 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 hover:border-red-500/50 shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default overflow-hidden">
              {/* Rim Light Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/10 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/10 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-red-500/10">
                  <Brain className="h-8 w-8" />
                </div>

                <h3 className="font-bold text-white text-base mb-2 group-hover:text-red-400 transition-colors duration-300">
                  {t('landing.hero.aiPowered')}
                </h3>

                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {t('landing.hero.aiDescription')}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full" />
            </div>

            {/* Card 2 - Modules (Featured) */}
            <div className="group relative p-7 rounded-2xl bg-gray-900/80 backdrop-blur-xl border-2 border-red-500/40 hover:border-red-500/70 shadow-2xl shadow-red-500/10 transition-all duration-500 hover:-translate-y-2 cursor-default overflow-hidden">
              {/* Rim Light Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 via-transparent to-red-500/10" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500/30 to-red-600/20 opacity-50 group-hover:opacity-100 blur-xl transition-all duration-500" />

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 text-red-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-red-500/20">
                  <span className="text-3xl font-black">10</span>
                </div>

                <h3 className="font-bold text-white text-base mb-2 group-hover:text-red-400 transition-colors duration-300">
                  {t('landing.hero.powerfulModules')}
                </h3>

                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {t('landing.hero.modulesDescription')}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full" />
            </div>

            {/* Card 3 - Free Users */}
            <div className="group relative p-7 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 hover:border-emerald-500/50 shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default overflow-hidden">
              {/* Rim Light Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/10">
                  <CheckCircle className="h-8 w-8" />
                </div>

                <h3 className="font-bold text-white text-base mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                  {t('landing.hero.freeUsers')}
                </h3>

                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {t('landing.hero.noCredit')}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:w-3/4 transition-all duration-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== HERO → MODULES TRANSITION ===== */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-gray-900/70 to-gray-900 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
