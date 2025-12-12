// Removed faqs import - now using translations directly
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const FaqSection = () => {
  const { t } = useTranslation();
  
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Light Background with subtle effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.05),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.03),transparent_60%)]"></div>
      
      <div className="relative mx-auto max-w-5xl z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-red-600/10 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 rounded-full text-red-600 font-medium text-sm backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{t("landing.faq.badge")}</span>
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {t("landing.faq.title1")}
            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
              {t("landing.faq.title2")}
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
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
          ].map((faq, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-3xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 hover:border-red-200/60 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300 leading-relaxed mb-4">
                  {faq.question}
                </h3>
                
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {faq.answer}
                </p>
              </div>
              
              {/* Bottom accent */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

              {/* Corner decoration */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="text-center mt-16">
          <div className="inline-block p-6 bg-gray-900/95 backdrop-blur-sm rounded-3xl border border-gray-700/60 shadow-lg">
            <p className="text-gray-300 mb-4">
              {t("landing.faq.moreQuestions")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{t("landing.faq.email")}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{t("landing.faq.phone")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
