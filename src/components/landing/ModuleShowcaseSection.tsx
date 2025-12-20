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
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ModuleShowcaseSection = () => {
  const { t } = useTranslation();
  
  const modules = [
    {
      title: t("landing.modules.einvoice.title") || "E-Fatura",
      description: t("landing.modules.einvoice.description") || "Entegre e-fatura ve e-arşiv yönetimi",
      icon: Receipt,
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-500/20",
      important: true,
      badge: t("landing.modules.einvoice.badge") || "Entegre"
    },
    {
      title: t("landing.modules.ai.title") || "Yapay Zeka",
      description: t("landing.modules.ai.description") || "AI destekli iş süreçleri optimizasyonu",
      icon: Brain,
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-500/20",
      important: true,
      badge: t("landing.modules.ai.badge") || "Yeni"
    },
    {
      title: t("landing.modules.sales.title") || "Satış",
      description: t("landing.modules.sales.description") || "Satış süreçlerini kolayca yönetin",
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-500/20"
    },
    {
      title: t("landing.modules.customers.title") || "Müşteriler",
      description: t("landing.modules.customers.description") || "CRM ve müşteri ilişkileri yönetimi",
      icon: Users,
      gradient: "from-pink-500 to-rose-600",
      iconBg: "bg-pink-500/20"
    },
    {
      title: t("landing.modules.stock.title") || "Stok",
      description: t("landing.modules.stock.description") || "Envanter ve depo yönetimi",
      icon: Package,
      gradient: "from-cyan-500 to-teal-600",
      iconBg: "bg-cyan-500/20"
    },
    {
      title: t("landing.modules.purchasing.title") || "Satın Alma",
      description: t("landing.modules.purchasing.description") || "Tedarik zinciri optimizasyonu",
      icon: ShoppingBag,
      gradient: "from-green-500 to-lime-600",
      iconBg: "bg-green-500/20"
    },
    {
      title: t("landing.modules.hr.title") || "İnsan Kaynakları",
      description: t("landing.modules.hr.description") || "Personel ve bordro yönetimi",
      icon: UserCheck,
      gradient: "from-indigo-500 to-blue-600",
      iconBg: "bg-indigo-500/20"
    },
    {
      title: t("landing.modules.finance.title") || "Finans",
      description: t("landing.modules.finance.description") || "Muhasebe ve finansal raporlama",
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-500/20"
    },
    {
      title: t("landing.modules.fieldService.title") || "Saha Servisi",
      description: t("landing.modules.fieldService.description") || "Teknik servis ve bakım yönetimi",
      icon: Wrench,
      gradient: "from-red-500 to-orange-600",
      iconBg: "bg-red-500/20"
    },
    {
      title: t("landing.modules.fleet.title") || "Araç Filosu",
      description: t("landing.modules.fleet.description") || "Filo ve araç takip sistemi",
      icon: Car,
      gradient: "from-amber-500 to-yellow-600",
      iconBg: "bg-amber-500/20"
    }
  ];
  
  return (
    <section id="modules" className="relative py-24 overflow-hidden bg-background">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center mb-6">
            <div className="group relative">
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("landing.modules.badge") || "Güçlü Modüller"}
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">{t("landing.modules.title1") || "İşletmeniz İçin"}</span>{" "}
            <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
              {t("landing.modules.title2") || "Tüm Modüller"}
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tüm iş süreçlerinizi tek bir platformda yönetin. 
            Her modül birbiriyle entegre çalışır.
          </p>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${module.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                
                <div className={`relative p-5 rounded-2xl bg-card border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  module.important
                    ? 'border-primary/30 hover:border-primary/50'
                    : 'border-border hover:border-primary/30'
                }`}>
                  {/* Badge for important modules */}
                  {module.badge && (
                    <div className="absolute -top-2 -right-2">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-primary to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                        {module.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${module.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-r ${module.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors duration-300">
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${module.gradient} group-hover:w-2/3 transition-all duration-500 rounded-full`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ModuleShowcaseSection;
