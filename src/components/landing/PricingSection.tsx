import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LandingButton from "@/components/landing/LandingButton";

const PricingSection = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();

  const handleSignUp = () => {
    navigate("/signup");
  };

  const plans = [
    {
      name: t("landing.pricing.plans.free.name"),
      monthlyPrice: "₺0",
      yearlyPrice: "₺0",
      description: t("landing.pricing.plans.free.description"),
      features: [
        t("landing.pricing.plans.free.features.users"),
        t("landing.pricing.plans.free.features.einvoice"),
        t("landing.pricing.plans.free.features.basicCrm"),
        t("landing.pricing.plans.free.features.customerManagement"),
        t("landing.pricing.plans.free.features.simpleReporting"),
        t("landing.pricing.plans.free.features.emailSupport")
      ],
      buttonText: t("landing.pricing.plans.free.buttonText"),
      featured: false,
      icon: "🚀",
      gradient: "from-slate-500 to-slate-600"
    },
    {
      name: t("landing.pricing.plans.business.name"),
      monthlyPrice: "₺999",
      yearlyPrice: "₺9.999",
      yearlyDiscount: t("landing.pricing.plans.business.discount"),
      description: t("landing.pricing.plans.business.description"),
      features: [
        t("landing.pricing.plans.business.features.users"),
        t("landing.pricing.plans.business.features.advancedEinvoice"),
        t("landing.pricing.plans.business.features.inventory"),
        t("landing.pricing.plans.business.features.financialReporting"),
        t("landing.pricing.plans.business.features.prioritySupport"),
        t("landing.pricing.plans.business.features.apiAccess")
      ],
      buttonText: t("landing.pricing.plans.business.buttonText"),
      featured: true,
      icon: "⭐",
      gradient: "from-red-500 to-orange-500"
    },
    {
      name: t("landing.pricing.plans.enterprise.name"),
      monthlyPrice: "",
      yearlyPrice: "",
      description: t("landing.pricing.plans.enterprise.description"),
      features: [
        t("landing.pricing.plans.enterprise.features.unlimitedUsers"),
        t("landing.pricing.plans.enterprise.features.allFeatures"),
        t("landing.pricing.plans.enterprise.features.customIntegrations"),
        t("landing.pricing.plans.enterprise.features.advancedSecurity"),
        t("landing.pricing.plans.enterprise.features.prioritySupport"),
        t("landing.pricing.plans.enterprise.features.customTraining")
      ],
      buttonText: t("landing.pricing.plans.enterprise.buttonText"),
      featured: false,
      icon: "💎",
      gradient: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <section id="pricing" className="scroll-mt-20 relative py-24 overflow-hidden">
      {/* Background - matching HeroSection style */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-red-600/15 to-orange-500/10 blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-l from-red-500/10 to-rose-600/8 blur-[80px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Background overlay removed */}
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header - matching HeroSection style */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-xl">
                <span className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent font-bold">
                    {t("landing.pricing.badge")}
                  </span>
                </span>
                <div className="w-px h-4 bg-white/20" />
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <Zap className="w-3.5 h-3.5 text-red-400" />
                  {t("landing.pricing.discount")}
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white/95">{t("landing.pricing.title1")}</span>{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                {t("landing.pricing.title2")}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
            </span>
          </h2>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center mt-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur opacity-50" />
              <div className="relative flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    !isYearly
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t("landing.pricing.monthly")}
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    isYearly
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t("landing.pricing.yearly")}
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                    -17%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              {/* Glow effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${plan.featured ? 'opacity-30' : ''}`} />
              
              <div className={`relative h-full p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 ${
                plan.featured
                  ? 'bg-white/10 border-2 border-red-500/50 shadow-2xl shadow-red-500/10'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}>
                {/* Featured badge */}
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t("landing.pricing.popular")}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <span className="text-3xl">{plan.icon}</span>
                  </div>
                </div>

                {/* Plan name */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-4">
                  {(isYearly ? plan.yearlyPrice : plan.monthlyPrice) ? (
                    <>
                      <div className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </div>
                      <div className="text-sm text-white/50 mt-1">
                        {isYearly ? t("landing.pricing.perYear") : t("landing.pricing.perMonth")}
                      </div>
                      {isYearly && plan.yearlyDiscount && (
                        <div className="inline-block mt-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                          {plan.yearlyDiscount}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-white/80">
                      İletişime Geçin
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-white/60 text-center mb-6 leading-relaxed">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-white/70 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <LandingButton
                  to="/signup"
                  variant={plan.featured ? "primary" : "outline"}
                  className={`w-full justify-center ${
                    plan.featured 
                      ? 'shadow-lg shadow-red-500/25' 
                      : ''
                  }`}
                  showArrow={plan.featured}
                >
                  {plan.buttonText}
                </LandingButton>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${plan.gradient} group-hover:w-2/3 transition-all duration-500 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
