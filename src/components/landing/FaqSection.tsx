
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { faqs } from "@/data/landingPageData";

const FaqSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Sıkça Sorulan Sorular
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Platformumuz hakkında en çok merak edilenler.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <Card key={index} className="border shadow-sm rounded-xl hover:shadow-lg transition-all duration-300 bg-card">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
