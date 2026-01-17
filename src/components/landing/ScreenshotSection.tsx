import { useTranslation } from "react-i18next";
import { CRMMockup, FinanceMockup, InventoryMockup } from "./mockups/ModuleMockups";

const ScreenshotSection = () => {
  const { t } = useTranslation();
  
  const screenshots = [
    {
      title: t("landing.screenshots.sales.title"),
      description: t("landing.screenshots.sales.description"),
      component: <CRMMockup />,
    },
    {
      title: t("landing.screenshots.inventory.title"),
      description: t("landing.screenshots.inventory.description"),
      component: <InventoryMockup />,
    },
    {
      title: t("landing.screenshots.financial.title"),
      description: t("landing.screenshots.financial.description"),
      component: <FinanceMockup />,
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
            <div 
              key={index} 
              className="group hover:scale-[1.02] transition-all duration-300"
            >
              {/* Module Mockup */}
              <div className="h-[320px]">
                {screenshot.component}
              </div>
              
              {/* Description below */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-foreground">{screenshot.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{screenshot.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotSection;
