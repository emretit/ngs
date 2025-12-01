import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ErrorDisplay } from "@/components/auth/ErrorDisplay";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Home } from "lucide-react";
const InviteSetup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    // Parse URL hash parameters for invite tokens (SetPassword.tsx ile aynı mantık)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");
    const emailParam = hashParams.get("email") || searchParams.get('email');
    
    console.log('InviteSetup URL params:', { 
      accessToken, 
      type, 
      emailParam, 
      hashString: window.location.hash,
      searchParams: window.location.search 
    });
    
    // Check if we have access token from invite link
    if (accessToken) {
      // Manuel session oluştur (SetPassword.tsx'teki gibi)
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ data, error }) => {
        if (error) {
          console.error('Session setup error:', error);
          setError("Bağlantı geçersiz veya süresi dolmuş. Yöneticinizden yeni bir davet linki isteyin.");
          return;
        }
        
        console.log('Session successfully created:', data.session?.user?.email);
        
        // Session başarıyla oluşturuldu
        setSessionReady(true);
        setInviteToken(accessToken);
        
        // Email'i ayarla
        if (data.session?.user?.email) {
          setEmail(data.session.user.email);
        } else if (emailParam) {
          setEmail(emailParam);
        }
        
        // URL hash'ini temizle
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      });
    } else {
      // If no access token and no email, redirect to signup
      if (!emailParam) {
        console.log('No access token or email found, redirecting to signup');
        navigate("/signup");
      } else {
        setEmail(emailParam);
      }
    }
  }, [navigate, searchParams]);
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!password || !fullName) {
      setError("Şifre ve ad soyad gereklidir.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }
    try {
      console.log('Starting invite setup process...');
      
      // Session'ın hazır olup olmadığını kontrol et
      if (!sessionReady) {
        console.error('Session not ready - no session created from invite link');
        setError("Davet linki geçersiz veya süresi dolmuş. Lütfen yöneticinizden yeni bir davet linki isteyin.");
        setLoading(false);
        return;
      }
      
      console.log('Session ready, proceeding with user update');
      // Kullanıcının şifresini ve profilini güncelle
      console.log('Updating user password and profile...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { 
          full_name: fullName.trim() 
        }
      });
      if (updateError) {
        console.error('User update error:', updateError);
        throw updateError;
      }
      console.log('User successfully updated');

      // Get current user to check for employee_id in metadata
      const { data: { user } } = await supabase.auth.getUser();
      const employeeId = user?.user_metadata?.employee_id;
      
      if (employeeId && user?.id) {
        console.log('Linking user to employee:', employeeId);
        try {
          // Update employee with user_id
          await supabase
            .from('employees')
            .update({ user_id: user.id })
            .eq('id', employeeId);
          
          // Update profile with employee_id
          await supabase
            .from('profiles')
            .update({ employee_id: employeeId })
            .eq('id', user.id);
          
          console.log('User-Employee link established');
        } catch (linkError) {
          console.error('Error linking user to employee:', linkError);
          // Don't throw - user is already created
        }
      }
      toast.success("Şifreniz başarıyla oluşturuldu. Dashboard'a yönlendiriliyorsunuz.", { duration: 1000 });
      // Kısa bir delay sonra dashboard'a yönlendir
      console.log('Redirecting to dashboard in 1 second...');
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error('Account setup error:', error);
      setError(error.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
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
              Hesap Kurulumu
            </h1>
            <p className="text-lg text-gray-600">
              Davet bağlantınızı kullanarak şifrenizi oluşturun
            </p>
          </div>
          {/* Kurulum formu */}
          <form onSubmit={handlePasswordSetup} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  readOnly
                  placeholder="E-posta adresiniz"
                  className="h-12 pl-10 text-base border-gray-300 bg-gray-50 focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ad ve soyadınızı girin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-10 text-base border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre (en az 8 karakter)"
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
              disabled={!password || !fullName || loading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Hesap oluşturuluyor...
                </div>
              ) : (
                <div className="flex items-center">
                  Hesabımı Oluştur
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
          {/* Hata gösterimi */}
          <ErrorDisplay error={error} />
          {/* Alt linkler */}
          <div className="text-center space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 font-medium">
                ⏰ Davet linki 1 saat geçerlidir
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Link süresi dolduysa yöneticinizden yeni bir davet linki isteyebilirsiniz
              </p>
            </div>
            <p className="text-gray-600">
              Zaten hesabınız var mı?{" "}
              <button 
                onClick={() => navigate("/signin")}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Giriş yapın
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
export default InviteSetup;