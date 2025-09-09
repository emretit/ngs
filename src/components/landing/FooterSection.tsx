
const FooterSection = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo.svg" 
                alt="PAFTA Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold">PAFTA Platform</span>
            </div>
            <p className="text-gray-400 text-sm">
              İş süreçlerinizi modernize eden güvenilir çözüm ortağınız.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Ürün</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Özellikler</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fiyatlandırma</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Entegrasyonlar</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Şirket</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kariyer</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Kaynaklar</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Dokümantasyon</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Destek</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Bizi Takip Edin</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400 text-center">&copy; 2024 PAFTA Platform. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
