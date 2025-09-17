import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Factory,
  ShoppingBag,
  Wrench,
  Building2
} from "lucide-react";

const industries = [
  {
    title: "Üretim & İmalat",
    description: "Üretim süreçlerinizi optimize edin ve stok yönetimini otomatikleştirin.",
    icon: Factory,
    color: "bg-blue-500/10 text-blue-600",
    stats: "%40 Verimlilik Artışı"
  },
  {
    title: "Perakende & Ticaret",
    description: "Satış noktalarınızı yönetin ve müşteri deneyimini iyileştirin.",
    icon: ShoppingBag,
    color: "bg-green-500/10 text-green-600",
    stats: "%25 Satış Artışı"
  },
  {
    title: "Hizmet Sektörü",
    description: "Servis süreçlerinizi dijitalleştirin ve müşteri memnuniyetini artırın.",
    icon: Wrench,
    color: "bg-purple-500/10 text-purple-600",
    stats: "%60 Hız Artışı"
  },
  {
    title: "İnşaat & Emlak",
    description: "Proje yönetimi ve maliyet kontrolü ile süreçlerinizi optimize edin.",
    icon: Building2,
    color: "bg-orange-500/10 text-orange-600",
    stats: "%30 Maliyet Tasarrufu"
  }
];

const IndustrySection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans mb-4">
            Her Sektörün <span className="text-primary">İhtiyacına Uygun</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sektörünüze özel çözümlerle işletmenizin verimliliğini artırın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card
                key={index}
                className="group border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`rounded-xl p-3 w-12 h-12 flex items-center justify-center ${industry.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-card-foreground">
                    {industry.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {industry.description}
                  </p>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                    {industry.stats}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IndustrySection;