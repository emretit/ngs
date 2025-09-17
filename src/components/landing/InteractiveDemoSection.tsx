import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ArrowRight, TrendingUp, Users, Package } from "lucide-react";

const demoTabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Genel Bakış",
    description: "Tüm işletme verilerinizi tek bakışta görün ve kritik metrikleri takip edin.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    stats: [
      { label: "Aktif Projeler", value: "24", icon: TrendingUp },
      { label: "Toplam Müşteri", value: "156", icon: Users },
      { label: "Stok Kalemleri", value: "1,247", icon: Package }
    ]
  },
  {
    id: "sales",
    label: "Satış",
    title: "Satış Yönetimi",
    description: "Fırsatları takip edin, teklifler hazırlayın ve satış süreçlerinizi optimize edin.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80",
    stats: [
      { label: "Bu Ay Satış", value: "₺89,500", icon: TrendingUp },
      { label: "Aktif Fırsatlar", value: "12", icon: Users },
      { label: "Dönüşüm Oranı", value: "%68", icon: Package }
    ]
  },
  {
    id: "inventory",
    label: "Envanter",
    title: "Stok Yönetimi",
    description: "Stok seviyelerinizi gerçek zamanlı izleyin ve otomatik sipariş noktaları belirleyin.",
    image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
    stats: [
      { label: "Toplam Değer", value: "₺245,800", icon: TrendingUp },
      { label: "Kritik Stok", value: "8", icon: Users },
      { label: "Ürün Çeşidi", value: "1,247", icon: Package }
    ]
  }
];

const InteractiveDemoSection = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const currentDemo = demoTabs.find(tab => tab.id === activeTab) || demoTabs[0];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
            Canlı Demo
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Platformu <span className="text-primary">Keşfedin</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Gerçek dashboard görünümlerimizi inceleyin ve platformun gücünü deneyimleyin.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                {demoTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {currentDemo.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {currentDemo.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {currentDemo.stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="p-4 border-0 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-0 flex items-center space-x-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                  <Play className="h-5 w-5" />
                  Canlı Demo İzle
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 border-primary/20 hover:bg-primary/5"
                >
                  Ücretsiz Deneme
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl"></div>
              <img 
                src={currentDemo.image}
                alt={currentDemo.title}
                className="w-full h-[400px] object-cover relative z-10 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-20"></div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <Button 
                  size="lg" 
                  className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-primary hover:text-primary shadow-xl hover:scale-110 transition-all duration-300"
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 z-40">
              <Badge className="px-3 py-1 bg-primary text-primary-foreground shadow-lg">
                Gerçek Veriler
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemoSection;