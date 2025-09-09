
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/landingPageData";

const PricingSection = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            İşletmenize Uygun Fiyatlandırma
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Her ölçekteki işletme için uygun fiyatlandırma seçenekleri sunuyoruz.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`rounded-xl transition-all duration-300 hover:shadow-xl ${plan.featured ? 'border-primary/20 shadow-lg ring-1 ring-primary/20 bg-primary/5' : 'border shadow-sm bg-card'}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-card-foreground">{plan.name}</CardTitle>
                  {plan.featured && (
                    <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                      Popüler
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/ ay</span>
                </div>
                <CardDescription className="mt-4 text-muted-foreground">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <span className="ml-3 text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={plan.featured ? "default" : "outline"} 
                  className="w-full"
                  onClick={handleSignUp}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
