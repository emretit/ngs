import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, BarChart3, Users, TrendingUp } from "lucide-react";

const InteractiveDemoSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10"></div>
      <div className="mx-auto max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground">
              İşletmenizi <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dönüştürün</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tüm departmanlarınızı tek platformdan yönetin. Gerçek zamanlı verilerle daha hızlı ve doğru kararlar alın.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "İşletme", value: "1000+", icon: Users },
                { label: "Modül", value: "8", icon: BarChart3 },
                { label: "Verimlilik", value: "%45+", icon: TrendingUp }
              ].map((stat, index) => (
                <div key={index} className="text-center group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20 group-hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Button size="lg" className="shadow-lg bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-300 group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Demo İzle
              </Button>
              <Button variant="outline" size="lg" className="border-primary/20 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:border-primary/40 transition-all duration-300">
                Detayları Gör
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="relative animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-xl overflow-hidden shadow-3xl border bg-white/10 backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Dashboard"
                className="w-full h-[320px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/30"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 group-hover:scale-175 transition-transform duration-500"></div>
                  <Button
                    size="lg"
                    className="relative rounded-full w-16 h-16 bg-white/95 hover:bg-white text-primary shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
                  >
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-60"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full blur-lg opacity-40"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemoSection;