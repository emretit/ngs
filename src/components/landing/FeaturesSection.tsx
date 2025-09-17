
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { coreFeatures } from "@/data/landingPageData";

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
      
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans animate-fade-in">
            Güçlü Özellikleriyle <span className="text-primary">Öne Çıkan Platform</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Modern işletmenizin ihtiyaç duyduğu tüm temel özellikler tek bir çözümde. 
            Kullanım kolaylığından güçlü entegrasyonlara kadar her detay düşünüldü.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {coreFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group relative border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="rounded-2xl bg-primary/10 p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Tüm özelliklerimizi keşfetmek için platformu ücretsiz deneyin
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              Anında Kurulum
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              7/24 Destek
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
              Sürekli Güncelleme
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
