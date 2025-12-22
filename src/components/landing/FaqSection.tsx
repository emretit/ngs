import { useTranslation } from "react-i18next";
import { HelpCircle, Sparkles, Mail, Phone, MessageCircle } from "lucide-react";
import LandingButton from "@/components/landing/LandingButton";

const FaqSection = () => {
  const { t } = useTranslation();
  
  const faqs = [
    {
      question: t("landing.faq.questions.einvoice.q"),
      answer: t("landing.faq.questions.einvoice.a"),
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-500/20"
    },
    {
      question: t("landing.faq.questions.free.q"),
      answer: t("landing.faq.questions.free.a"),
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-500/20"
    },
    {
      question: t("landing.faq.questions.setup.q"),
      answer: t("landing.faq.questions.setup.a"),
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-500/20"
    },
    {
      question: t("landing.faq.questions.migration.q"),
      answer: t("landing.faq.questions.migration.a"),
      gradient: "from-pink-500 to-rose-600",
      iconBg: "bg-pink-500/20"
    },
    {
      question: t("landing.faq.questions.providers.q"),
      answer: t("landing.faq.questions.providers.a"),
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/20"
    },
    {
      question: t("landing.faq.questions.support.q"),
      answer: t("landing.faq.questions.support.a"),
      gradient: "from-red-500 to-rose-600",
      iconBg: "bg-red-500/20"
    }
  ];

  return (
    <section id="faq" className="scroll-mt-20 relative py-24 overflow-hidden bg-background">
      {/* Grid Background - matching ModuleShowcase style */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header - matching ModuleShowcase style */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center mb-6">
            <div className="group relative">
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {t("landing.faq.badge")}
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">{t("landing.faq.title1")}</span>{" "}
            <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
              {t("landing.faq.title2")}
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        {/* FAQ Grid - matching ModuleShowcase card style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow effect on hover */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${faq.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
              
              <div className="relative h-full p-5 rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                {/* Question number */}
                <div className={`w-10 h-10 rounded-xl ${faq.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-sm font-bold text-foreground">{index + 1}</span>
                </div>

                {/* Question */}
                <h3 className="font-semibold text-foreground text-sm mb-3 group-hover:text-primary transition-colors duration-300 leading-relaxed">
                  {faq.question}
                </h3>

                {/* Answer */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r ${faq.gradient} group-hover:w-2/3 transition-all duration-500 rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA - matching style */}
        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="group relative inline-block">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            
            <div className="relative p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-primary" />
                <p className="text-foreground text-base font-medium">
                  {t("landing.faq.moreQuestions")}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <div className="group/item flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <Mail className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                  <span className="text-sm text-muted-foreground">{t("landing.faq.email")}</span>
                </div>
                <div className="group/item flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <Phone className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                  <span className="text-sm text-muted-foreground">{t("landing.faq.phone")}</span>
                </div>
              </div>

              <LandingButton
                to="/signup"
                variant="primary"
                showArrow
              >
                Hemen Başlayın
              </LandingButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
