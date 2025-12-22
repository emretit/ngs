import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Mail, Phone } from "lucide-react";

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
    <section id="faq" className="scroll-mt-20 py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0a0a0f]">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
      
      {/* Animated orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/8 blur-[100px]"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <div className="relative mx-auto max-w-6xl z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge - HeroSection style */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <HelpCircle className="w-4 h-4 text-red-400" />
              <div className="absolute inset-0 bg-red-400/50 blur-md animate-pulse" />
            </div>
            <span className="text-sm font-medium text-gray-300">{t("landing.faq.badge")}</span>
            <div className="w-px h-4 bg-white/20" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            {t("landing.faq.title1")}
            <span className="block mt-2 bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
              {t("landing.faq.title2")}
            </span>
          </h2>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t("landing.faq.subtitle")}
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="group relative p-6 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] hover:border-red-500/30 transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top glow line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent group-hover:w-full transition-all duration-500" />
              
              <div className="relative z-10">
                {/* Question number */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-400">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white group-hover:text-red-300 transition-colors duration-300 leading-relaxed mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-full transition-all duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex flex-col items-center p-6 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.05]">
            <p className="text-gray-300 text-base mb-4">
              {t("landing.faq.moreQuestions")}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Mail className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-300">{t("landing.faq.email")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Phone className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-300">{t("landing.faq.phone")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
