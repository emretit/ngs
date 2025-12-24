import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Sparkles, CreditCard, HelpCircle, MessageSquare, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const menuItems = [
    { href: "#modules", label: t('landing.mobile.modules'), icon: Sparkles },
    { href: "#pricing", label: t('landing.mobile.pricing'), icon: CreditCard },
    { href: "#faq", label: t('landing.mobile.faq'), icon: HelpCircle },
    { href: "#contact", label: t('landing.mobile.contact'), icon: MessageSquare },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Mobile Menu */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
              <div className="relative">
                <img src="/logo.svg" alt="PAFTA Logo" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                <span className="text-[10px] font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">Beta</span>
              </div>
            </Link>
            <button 
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <a 
              key={item.href}
              href={item.href} 
              onClick={onClose} 
              className="relative flex items-center gap-4 p-4 text-gray-700 hover:text-red-600 rounded-2xl transition-all duration-200 font-medium group overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Active indicator */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Icon */}
              <div className="relative z-10 w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white flex items-center justify-center transition-colors duration-200 shadow-sm group-hover:shadow">
                <item.icon className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
              </div>
              
              {/* Label */}
              <span className="relative z-10 text-base">{item.label}</span>
              
              {/* Arrow */}
              <ArrowRight className="relative z-10 w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-red-500" />
            </a>
          ))}
        </nav>

        {/* Footer with CTA Buttons */}
        <div className="p-6 pt-4 border-t border-gray-100 space-y-3">
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-sm text-gray-500 font-medium">Dil / Language</span>
            <LanguageSwitcher />
          </div>

          {/* CTA Buttons */}
          <Link 
            to="/signup" 
            onClick={onClose} 
            className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/25 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{t('landing.mobile.freeStart')}</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          
          <button 
            onClick={() => {
              onClose();
              navigate('/signin');
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl transition-all duration-200 font-medium"
          >
            <span>{t('landing.mobile.login')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;