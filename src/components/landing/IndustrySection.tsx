import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Factory, 
  ShoppingBag, 
  Wrench, 
  Building2,
  Truck,
  Stethoscope
} from "lucide-react";

const industries = [
  {
    title: "Üretim & İmalat",
    description: "Üretim süreçlerinizi optimize edin, stok yönetimini otomatikleştirin ve kalite kontrolü yapın.",
    icon: Factory,
    color: "bg-blue-500/10 text-blue-600",
    features: ["Üretim Planlama", "Kalite Kontrol", "Hammadde Takibi", "İş Emri Yönetimi"],
    stats: "+%40 Verimlilik"
  },
  {
    title: "Perakende & Ticaret",
    description: "Satış noktalarınızı yönetin, envanter kontrolü yapın ve müşteri deneyimini iyileştirin.",
    icon: ShoppingBag,
    color: "bg-green-500/10 text-green-600",
    features: ["POS Entegrasyonu", "Çoklu Mağaza", "Müşteri Sadakati", "Kampanya Yönetimi"],
    stats: "+%25 Satış Artışı"
  },
  {
    title: "Hizmet Sektörü",
    description: "Servis süreçlerinizi dijitalleştirin, teknisyen yönetimi yapın ve müşteri memnuniyetini artırın.",
    icon: Wrench,
    color: "bg-purple-500/10 text-purple-600",
    features: ["Randevu Sistemi", "Saha Hizmetleri", "Parça Yönetimi", "Garanti Takibi"],
    stats: "+%60 Hız Artışı"
  },
  {
    title: "İnşaat & Emlak",
    description: "Proje yönetimi, maliyet kontrolü ve kaynak planlaması ile inşaat süreçlerinizi optimize edin.",
    icon: Building2,
    color: "bg-orange-500/10 text-orange-600",
    features: ["Proje Takibi", "Maliyet Kontrolü", "İşçi Yönetimi", "Malzeme Planlaması"],
    stats: "+%30 Maliyet Tasarrufu"
  },
  {
    title: "Lojistik & Nakliye",
    description: "Araç filosunu yönetin, rota optimizasyonu yapın ve teslimat süreçlerini takip edin.",
    icon: Truck,
    color: "bg-cyan-500/10 text-cyan-600",
    features: ["Filo Yönetimi", "Rota Planlama", "Teslimat Takibi", "Yakıt Kontrolü"],
    stats: "+%35 Operasyonel Verimlilik"
  },
  {
    title: "Sağlık & Medikal",
    description: "Hasta yönetimi, randevu sistemi ve medikal stok kontrolü ile sağlık hizmetlerini iyileştirin.",
    icon: Stethoscope,
    color: "bg-red-500/10 text-red-600",
    features: ["Hasta Kayıtları", "Randevu Sistemi", "Medikal Stok", "Faturalandırma"],
    stats: "+%50 Hasta Memnuniyeti"
  }
];

const IndustrySection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Sektörel Çözümler
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Her Sektörün <span className="text-primary">Özel İhtiyaçları</span> İçin
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            İşletmenizin sektörüne özel çözümlerle, endüstri standartlarına uygun süreçleri kolayca yönetin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card 
                key={index} 
                className="group relative border hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-card/80 backdrop-blur-sm overflow-hidden"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`rounded-2xl p-3 w-14 h-14 flex items-center justify-center ${industry.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                      {industry.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors">
                    {industry.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {industry.description}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Temel Özellikler:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {industry.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex} 
                          className="flex items-center text-xs text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Sektörünüze özel çözümlerimizi keşfetmek ister misiniz?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge className="px-6 py-3 text-sm bg-primary/10 text-primary border-primary/20">
              📞 Ücretsiz Danışmanlık
            </Badge>
            <Badge className="px-6 py-3 text-sm bg-secondary/10 text-secondary-foreground border-secondary/20">
              🎯 Özelleştirilmiş Demo
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustrySection;