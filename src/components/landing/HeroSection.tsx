
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, CheckCircle, TrendingUp } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center mb-16">
          {/* Badge */}
          <Badge className="mb-6 px-6 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 animate-fade-in">
            <TrendingUp className="h-4 w-4 mr-2" />
            9 Güçlü Modül • Tek Platform
          </Badge>

          {/* Logo */}
          <div className="flex justify-center mb-8 animate-scale-in">
            <img 
              src="/logo-large.svg" 
              alt="PAFTA Logo" 
              className="h-20 w-auto"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-sans animate-fade-in">
            <span className="block mb-4">Gelişmiş İş Yönetim Sistemi</span>
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              İşletmenizi Dijital Çağa Taşıyın
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 max-w-4xl mx-auto text-lg text-muted-foreground md:text-xl leading-relaxed animate-fade-in">
            Satıştan satın almaya, insan kaynaklarından araç yönetimine kadar tüm işletme süreçlerinizi 
            tek platformda yönetin. <span className="font-semibold text-foreground">9 modül</span> ile 
            işletmenizin tüm ihtiyaçlarını karşılayın.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in">
            {[
              { label: "Aktif Kullanıcı", value: "1000+", icon: CheckCircle },
              { label: "Modül Çeşidi", value: "9", icon: TrendingUp },
              { label: "Müşteri Memnuniyeti", value: "%98", icon: CheckCircle }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80"
              >
                Ücretsiz Deneyin
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-lg border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Demo İzle
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Kredi kartı gerekmez
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              14 gün ücretsiz deneme
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Anında kurulum
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
