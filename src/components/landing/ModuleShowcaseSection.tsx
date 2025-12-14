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
    <section id="modules" className="scroll-mt-20 py-16 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Light Background with subtle effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.05),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.03),transparent_60%)]"></div>
      
      <div className="relative mx-auto max-w-7xl z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-1.5 bg-red-600/10 rounded-full mb-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-600/20 rounded-full text-red-600 font-medium text-xs backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span>{t("landing.modules.badge")}</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-relaxed font-sans">
            <span className="text-gray-900">{t("landing.modules.title1")}</span> {t("landing.modules.title2")}
            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent mt-1 leading-loose">
              {/* Empty - handled in title2 */}
            </span>
          </h2>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className={`group relative p-4 rounded-2xl bg-gray-900/95 backdrop-blur-xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-default ${
                  module.important
                    ? 'border-red-300/60 hover:border-red-400/80 ring-2 ring-red-200/40 shadow-xl'
                    : 'border-gray-700/60 hover:border-red-200/60 shadow-lg'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>

                <div className="relative z-10 text-center">
                  <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <div className="flex items-center justify-center mb-2">
                    <h3 className="font-bold text-white text-xs group-hover:text-red-400 transition-colors duration-300">
                      {module.title}
                    </h3>
                    {module.badge && (
                      <span className="ml-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse shadow-lg">
                        {module.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    {module.description}
                  </p>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

                {/* Corner decoration */}
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ModuleShowcaseSection;