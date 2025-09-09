
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this email to your backend
    alert(`Demo talebi alındı: ${email}`);
    setEmail("");
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary-dark">
      <div className="mx-auto max-w-7xl">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-sans">
              Hemen Başlayın
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-3xl">
              14 gün ücretsiz deneyin, kredi kartı gerekmez. İşletmenizin ihtiyaçlarını karşıladığımızdan emin olun.
            </p>
            <div className="mt-8">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all"
                onClick={handleSignUp}
              >
                Ücretsiz Hesap Oluştur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="mt-8 lg:mt-0">
            <form onSubmit={handleDemoRequest} className="sm:flex lg:justify-end">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 px-4 py-2 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary shadow-sm"
                  placeholder="E-posta adresiniz"
                  required
                />
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <Button type="submit" variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Demo İsteyin
                </Button>
              </div>
            </form>
            <p className="mt-3 text-sm text-white/80">
              Kişisel verilerinizi gizlilik politikamıza uygun olarak işliyoruz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
