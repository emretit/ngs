import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import LandingButton from "@/components/landing/LandingButton";

const FooterSection = () => {
  const { t } = useTranslation();
  
  const productLinks = [
    { href: "#modules", label: t("landing.footer.modules") },
    { href: "#pricing", label: t("landing.footer.pricing") },
    { href: "#", label: t("landing.footer.einvoice") },
    { href: "#", label: t("landing.footer.ai") },
  ];

  const companyLinks = [
    { href: "#", label: t("landing.footer.about") },
    { href: "#", label: t("landing.footer.career") },
    { href: "#contact", label: t("landing.footer.contact") },
    { href: "#faq", label: t("landing.footer.faq") },
  ];

  const resourceLinks = [
    { href: "#", label: t("landing.footer.blog") },
    { href: "#", label: t("landing.footer.documentation") },
    { href: "#", label: t("landing.footer.support") },
    { href: "#", label: t("landing.footer.api") },
  ];

  const socialLinks = [
    { 
      href: "#", 
      label: "Twitter",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    { 
      href: "#", 
      label: "LinkedIn",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    { 
      href: "#", 
      label: "Facebook",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
  ];

  return (
    <footer id="contact" className="scroll-mt-20 relative py-20 overflow-hidden">
      {/* Background - matching HeroSection/PricingSection style */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-red-600/10 to-orange-500/5 blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-l from-red-500/8 to-rose-600/5 blur-[80px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top CTA Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="group relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white/80">Hemen Başlayın</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                İşletmenizi <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Dönüştürmeye</span> Hazır mısınız?
              </h3>
              <p className="text-white/60 max-w-xl mx-auto mb-6">
                Ücretsiz deneme sürümüyle tüm özellikleri keşfedin, kredi kartı gerekmez.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LandingButton to="/signup" variant="primary" showArrow>
                  Ücretsiz Hesap Oluştur
                </LandingButton>
                <LandingButton href="#modules" variant="outline">
                  Modülleri İncele
                </LandingButton>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 group mb-6">
              <div className="relative">
                <img 
                  src="/logo.svg" 
                  alt="PAFTA Logo" 
                  className="h-10 w-auto transition-all duration-300 group-hover:scale-110"
                />
                <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
              {t("landing.footer.description")} 
              <span className="text-red-400 font-semibold"> {t("landing.footer.aiPowered")}</span> {t("landing.footer.platform")}
            </p>
            
            {/* Contact Info Cards */}
            <div className="space-y-3">
              <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all duration-300 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{t("landing.footer.email")}</span>
              </div>
              <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all duration-300 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{t("landing.footer.phone")}</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {[
            { title: t("landing.footer.product"), links: productLinks },
            { title: t("landing.footer.company"), links: companyLinks },
            { title: t("landing.footer.resources"), links: resourceLinks },
          ].map((column, colIndex) => (
            <div key={colIndex}>
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="group flex items-center gap-2 text-sm text-white/50 hover:text-white transition-all duration-300"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-white/40 text-xs mb-2">
                {t("landing.footer.rights")} • <span className="text-white/30">v0.4.0 Beta</span>
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-white/30">
                <a href="#" className="hover:text-red-400 transition-colors duration-300">{t("landing.footer.privacy")}</a>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <a href="#" className="hover:text-red-400 transition-colors duration-300">{t("landing.footer.terms")}</a>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <a href="#" className="hover:text-red-400 transition-colors duration-300">{t("landing.footer.cookies")}</a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="group relative"
                  aria-label={social.label}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="relative p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 hover:text-white hover:border-red-500/30 transition-all duration-300 group-hover:scale-110">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
