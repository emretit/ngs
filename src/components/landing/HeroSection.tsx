
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, CheckCircle, TrendingUp, Sparkles, Star, Brain, Cpu } from "lucide-react";
import { useTranslation } from 'react-i18next';

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      {/* Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.08),transparent_60%)]"></div>

      <div className="relative mx-auto max-w-7xl text-center z-10">
        {/* Dual Floating Badge */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="inline-flex items-center rounded-full border border-red-500/30 overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse">
            {/* Beta Version Badge */}
            <div className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center gap-1.5">
              <span className="text-base">🚀</span>
              <span className="text-xs font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Beta v0.4
              </span>
            </div>
            {/* Separator */}
            <div className="w-px h-5 bg-red-500/30"></div>
            {/* AI Badge */}
            <div className="px-3 py-1.5 bg-red-600/20 flex items-center gap-1.5">
              <span className="text-base">🧠</span>
              <span className="text-xs font-semibold text-red-600">
                {t('landing.hero.badge')}
              </span>
            </div>
          </div>
        </div>

        {/* Main Heading with gradient text */}
        <div className="animate-fade-in delay-200">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-sans mb-6 leading-tight">
            <span className="block text-white">{t('landing.hero.title1')}</span>
            <span className="block bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              {t('landing.hero.title2')}
            </span>
            {t('landing.hero.title3') && <span className="block text-white">{t('landing.hero.title3')}</span>}
          </h1>
        </div>


        {/* Enhanced CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 animate-fade-in delay-400">
          <Link to="/signup">
            <Button
              size="default"
              className="group px-6 py-3 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center">
                {t('landing.hero.freeStart')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
          <a href="#contact">
            <Button
              variant="outline"
              size="default"
              className="group px-6 py-3 text-base border-2 border-primary/30 hover:bg-primary/5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('landing.hero.detailedInfo')}
            </Button>
          </a>
        </div>

        {/* Advanced Module Style Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in delay-600">
          <div className="group relative p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/60 hover:border-red-200/60 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-default">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>

            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Brain className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-center mb-2">
                <h3 className="font-bold text-gray-800 text-xs group-hover:text-red-700 transition-colors duration-300">
                  {t('landing.hero.aiPowered')}
                </h3>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {t('landing.hero.aiDescription')}
              </p>
            </div>

            {/* Bottom accent */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

            {/* Corner decoration */}
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
          </div>

          <div className="group relative p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-red-300/60 hover:border-red-400/80 ring-2 ring-red-200/40 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-default">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>

            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">10</div>
              </div>

              <div className="flex items-center justify-center mb-2">
                <h3 className="font-bold text-gray-800 text-xs group-hover:text-red-700 transition-colors duration-300">
                  {t('landing.hero.powerfulModules')}
                </h3>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {t('landing.hero.modulesDescription')}
              </p>
            </div>

            {/* Bottom accent */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

            {/* Corner decoration */}
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
          </div>

          <div className="group relative p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/60 hover:border-red-200/60 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-default">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>

            <div className="relative z-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <CheckCircle className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div className="flex items-center justify-center mb-2">
                <h3 className="font-bold text-gray-800 text-xs group-hover:text-red-700 transition-colors duration-300">
                  {t('landing.hero.freeUsers')}
                </h3>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {t('landing.hero.noCredit')}
              </p>
            </div>

            {/* Bottom accent */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

            {/* Corner decoration */}
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
