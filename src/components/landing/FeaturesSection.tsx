
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { coreFeatures } from "@/data/landingPageData";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/5 to-transparent relative">
      {/* Minimal decoration */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"></div>
      
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full text-primary font-medium text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Güçlü Özellikler</span>
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-8 leading-tight">
            Neden 
            <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              PAFTA
            </span>
            ?
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Modern işletmenizin ihtiyaç duyduğu tüm temel özellikler tek bir çözümde. 
            <span className="text-primary font-semibold"> Kullanım kolaylığından</span> güçlü entegrasyonlara kadar 
            <span className="text-secondary font-semibold"> her detay düşünüldü.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {coreFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group relative border-0 bg-gradient-to-br from-card/60 via-card/80 to-card/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 overflow-hidden cursor-pointer"
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  transform: `perspective(1000px) rotateY(${index % 2 === 0 ? '2deg' : '-2deg'})`
                }}
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-50 blur-xl transition-all duration-700"></div>
                
                <CardHeader className="pb-6 relative z-10">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5 w-20 h-20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300 mb-4">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10 pb-8">
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
                
                {/* Enhanced bottom accent */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary/50 to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                
                {/* Corner highlights */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary/30 rounded-full group-hover:bg-primary group-hover:scale-150 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-secondary/30 rounded-full group-hover:bg-secondary group-hover:scale-150 transition-all duration-300"></div>
              </Card>
            );
          })}
        </div>

        {/* Enhanced bottom section */}
        <div className="text-center mt-24">
          <div className="inline-block p-8 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-3xl border border-border/50 shadow-2xl">
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Tüm özelliklerimizi keşfetmek için platformu 
              <span className="text-primary font-semibold"> ücretsiz deneyin</span>
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-4 rounded-2xl bg-green-500/5 border border-green-500/20">
                <div className="w-4 h-4 rounded-full bg-green-500 mb-3 animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Anında Kurulum</span>
                <span className="text-xs text-muted-foreground mt-1">5 dakikada hazır</span>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="w-4 h-4 rounded-full bg-blue-500 mb-3 animate-pulse delay-500"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">7/24 Destek</span>
                <span className="text-xs text-muted-foreground mt-1">Her zaman yanınızda</span>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <div className="w-4 h-4 rounded-full bg-purple-500 mb-3 animate-pulse delay-1000"></div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Sürekli Güncelleme</span>
                <span className="text-xs text-muted-foreground mt-1">Her ay yeni özellikler</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
