
import { screenshots } from "@/data/landingPageData";

const ScreenshotSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-sans">
            Kullanışlı Arayüzümüzü Keşfedin
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Modern ve kullanıcı dostu tasarımımız ile işlerinizi kolayca yönetin.
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
