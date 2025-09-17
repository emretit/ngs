import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  CreditCard, 
  Database, 
  Zap, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const integrations = [
  {
    name: "E-Fatura (Nilvera)",
    description: "Otomatik e-fatura gönderimi ve alma, yasal uyumluluk garantili",
    icon: Receipt,
    status: "Aktif",
    color: "bg-green-100 text-green-700",
    features: ["Otomatik gönderim", "Yasal uyumluluk", "7/24 senkronizasyon"]
  },
  {
    name: "Ödeme Sistemleri",
    description: "Kredi kartı, banka transferi ve dijital ödeme entegrasyonları",
    icon: CreditCard,
    status: "Yakında",
    color: "bg-blue-100 text-blue-700",
    features: ["Kredi kartı", "Banka transferi", "Dijital cüzdan"]
  },
  {
    name: "Muhasebe Sistemleri",
    description: "Popüler muhasebe yazılımları ile veri senkronizasyonu",
    icon: Database,
    status: "Planlanıyor",
    color: "bg-purple-100 text-purple-700",
    features: ["Mikro", "Logo", "Eta"]
  },
  {
    name: "API Entegrasyonları",
    description: "RESTful API ile özel entegrasyonlar ve webhook desteği",
    icon: Zap,
    status: "Aktif",
    color: "bg-orange-100 text-orange-700",
    features: ["REST API", "Webhook", "JSON format"]
  }
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/5 to-transparent relative">
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full text-primary font-medium text-sm">
              <Zap className="w-4 h-4" />
              <span>Entegrasyonlar</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Güçlü <span className="text-red-700">Entegrasyonlar</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Mevcut araçlarınızla sorunsuz çalışın. E-fatura, ödeme sistemleri ve daha fazlası.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {integrations.map((integration, index) => {
            const IconComponent = integration.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 ${integration.color} rounded-xl flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Badge 
                      variant={integration.status === "Aktif" ? "default" : "secondary"}
                      className={`text-xs ${
                        integration.status === "Aktif" 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : integration.status === "Yakında"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {integration.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                    {integration.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4">
                    {integration.description}
                  </p>
                  <div className="space-y-2">
                    {integration.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-red-50 to-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Neden Entegrasyonlar Önemli?
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                İş süreçlerinizi kesintisiz hale getirin. Mevcut araçlarınızla çalışmaya devam edin, 
                veri kaybı yaşamadan PAFTA'ya geçiş yapın.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Güvenli Veri Transferi</h4>
                    <p className="text-sm text-gray-600">SSL şifreleme ile güvenli veri aktarımı</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Gerçek Zamanlı Senkronizasyon</h4>
                    <p className="text-sm text-gray-600">Anlık veri güncellemeleri ve senkronizasyon</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Otomatik İş Akışları</h4>
                    <p className="text-sm text-gray-600">Manuel işlemleri otomatikleştirin</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">E-Fatura Entegrasyonu</span>
                    <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Ödeme Sistemleri</span>
                    <Badge className="bg-blue-100 text-blue-700">Yakında</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Muhasebe Sistemleri</span>
                    <Badge className="bg-purple-100 text-purple-700">Planlanıyor</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">API Entegrasyonları</span>
                    <Badge className="bg-orange-100 text-orange-700">Aktif</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Özel entegrasyon ihtiyacınız mı var? Bizimle iletişime geçin.
          </p>
          <button className="inline-flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            <span>Entegrasyon Talep Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
