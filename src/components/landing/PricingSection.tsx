import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Removed pricingPlans import - now using translations directly
import { useTranslation } from "react-i18next";

const PricingSection = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <section id="pricing" className="scroll-mt-24 relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.08),transparent_60%)]"></div>

      <div className="relative mx-auto max-w-7xl z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-2 bg-red-600/20 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-600/30 rounded-full text-red-600 font-medium text-sm backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>{t("landing.pricing.badge")}</span>
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight font-sans">
            <span className="text-white">{t("landing.pricing.title1")}</span>
            <span className="block bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent leading-tight">
              {t("landing.pricing.title2")}
            </span>
          </h2>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center space-x-1">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isYearly
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t("landing.pricing.monthly")}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                  isYearly
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t("landing.pricing.yearly")}
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {t("landing.pricing.discount")}
                </span>
              </button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {[
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
              featured: false
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
              featured: true
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
              featured: false
            }
          ].map((plan, index) => (
            <div
              key={index}
              className={`group relative p-6 rounded-3xl bg-white/95 backdrop-blur-xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-default ${
                plan.featured
                  ? 'border-4 border-red-500/80 hover:border-red-600 ring-4 ring-red-300/30 shadow-2xl'
                  : 'border-gray-200/60 hover:border-red-200/60 shadow-lg'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>
              
              <div className="relative z-10 text-center">
                {(isYearly ? plan.yearlyPrice : plan.monthlyPrice) ? (
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </div>
                    </div>
                    {isYearly && plan.yearlyDiscount && (
                      <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full inline-block">
                        {plan.yearlyDiscount}
                      </div>
                    )}
                    {!isYearly && plan.name !== "Ücretsiz" && (
                      <div className="text-gray-500 text-xs">
                        {t("landing.pricing.perMonth")}
                      </div>
                    )}
                    {isYearly && plan.name !== "Ücretsiz" && (
                      <div className="text-gray-500 text-xs">
                        {t("landing.pricing.perYear")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <div className="text-lg font-bold group-hover:scale-110 transition-transform duration-300">💬</div>
                  </div>
                )}

                <div className="flex items-center justify-center mb-3">
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-700 transition-colors duration-300">
                    {plan.name}
                  </h3>
                  {plan.featured && (
                    <span className="ml-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                      {t("landing.pricing.popular")}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300 mb-4">
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start group/item">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center group-hover/item:bg-red-500/20 transition-colors duration-300">
                          <Check className="h-2.5 w-2.5 text-red-600" />
                        </div>
                      </div>
                      <span className="ml-3 text-xs text-gray-600 group-hover/item:text-gray-800 transition-colors duration-300 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.featured ? "default" : "outline"}
                  className={`w-full py-4 px-6 text-base font-bold transition-all duration-300 shadow-lg ${
                    plan.featured
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:text-white shadow-xl hover:shadow-2xl hover:scale-110 border-0'
                      : 'border-2 border-red-500/50 hover:bg-red-500 hover:text-white hover:border-red-600 hover:scale-110 text-red-600 bg-white shadow-md hover:shadow-xl'
                  }`}
                  onClick={handleSignUp}
                >
                  {plan.buttonText}
                </Button>
              </div>
              
              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

              {/* Corner decoration */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PricingSection;
