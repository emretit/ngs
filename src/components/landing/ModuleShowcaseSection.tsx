import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  ShoppingBag,
  Receipt,
  Users,
  Package,
  UserCheck,
  DollarSign,
  Wrench,
  Car
} from "lucide-react";

const modules = [
  {
    title: "Satış Yönetimi",
    description: "Fırsatları takip edin, teklifler oluşturun ve satış süreçlerinizi optimize edin.",
    icon: ShoppingCart,
    color: "bg-blue-500/10 text-blue-600",
    features: ["Teklif Yönetimi", "Müşteri Takibi", "Satış Analizi"]
  },
  {
    title: "Satın Alma",
    description: "Tedarikçi ilişkilerini yönetin, sipariş süreçlerini otomatikleştirin.",
    icon: ShoppingBag,
    color: "bg-green-500/10 text-green-600",
    features: ["Tedarikçi Yönetimi", "Sipariş Takibi", "Maliyet Kontrolü"]
  },
  {
    title: "Faturalama",
    description: "E-fatura entegrasyonu ile hızlı ve güvenli faturalama işlemleri.",
    icon: Receipt,
    color: "bg-purple-500/10 text-purple-600",
    features: ["E-Fatura", "Otomatik Hesaplama", "Yasal Uyumluluk"]
  },
  {
    title: "Müşteri/Tedarikçi",
    description: "Tüm iş ortaklarınızı tek platformda yönetin ve ilişkileri güçlendirin.",
    icon: Users,
    color: "bg-orange-500/10 text-orange-600",
    features: ["İletişim Yönetimi", "Sözleşme Takibi", "Performans Analizi"]
  },
  {
    title: "Ürün Yönetimi", 
    description: "Ürün kataloğunuzu organize edin, stok takibi yapın.",
    icon: Package,
    color: "bg-cyan-500/10 text-cyan-600",
    features: ["Envanter Takibi", "Kategori Yönetimi", "Fiyat Kontrolü"]
  },
  {
    title: "İnsan Kaynakları",
    description: "Personel yönetimi, bordro ve performans takibi.",
    icon: UserCheck,
    color: "bg-indigo-500/10 text-indigo-600",
    features: ["Personel Dosyası", "Bordro", "İzin Takibi"]
  },
  {
    title: "Finansal Yönetim",
    description: "Muhasebe, nakit akışı ve finansal raporlama.",
    icon: DollarSign,
    color: "bg-emerald-500/10 text-emerald-600",
    features: ["Muhasebe", "Nakit Akışı", "Finansal Raporlar"]
  },
  {
    title: "Servis Yönetimi",
    description: "Teknik servis işlemlerini dijitalleştirin ve takip edin.",
    icon: Wrench,
    color: "bg-red-500/10 text-red-600",
    features: ["Servis Talepleri", "Teknisyen Atama", "Parça Yönetimi"]
  },
  {
    title: "Araç Yönetimi",
    description: "Filo yönetimi, bakım takibi ve maliyet kontrolü.",
    icon: Car,
    color: "bg-amber-500/10 text-amber-600",
    features: ["Filo Yönetimi", "Bakım Takibi", "Yakıt Kontrolü"]
  }
];

const ModuleShowcaseSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            9 Güçlü Modül
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Tüm İşletme İhtiyaçlarınız <span className="text-primary">Tek Platformda</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Satıştan satın almaya, insan kaynaklarından araç yönetimine kadar işletmenizin tüm süreçlerini tek bir platformda yönetin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card 
                key={index} 
                className="group border hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/50 backdrop-blur-sm hover:bg-card"
              >
                <CardHeader className="pb-4">
                  <div className={`rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-4 ${module.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {module.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature, featureIndex) => (
                      <Badge 
                        key={featureIndex} 
                        variant="secondary" 
                        className="text-xs px-2 py-1 bg-primary/10 text-primary border-0"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ModuleShowcaseSection;