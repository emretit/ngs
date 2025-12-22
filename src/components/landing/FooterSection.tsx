import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Mail, Phone, ArrowUpRight } from "lucide-react";

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
    <footer id="contact" className="scroll-mt-20 relative py-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 group mb-4">
              <img 
                src="/logo.svg" 
                alt="PAFTA Logo" 
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-4 max-w-xs">
              {t("landing.footer.description")} 
              <span className="text-red-400 font-medium"> {t("landing.footer.aiPowered")}</span> {t("landing.footer.platform")}
            </p>
            
            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/50">
                <Mail className="w-4 h-4 text-red-400" />
                <span>{t("landing.footer.email")}</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Phone className="w-4 h-4 text-red-400" />
                <span>{t("landing.footer.phone")}</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t("landing.footer.product")}</h3>
            <ul className="space-y-2">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-white/50 hover:text-red-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t("landing.footer.company")}</h3>
            <ul className="space-y-2">
              {companyLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-white/50 hover:text-red-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">{t("landing.footer.resources")}</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="text-sm text-white/50 hover:text-red-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-white/40">
              <span>{t("landing.footer.rights")} • v0.4.0 Beta</span>
              <a href="#" className="hover:text-red-400 transition-colors">{t("landing.footer.privacy")}</a>
              <a href="#" className="hover:text-red-400 transition-colors">{t("landing.footer.terms")}</a>
              <a href="#" className="hover:text-red-400 transition-colors">{t("landing.footer.cookies")}</a>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30 transition-all"
                  aria-label={social.label}
                >
                  {social.icon}
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
