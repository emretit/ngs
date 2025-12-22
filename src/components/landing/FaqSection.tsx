import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Mail, Phone, Zap, MessageCircle } from "lucide-react";
import LandingButton from "@/components/landing/LandingButton";

const FaqSection = () => {
  const { t } = useTranslation();
  
  const faqs = [
    {
      question: t("landing.faq.questions.einvoice.q"),
      answer: t("landing.faq.questions.einvoice.a")
    },
    {
      question: t("landing.faq.questions.free.q"),
      answer: t("landing.faq.questions.free.a")
    },
    {
      question: t("landing.faq.questions.setup.q"),
      answer: t("landing.faq.questions.setup.a")
    },
    {
      question: t("landing.faq.questions.migration.q"),
      answer: t("landing.faq.questions.migration.a")
    },
    {
      question: t("landing.faq.questions.providers.q"),
      answer: t("landing.faq.questions.providers.a")
    },
    {
      question: t("landing.faq.questions.support.q"),
      answer: t("landing.faq.questions.support.a")
    }
  ];

  return (
    <section id="faq" className="scroll-mt-20 relative py-24 overflow-hidden">
      {/* Background - matching HeroSection/PricingSection style */}
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

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header - matching HeroSection/PricingSection style */}
        <div className="text-center mb-16 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-xl">
                <span className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <HelpCircle className="w-4 h-4 text-red-400" />
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent font-bold">
                    {t("landing.faq.badge")}
                  </span>
                </span>
                <div className="w-px h-4 bg-white/20" />
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Hızlı Cevaplar
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white/95">{t("landing.faq.title1")}</span>{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                {t("landing.faq.title2")}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
            </span>
          </h2>
          
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed mt-6">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative h-full p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/20 overflow-hidden">
                {/* Top glow line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent group-hover:w-full transition-all duration-500" />
                
                <div className="relative z-10">
                  {/* Question number */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-red-500/20">
                      <span className="text-sm font-bold text-white">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white group-hover:text-red-300 transition-colors duration-300 leading-relaxed mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-2/3 transition-all duration-500 rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="group relative inline-block">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            
            <div className="relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-red-400" />
                <p className="text-white/90 text-base font-medium">
                  {t("landing.faq.moreQuestions")}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="group/item flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 transition-all duration-300">
                  <Mail className="w-4 h-4 text-red-400 group-hover/item:scale-110 transition-transform" />
                  <span className="text-sm text-white/80">{t("landing.faq.email")}</span>
                </div>
                <div className="group/item flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 transition-all duration-300">
                  <Phone className="w-4 h-4 text-red-400 group-hover/item:scale-110 transition-transform" />
                  <span className="text-sm text-white/80">{t("landing.faq.phone")}</span>
                </div>
              </div>

              <div className="mt-6">
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
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
