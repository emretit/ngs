import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ErrorDisplay } from "@/components/auth/ErrorDisplay";
import { Home } from "lucide-react";
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Başarılı",
        description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex">
      {/* Ana sayfa ikonu - Sol üst */}
      <button 
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 p-3 bg-white rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:border-primary/20 transition-all duration-200 hover:scale-105 group"
      >
        <Home className="h-6 w-6 text-gray-600 group-hover:text-primary transition-colors" />
      </button>
      {/* Sol taraf - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo ve başlık */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <button 
                onClick={() => navigate("/")}
                className="hover:scale-105 transition-transform duration-200"
              >
                <img 
                  src="/logo.svg" 
                  alt="PAFTA Logo" 
                  className="h-12 w-auto cursor-pointer"
                />
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Şifrenizi mi unuttunuz?
            </h1>
            <p className="text-lg text-gray-600">
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </p>
          </div>
          {!emailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="isim@şirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>
              <Button 
                type="submit"
                disabled={!email || loading}
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-md">
                <p className="font-medium mb-2">E-posta gönderildi!</p>
                <p>Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.</p>
                <p className="mt-2">E-posta kutunuzu kontrol edin ve bağlantıya tıklayın.</p>
              </div>
              <Button 
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full h-12 text-base"
              >
                Başka bir e-posta adresi dene
              </Button>
            </div>
          )}
          {/* Hata gösterimi */}
          <ErrorDisplay error={error} />
          {/* Alt linkler */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Şifrenizi hatırladınız mı?{" "}
              <button 
                onClick={() => navigate("/signin")}
                className="text-blue-600 hover:underline font-medium"
              >
                Giriş yapın
              </button>
            </p>
            <p className="text-gray-600">
              Hesabınız yok mu?{" "}
              <button 
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:underline font-medium"
              >
                Kaydolun
              </button>
            </p>
          </div>
        </div>
      </div>
      {/* Sağ taraf - Görsel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/90"></div>
        {/* Ana görsel - CRM/ERP arayüzü */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 transform rotate-3 scale-90">
            <div className="w-80 h-64 bg-gray-50 rounded-lg border border-gray-200 p-4">
              {/* Tablo başlıkları */}
              <div className="flex space-x-2 mb-3">
                <div className="w-16 h-3 bg-blue-200 rounded"></div>
                <div className="w-20 h-3 bg-blue-200 rounded"></div>
                <div className="w-24 h-3 bg-blue-200 rounded"></div>
                <div className="w-16 h-3 bg-blue-200 rounded"></div>
              </div>
              {/* Tablo satırları */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-2 mb-2">
                  <div className="w-16 h-2 bg-gray-200 rounded"></div>
                  <div className="w-20 h-2 bg-gray-200 rounded"></div>
                  <div className="w-24 h-2 bg-gray-200 rounded"></div>
                  <div className="w-16 h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Dekoratif elementler */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 left-16 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-white/5 rounded-full"></div>
        {/* Alt bilgi */}
        <div className="absolute bottom-8 right-8 text-white/60 text-sm">
          Gizlilik - Şartlar
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
