import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Package,
  UserCheck,
  DollarSign,
  Wrench,
  Car,
  Brain,
  Users,
  Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ModuleShowcaseSection = () => {
  const { t } = useTranslation();
  
  const modules = [
    {
      title: t("landing.modules.einvoice.title"),
      description: t("landing.modules.einvoice.description"),
      icon: Receipt,
      color: "bg-green-500/10 text-green-600",
      important: true,
      badge: t("landing.modules.einvoice.badge")
    },
    {
      title: t("landing.modules.ai.title"),
      description: t("landing.modules.ai.description"),
      icon: Brain,
      color: "bg-purple-500/10 text-purple-600",
      important: true,
      badge: t("landing.modules.ai.badge")
    },
    {
      title: t("landing.modules.sales.title"),
      description: t("landing.modules.sales.description"),
      icon: ShoppingCart,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: t("landing.modules.customers.title"),
      description: t("landing.modules.customers.description"),
      icon: Users,
      color: "bg-pink-500/10 text-pink-600"
    },
    {
      title: t("landing.modules.stock.title"),
      description: t("landing.modules.stock.description"),
      icon: Package,
      color: "bg-cyan-500/10 text-cyan-600"
    },
    {
      title: t("landing.modules.purchasing.title"),
      description: t("landing.modules.purchasing.description"),
      icon: ShoppingBag,
      color: "bg-green-500/10 text-green-600"
    },
    {
      title: t("landing.modules.hr.title"),
      description: t("landing.modules.hr.description"),
      icon: UserCheck,
      color: "bg-indigo-500/10 text-indigo-600"
    },
    {
      title: t("landing.modules.finance.title"),
      description: t("landing.modules.finance.description"),
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600"
    },
    {
      title: t("landing.modules.fieldService.title"),
      description: t("landing.modules.fieldService.description"),
      icon: Wrench,
      color: "bg-red-500/10 text-red-600"
    },
    {
      title: t("landing.modules.fleet.title"),
      description: t("landing.modules.fleet.description"),
      icon: Car,
      color: "bg-amber-500/10 text-amber-600"
    }
  ];
  
  return (
    <section id="modules" className="scroll-mt-24 py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Dark Background - Continues from Hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.05),transparent_60%)]" />
      
      <div className="relative mx-auto max-w-7xl z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-2 bg-red-600/10 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 rounded-full text-red-400 font-medium text-sm backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>{t("landing.modules.badge")}</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-relaxed font-sans">
            <span className="text-white">{t("landing.modules.title1")}</span> {t("landing.modules.title2")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl bg-gray-800/60 backdrop-blur-xl border transition-all duration-500 cursor-default overflow-hidden
                  hover:-translate-y-2 hover:rotate-1 hover:scale-[1.02]
                  ${module.important
                    ? 'border-red-500/40 hover:border-red-500/70 shadow-xl shadow-red-500/10'
                    : 'border-gray-700/50 hover:border-red-500/40 shadow-lg'
                  }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-gray-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon Glow effect */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-current opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500" style={{ color: module.color.includes('red') ? '#ef4444' : module.color.includes('green') ? '#22c55e' : module.color.includes('blue') ? '#3b82f6' : '#a855f7' }} />

                <div className="relative z-10 text-center">
                  <div className={`w-14 h-14 rounded-xl ${module.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="flex items-center justify-center mb-3 flex-wrap gap-2">
                    <h3 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors duration-300">
                      {module.title}
                    </h3>
                    {module.badge && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                        {module.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {module.description}
                  </p>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ModuleShowcaseSection;