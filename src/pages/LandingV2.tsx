import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Wallet, 
  Building2, 
  TrendingUp, 
  Package, 
  BarChart3,
  Shield,
  Cloud,
  Smartphone,
  Zap,
  Clock,
  Globe,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  Layers,
  Database,
  Lock,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Module cards data
const modules = [
  {
    icon: Users,
    title: "CRM & Satış",
    description: "Müşteri ilişkilerini yönetin, satış fırsatlarını takip edin, teklif ve siparişleri kolayca oluşturun.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Wallet,
    title: "Finans & Muhasebe",
    description: "Gelir-gider takibi, fatura yönetimi, banka hesapları ve nakit akışını tek yerden kontrol edin.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Building2,
    title: "İK & PDKS",
    description: "Personel yönetimi, izin takibi, puantaj ve bordro süreçlerini dijitalleştirin.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: TrendingUp,
    title: "Saha Servisi",
    description: "Saha ekiplerini yönetin, iş emirleri oluşturun, lokasyon bazlı takip yapın.",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: Package,
    title: "Satın Alma & Stok",
    description: "Tedarikçi yönetimi, sipariş takibi, depo ve envanter kontrolü.",
    color: "from-rose-500 to-pink-500"
  },
  {
    icon: BarChart3,
    title: "Raporlama & Analitik",
    description: "Gerçek zamanlı dashboard'lar, detaylı raporlar ve veri analitiği.",
    color: "from-indigo-500 to-blue-500"
  }
];

// Features for all-in-one section
const allInOneFeatures = [
  "Tek veri kaynağı, tutarlı bilgi",
  "Excel kaosuna son",
  "Gerçek zamanlı görünürlük",
  "Tüm departmanlar entegre",
  "Otomatik veri senkronizasyonu",
  "Merkezi yönetim paneli"
];

// Advantage cards
const advantages = [
  {
    icon: Shield,
    title: "Rol Bazlı Erişim",
    description: "Her kullanıcıya özel yetki ve erişim seviyeleri tanımlayın."
  },
  {
    icon: Clock,
    title: "Gerçek Zamanlı Raporlar",
    description: "Anlık verilerle karar alma süreçlerinizi hızlandırın."
  },
  {
    icon: Building2,
    title: "Çoklu Şirket Desteği",
    description: "Birden fazla şirketi tek panelden yönetin."
  },
  {
    icon: Cloud,
    title: "Bulut Tabanlı",
    description: "Her yerden erişim, otomatik yedekleme, sıfır bakım."
  },
  {
    icon: Lock,
    title: "Güvenli & Ölçeklenebilir",
    description: "Kurumsal seviye güvenlik, büyümenize eşlik eden altyapı."
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu",
    description: "Tüm cihazlardan tam fonksiyonel erişim."
  }
];

// Testimonials
const testimonials = [
  {
    name: "Ahmet Yılmaz",
    role: "Genel Müdür",
    company: "TechnoServ A.Ş.",
    content: "Pafta ile tüm iş süreçlerimizi tek platformda yönetiyoruz. Artık farklı yazılımlar arasında kaybolmuyoruz.",
    avatar: "AY"
  },
  {
    name: "Zeynep Kaya",
    role: "Finans Direktörü",
    company: "GreenLogistics",
    content: "Nakit akışı takibi ve raporlama özellikleri muhteşem. Karar alma süreçlerimiz çok hızlandı.",
    avatar: "ZK"
  },
  {
    name: "Mehmet Demir",
    role: "Operasyon Müdürü",
    company: "FieldPro Hizmetler",
    content: "Saha ekibi yönetimi artık çok kolay. Gerçek zamanlı takip ve raporlama ile verimliliğimiz arttı.",
    avatar: "MD"
  }
];

const LandingV2 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Pafta" className="h-8 w-auto" />
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50">
                V2 Experimental
              </Badge>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#modules" className="text-sm text-slate-600 hover:text-amber-600 transition-colors">Modüller</a>
              <a href="#features" className="text-sm text-slate-600 hover:text-amber-600 transition-colors">Özellikler</a>
              <a href="#testimonials" className="text-sm text-slate-600 hover:text-amber-600 transition-colors">Referanslar</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Giriş Yap
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25">
                  Ücretsiz Başla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                <Zap className="w-3 h-3 mr-1" />
                Yeni Nesil İş Yönetim Platformu
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
            >
              Tüm İş Süreçleriniz{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Tek Platformda
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
            >
              ERP, CRM, İK, PDKS ve Finans modüllerini birleştiren hepsi bir arada çözüm. 
              İşinizi büyütürken operasyonlarınızı sadeleştirin.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 px-8">
                  Ücretsiz Denemeyi Başlat
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-300 hover:bg-slate-50">
                Demo Talep Et
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-amber-100">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-10">
                {/* Mock Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Aylık Ciro", value: "₺2.4M", trend: "+12%", color: "emerald" },
                    { label: "Açık Alacak", value: "₺856K", trend: "-5%", color: "blue" },
                    { label: "Aktif Müşteri", value: "342", trend: "+8%", color: "violet" },
                    { label: "Bekleyen Sipariş", value: "47", trend: "+3%", color: "amber" }
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white/10 border-white/10 backdrop-blur">
                      <CardContent className="p-4">
                        <p className="text-xs text-white/60 mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <Badge className={`mt-2 text-[10px] bg-${stat.color}-500/20 text-${stat.color}-400 border-0`}>
                          {stat.trend}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="sm:col-span-2 bg-white/10 border-white/10">
                    <CardContent className="p-6 h-48 flex items-end gap-2">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-amber-500 to-orange-400 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-white/10">
                    <CardContent className="p-6 h-48 flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                          <circle cx="64" cy="64" r="56" fill="none" stroke="url(#gradient)" strokeWidth="12" strokeDasharray="280" strokeDashoffset="70" strokeLinecap="round" />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">75%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-amber-100/50 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-slate-500 mb-8">Büyüyen şirketler Pafta'ya güveniyor</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60">
            {["TechCorp", "ServisPro", "LogiMax", "FinanceHub", "BuilderCo"].map((company, i) => (
              <div key={i} className="text-xl font-bold text-slate-400">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Modular System Section */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
                <Layers className="w-3 h-3 mr-1" />
                Modüler Yapı
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Modüler. Ölçeklenebilir. Büyüme İçin Tasarlandı.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 max-w-2xl mx-auto">
              İhtiyacınız olan modüllerle başlayın, büyüdükçe genişletin.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {modules.map((module, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-white hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 border-slate-100 hover:border-amber-200 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-600">{module.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* All-in-One Value Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Database className="w-3 h-3 mr-1" />
                  Hepsi Bir Arada
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Tek Platform. Daha Az Karmaşıklık.
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-slate-400 mb-8">
                Farklı yazılımlar arasında geçiş yapmayı, veri senkronizasyonu sorunlarını 
                ve Excel tablolarındaki kaosu geride bırakın.
              </motion.p>
              <motion.div variants={fadeInUp} className="space-y-4">
                {allInOneFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: TrendingUp, label: "Satış Analizi", value: "↑ 24%" },
                      { icon: Users, label: "Aktif Kullanıcı", value: "156" },
                      { icon: Package, label: "Stok Durumu", value: "Optimal" },
                      { icon: Wallet, label: "Nakit Akışı", value: "Pozitif" }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4">
                        <item.icon className="w-5 h-5 text-amber-400 mb-2" />
                        <p className="text-xs text-slate-500">{item.label}</p>
                        <p className="text-lg font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
                <RefreshCw className="w-3 h-3 mr-1" />
                Kolay Entegrasyon
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Mevcut Sistemlerinizle Hızlı Entegrasyon
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 max-w-2xl mx-auto">
              API-hazır altyapı, kolay kurulum ve kesintisiz geçiş.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {["E-Fatura", "Banka API", "E-Ticaret", "Muhasebe", "Lojistik", "CRM"].map((integration, i) => (
              <Card key={i} className="bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all">
                <CardContent className="px-6 py-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-slate-700">{integration}</span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Pafta Avantajları
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600">
              İşinizi bir adım öteye taşıyacak özellikler
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {advantages.map((advantage, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-white/80 backdrop-blur border-white hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                      <advantage.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{advantage.title}</h3>
                    <p className="text-sm text-slate-600">{advantage.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Müşteri Yorumları
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              1000+ Şirket Pafta'ya Güveniyor
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full bg-white border-slate-100 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-amber-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{testimonial.name}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="relative rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
            <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                İşinizi Tek Yerden Yönetin
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Hemen ücretsiz denemenizi başlatın. Kredi kartı gerekmez.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 shadow-xl px-8">
                    Ücretsiz Denemeyi Başlat
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Demo Talep Et
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Pafta" className="h-6 w-auto" />
              <span className="text-sm text-slate-500">© 2025 Pafta. Tüm hakları saklıdır.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-amber-600">Gizlilik</a>
              <a href="#" className="text-sm text-slate-500 hover:text-amber-600">Kullanım Şartları</a>
              <a href="#" className="text-sm text-slate-500 hover:text-amber-600">İletişim</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingV2;
