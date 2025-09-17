import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Server, 
  Award,
  CheckCircle,
  Globe
} from "lucide-react";

const securityFeatures = [
  {
    title: "256-bit SSL Şifreleme",
    description: "Bankacılık seviyesinde güvenlik ile verilerinizi koruyoruz",
    icon: Lock,
    color: "text-green-600"
  },
  {
    title: "ISO 27001 Sertifikalı",
    description: "Uluslararası bilgi güvenliği standartlarına uygun altyapı",
    icon: Award,
    color: "text-blue-600"
  },
  {
    title: "7/24 İzleme",
    description: "Sürekli güvenlik izleme ve tehdit analizi",
    icon: Shield,
    color: "text-purple-600"
  },
  {
    title: "Türkiye'de Veri Merkezi",
    description: "Verileriniz Türkiye sınırları içinde güvenle saklanır",
    icon: Server,
    color: "text-red-600"
  }
];

const complianceItems = [
  { name: "KVKK Uyumlu", verified: true },
  { name: "GDPR Compliant", verified: true },
  { name: "SOX Sertifikalı", verified: true },
  { name: "PCI DSS", verified: true },
  { name: "ISO 27001", verified: true },
  { name: "Türk Standartları", verified: true }
];

const customerLogos = [
  { name: "Fortune 500 Şirketi", logo: "🏢" },
  { name: "KOBİ Lideri", logo: "🏭" },
  { name: "Teknoloji Firması", logo: "💻" },
  { name: "Perakende Zinciri", logo: "🛍️" },
  { name: "Üretim Şirketi", logo: "⚙️" },
  { name: "Hizmet Sektörü", logo: "🔧" }
];

const TrustSecuritySection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-green-500/10 text-green-600 border-green-500/20">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik & Uyumluluk
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Verileriniz <span className="text-primary">Güvende</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Kurumsal düzeyde güvenlik önlemleri ve yasal uyumluluk standartları ile işletmenizi koruyoruz.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-background p-3 shadow-sm">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Compliance & Certifications */}
          <Card className="border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-foreground">Uyumluluk & Sertifikalar</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {complianceItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center text-green-700">
                  <Globe className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">
                    Uluslararası standartlarda veri koruması garantisi
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Trust */}
          <Card className="border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Güvenilir Partner</h3>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                  <p className="text-sm text-muted-foreground">Mutlu Müşteri</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {customerLogos.map((customer, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl mb-2">{customer.logo}</div>
                      <p className="text-xs text-muted-foreground">{customer.name}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uptime Garantisi</span>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">%99.9</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Veri Kaybı</span>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">%0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Müşteri Memnuniyeti</span>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">%98</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;