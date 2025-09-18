
const FooterSection = () => {
  return (
    <footer id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Header ile aynı arka plan */}
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.1),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.05),transparent_60%)]"></div>

      <div className="relative mx-auto max-w-7xl z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative group">
                <img 
                  src="/logo.svg" 
                  alt="PAFTA Logo" 
                  className="h-14 w-auto transition-transform group-hover:scale-110 duration-300"
                />
                <div className="absolute -inset-2 bg-red-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
              İş süreçlerinizi modernize eden güvenilir çözüm ortağınız. 
              <span className="text-red-400 font-semibold"> AI destekli</span> işletme yönetim platformu.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300 group cursor-pointer">
                <div className="w-3 h-3 bg-red-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                <span className="group-hover:text-red-400 transition-colors duration-300">destek@pafta.app</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 group cursor-pointer">
                <div className="w-3 h-3 bg-red-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                <span className="group-hover:text-red-400 transition-colors duration-300">0212 555 0123</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-8 relative">
              Ürün
              <div className="absolute -bottom-2 left-0 w-8 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
            </h3>
            <ul className="space-y-5">
              <li><a href="#modules" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Modüller
              </a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Fiyatlandırma
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                E-fatura Entegrasyonu
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                AI Asistan
              </a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-8 relative">
              Şirket
              <div className="absolute -bottom-2 left-0 w-8 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
            </h3>
            <ul className="space-y-5">
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Hakkımızda
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Kariyer
              </a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                İletişim
              </a></li>
              <li><a href="#faq" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                SSS
              </a></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-8 relative">
              Kaynaklar
              <div className="absolute -bottom-2 left-0 w-8 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
            </h3>
            <ul className="space-y-5">
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Blog
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Dokümantasyon
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                Destek
              </a></li>
              <li><a href="#" className="text-gray-300 hover:text-red-400 transition-all duration-300 text-base group flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                API
              </a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/30 pt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-sm mb-2">
                &copy; 2024 PAFTA Platform. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-xs text-gray-500">
                <a href="#" className="hover:text-red-400 transition-colors duration-300">Gizlilik Politikası</a>
                <a href="#" className="hover:text-red-400 transition-colors duration-300">Kullanım Şartları</a>
                <a href="#" className="hover:text-red-400 transition-colors duration-300">Çerez Politikası</a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-8">
              <a href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 group">
                <div className="p-3 rounded-full bg-gray-800/50 group-hover:bg-red-500/10 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 group">
                <div className="p-3 rounded-full bg-gray-800/50 group-hover:bg-red-500/10 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-all duration-300 group">
                <div className="p-3 rounded-full bg-gray-800/50 group-hover:bg-red-500/10 group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
