import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { t } = useTranslation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Mobile Menu */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-200/30">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/30">
            <div className="flex items-center">
              <div className="relative">
                <img src="/logo.svg" alt="PAFTA Logo" className="h-8 w-auto" />
                <div className="absolute -inset-1 bg-red-100/50 rounded-full blur opacity-50"></div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <X className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            <a href="#modules" onClick={onClose} className="relative block p-4 text-gray-700 hover:text-red-700 rounded-xl transition-all duration-200 font-medium group">
              <span className="relative z-10 flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span>{t('landing.mobile.modules')}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a href="#pricing" onClick={onClose} className="relative block p-4 text-gray-700 hover:text-red-700 rounded-xl transition-all duration-200 font-medium group">
              <span className="relative z-10 flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span>{t('landing.mobile.pricing')}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a href="#faq" onClick={onClose} className="relative block p-4 text-gray-700 hover:text-red-700 rounded-xl transition-all duration-200 font-medium group">
              <span className="relative z-10 flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span>{t('landing.mobile.faq')}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a href="#contact" onClick={onClose} className="relative block p-4 text-gray-700 hover:text-red-700 rounded-xl transition-all duration-200 font-medium group">
              <span className="relative z-10 flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span>{t('landing.mobile.contact')}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <a href="/signup" onClick={onClose} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
              <span>{t('landing.mobile.freeStart')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <button 
              onClick={() => {
                onClose();
                // Navigate to login
                window.location.href = '/signin';
              }}
              className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
            >
              <span>{t('landing.mobile.login')}</span>
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default MobileMenu;
