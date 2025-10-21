
import { useTranslation } from "react-i18next";

const ScreenshotSection = () => {
  const { t } = useTranslation();
  
  const screenshots = [
    {
      title: t("landing.screenshots.sales.title"),
      description: t("landing.screenshots.sales.description"),
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    },
    {
      title: t("landing.screenshots.inventory.title"),
      description: t("landing.screenshots.inventory.description"),
      image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
    },
    {
      title: t("landing.screenshots.financial.title"),
      description: t("landing.screenshots.financial.description"),
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2015&q=80",
    },
  ];
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            {t("landing.screenshots.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("landing.screenshots.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="bg-card rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="overflow-hidden">
                <img 
                  src={screenshot.image} 
                  alt={screenshot.title} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground">{screenshot.title}</h3>
                <p className="mt-2 text-muted-foreground">{screenshot.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotSection;
