
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const TestimonialsSection = () => {
  const { t } = useTranslation();
  
  const testimonials = [
    {
      quote: t("landing.testimonials.items.0.quote"),
      name: t("landing.testimonials.items.0.name"),
      role: t("landing.testimonials.items.0.role"),
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      quote: t("landing.testimonials.items.1.quote"),
      name: t("landing.testimonials.items.1.name"),
      role: t("landing.testimonials.items.1.role"),
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
      quote: t("landing.testimonials.items.2.quote"),
      name: t("landing.testimonials.items.2.name"),
      role: t("landing.testimonials.items.2.role"),
      avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    },
  ];
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <img
                      className="h-10 w-10 rounded-full ring-2 ring-primary/10"
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-card-foreground">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
