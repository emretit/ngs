import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ErrorDisplay } from "@/components/auth/ErrorDisplay";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Home } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { parseAuthParamsFromUrl, getAuthErrorMessage } from "@/utils/authHelpers";
import { safeSignOut } from "@/lib/supabase-utils";
const SignIn = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signInWithPassword, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [blockAutoRedirect, setBlockAutoRedirect] = useState(false);
  // Check if user is already logged in (avoid redirect if coming from email confirm)
  useEffect(() => {
    if (user?.id && !blockAutoRedirect) {
      navigate("/dashboard");
    }
  }, [user?.id, blockAutoRedirect, navigate]);
  // Handle redirects from email links (signup confirmation, errors, etc.)
  useEffect(() => {
    const { accessToken, type, errorCode, errorDescription } = parseAuthParamsFromUrl();
    if (errorCode) {
      const msg = getAuthErrorMessage(errorCode, errorDescription);
      if (msg) {
        toast.error(msg, { duration: 1000 });
      }
    }
    if (accessToken && type === "signup") {
      setBlockAutoRedirect(true);
      setTimeout(async () => {
        await safeSignOut();
        toast.success("E-posta doğrulandı. Lütfen e-posta ve şifrenizle giriş yapın.", { duration: 1000 });
      }, 0);
    }
  }, []);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!email || !password) {
      setError("Lütfen email ve şifre alanlarını doldurun.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }
    try {
      const { error: signInError } = await signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });
      if (signInError) {
        throw signInError;
      }
      // Başarılı giriş
      toast.success("Giriş yapıldı. Dashboard'a yönlendiriliyorsunuz...", { duration: 1000 });
      // Dashboard'a yönlendir
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Giriş hatası:", error);
      let errorMessage = "Giriş başarısız";
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "E-posta veya şifre hatalı";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "E-posta adresinizi doğrulamadan giriş yapamazsınız";
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "Çok fazla giriş denemesi yapıldı. Lütfen biraz bekleyin.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage, { duration: 1000 });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Ana sayfa ikonu - Sol üst */}
      <button 
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 z-50 p-3 bg-white rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:border-primary/20 transition-all duration-200 hover:scale-105 group"
      >
        <Home className="h-6 w-6 text-gray-600 group-hover:text-primary transition-colors" />
      </button>
      {/* Sol taraf - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
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
                  className="h-16 w-auto cursor-pointer"
                />
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {t('auth.accountLogin')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('auth.welcomeBack')}
            </p>
          </div>
          {/* Giriş formu */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 text-base border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.minPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-12 text-base border-gray-300 focus:border-primary focus:ring-primary"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit"
              disabled={!email || !password || loading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('auth.signingIn')}
                </div>
              ) : (
                <div className="flex items-center">
                  {t('auth.signIn')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
          {/* Hata gösterimi */}
          <ErrorDisplay error={error} />
          {/* Alt linkler */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              {t('auth.noAccount')}{" "}
              <button 
                onClick={() => navigate("/signup")}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {t('auth.signUpNow')}
              </button>
            </p>
            <p className="text-gray-600">
              {t('auth.forgotPassword')}?{" "}
              <button 
                onClick={() => navigate("/forgot-password")}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {t('auth.resetPassword')}
              </button>
            </p>
          </div>
        </div>
      </div>
      {/* Sağ taraf - Görsel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Ana görsel - PAFTA Platform arayüzü */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 scale-90">
            <div className="w-80 h-64 bg-gray-50 rounded-xl border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">PAFTA</span>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              {/* Dashboard cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="w-full h-2 bg-blue-200 rounded mb-2"></div>
                  <div className="w-3/4 h-2 bg-blue-300 rounded"></div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="w-full h-2 bg-green-200 rounded mb-2"></div>
                  <div className="w-2/3 h-2 bg-green-300 rounded"></div>
                </div>
              </div>
              {/* Table */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded"></div>
                  <div className="w-20 h-2 bg-gray-200 rounded"></div>
                  <div className="w-24 h-2 bg-gray-200 rounded"></div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded"></div>
                    <div className="w-20 h-1.5 bg-gray-100 rounded"></div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Dekoratif elementler */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 left-16 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/5 rounded-full"></div>
        {/* Alt bilgi */}
        <div className="absolute bottom-8 right-8 text-white/80 text-sm font-medium">
          PAFTA İş Yönetim Sistemi
        </div>
      </div>
    </div>
  );
};
export default SignIn;
