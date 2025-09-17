
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <section id="cta" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.08),transparent_60%)]"></div>

      <div className="relative mx-auto max-w-4xl text-center z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Hemen
          <span className="block bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
            Başlayın
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          E-fatura entegrasyonu dahil 5 kullanıcıya kadar tamamen ücretsiz!
        </p>

        <Button
          size="lg"
          className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl hover:shadow-red-500/25 px-10 py-4 text-lg font-semibold mb-8 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          onClick={handleSignUp}
        >
          Ücretsiz Başla
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>E-fatura dahil</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Kredi kartı gerekmez</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>5 kullanıcıya kadar ücretsiz</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
