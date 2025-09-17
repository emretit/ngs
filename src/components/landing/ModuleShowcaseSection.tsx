import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Package,
  UserCheck,
  DollarSign,
  Wrench,
  Car,
  Brain,
  Users,
  Zap
} from "lucide-react";

const modules = [
  {
    title: "E-Fatura Entegrasyonu",
    description: "Nilvera entegrasyonu ile otomatik e-fatura gönderimi ve alma. Yasal uyumluluk garantili.",
    icon: Receipt,
    color: "bg-green-500/10 text-green-600",
    important: true
  },
  {
    title: "AI Asistan",
    description: "Yapay zeka destekli iş süreçleri, akıllı öneriler ve otomatik veri analizi.",
    icon: Brain,
    color: "bg-purple-500/10 text-purple-600",
    important: true
  },
  {
    title: "Satış Yönetimi",
    description: "Fırsatları takip edin, teklifler oluşturun ve satış süreçlerinizi optimize edin.",
    icon: ShoppingCart,
    color: "bg-blue-500/10 text-blue-600"
  },
  {
    title: "Müşteriler ve Tedarikçiler",
    description: "Müşteri ilişkileri yönetimi ve tedarikçi süreçlerinin optimize edilmesi.",
    icon: Users,
    color: "bg-pink-500/10 text-pink-600"
  },
  {
    title: "Stok ve Depo",
    description: "Envanter takibi, depo yönetimi ve otomatik sipariş noktaları.",
    icon: Package,
    color: "bg-cyan-500/10 text-cyan-600"
  },
  {
    title: "Satın Alma",
    description: "Tedarikçi ilişkilerini yönetin ve sipariş süreçlerini otomatikleştirin.",
    icon: ShoppingBag,
    color: "bg-green-500/10 text-green-600"
  },
  {
    title: "İnsan Kaynakları",
    description: "Personel yönetimi, bordro, izin takibi ve performans değerlendirme.",
    icon: UserCheck,
    color: "bg-indigo-500/10 text-indigo-600"
  },
  {
    title: "Finans Yönetimi",
    description: "Muhasebe, nakit akışı yönetimi ve finansal raporlama.",
    icon: DollarSign,
    color: "bg-emerald-500/10 text-emerald-600"
  },
  {
    title: "Saha Servis",
    description: "Teknik servis talepleri, saha hizmetleri ve teknisyen yönetimi.",
    icon: Wrench,
    color: "bg-red-500/10 text-red-600"
  },
  {
    title: "Araç Yönetimi",
    description: "Filo yönetimi, bakım takibi, yakıt kontrolü ve maliyet analizi.",
    icon: Car,
    color: "bg-amber-500/10 text-amber-600"
  }
];

const ModuleShowcaseSection = () => {
  return (
    <section id="modules" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Light Background with subtle effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.05),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.03),transparent_60%)]"></div>
      
      <div className="relative mx-auto max-w-7xl z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-2 bg-red-600/10 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 rounded-full text-red-600 font-medium text-sm backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Kapsamlı Modül Paketi</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-relaxed font-sans">
            <span className="text-gray-900">AI Destekli</span> Her İhtiyacınız İçin
            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent mt-1 leading-loose">
              Akıllı&nbsp;Çözümler
            </span>
          </h2>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-3xl bg-gray-900/95 backdrop-blur-xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                  module.important
                    ? 'border-red-300/60 hover:border-red-400/80 ring-2 ring-red-200/40 shadow-xl'
                    : 'border-gray-700/60 hover:border-red-200/60 shadow-lg'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-gray-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-100/30 to-gray-100/30 opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500"></div>

                <div className="relative z-10 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${module.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                    <Icon className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  <div className="flex items-center justify-center mb-3">
                    <h3 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors duration-300">
                      {module.title}
                    </h3>
                    {index === 0 && (
                      <span className="ml-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                        ÜCRETSİZ
                      </span>
                    )}
                    {index === 1 && (
                      <span className="ml-2 px-3 py-1 bg-red-700 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                        YENİ
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    {module.description}
                  </p>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-red-600 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>

                {/* Corner decoration */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-red-500/30 rounded-full group-hover:bg-red-500/60 transition-colors duration-300"></div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ModuleShowcaseSection;