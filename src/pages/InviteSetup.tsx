import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, Mail, User, Home } from "lucide-react";
import { AlertCircle } from "lucide-react";
const InviteSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    // Parse URL hash parameters directly
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const emailParam = hashParams.get("email") || searchParams.get('email');
    console.log('InviteSetup URL params:', { 
      accessToken, 
      type, 
      emailParam, 
      hashString: window.location.hash,
      searchParams: window.location.search 
    });
    // Accept invite if we have access_token, regardless of type
    if (accessToken) {
      setInviteToken(accessToken);
      if (emailParam) {
        setEmail(emailParam);
      }
      console.log('Invite token set successfully');
    } else {
      // If no access token, redirect to signup
      console.log('No access token found, redirecting to signup');
      navigate("/signup");
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
      // Önce mevcut session'ı kontrol et
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!existingSession) {
        console.log('No existing session, setting session with access token:', inviteToken);
        // Session yoksa, access token ile session kur
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: inviteToken!,
          refresh_token: ''
        });
        if (sessionError) {
          console.error('Session setup error:', sessionError);
          setError("Davet bağlantısı geçersiz veya süresi dolmuş.");
          setLoading(false);
          return;
        }
        console.log('Session successfully set:', sessionData.session?.user?.email);
      } else {
        console.log('Existing session found:', existingSession.user?.email);
      }
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
      toast({
        title: "Hesap Kuruldu",
        description: "Şifreniz başarıyla oluşturuldu. Dashboard'a yönlendiriliyorsunuz.",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Back Button */}
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
          <div className="flex justify-center">
            <img 
              src="/logo.svg" 
              alt="PAFTA Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hesabınızı Kurun
            </h1>
            <p className="text-sm text-muted-foreground">
              Davet bağlantınızı kullanarak şifrenizi oluşturun
            </p>
          </div>
        </div>
        {/* Form Card */}
        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Hesap Kurulumu</CardTitle>
            <CardDescription className="text-center">
              Lütfen bilgilerinizi girin ve şifrenizi oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handlePasswordSetup} className="space-y-4">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    readOnly
                    className="h-12 pl-10 text-base border-gray-300 bg-gray-50"
                    placeholder="E-posta adresiniz"
                  />
                </div>
              </div>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Ad Soyad *
                </label>
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
              </div>
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Şifre *
                </label>
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Şifreniz en az 8 karakter içermelidir
                </p>
              </div>
              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Hesap oluşturuluyor...</span>
                  </div>
                ) : (
                  "Hesabımı Oluştur"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Security Info */}
        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground">
            Bu bağlantı güvenli ve şifrelenmiş bir bağlantıdır
          </p>
          <div className="text-xs text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="text-primary hover:underline font-medium"
            >
              Giriş yapın
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InviteSetup;