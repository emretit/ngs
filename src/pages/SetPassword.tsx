import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Home, AlertCircle } from "lucide-react";

const SetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Parse URL hash parameters for password reset/invite tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const emailParam = hashParams.get("email") || searchParams.get('email');

    console.log('SetPassword URL params:', { 
      accessToken, 
      type, 
      emailParam,
      hashString: window.location.hash,
      searchParams: window.location.search 
    });

    // Check if we have access token from invite or recovery link
    if (accessToken) {
      // Set session with the access token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: ''
      }).then(({ data, error }) => {
        if (error) {
          console.error('Session setup error:', error);
          setError("Bağlantı geçersiz veya süresi dolmuş.");
          return;
        }
        
        if (data.session?.user?.email) {
          setEmail(data.session.user.email);
        } else if (emailParam) {
          setEmail(emailParam);
        }
        
        console.log('Session successfully set:', data.session?.user?.email);
      });
    } else {
      // If no access token and no email, redirect to signin
      if (!emailParam) {
        console.log('No access token or email found, redirecting to signin');
        navigate("/signin");
      } else {
        setEmail(emailParam);
      }
    }
  }, [navigate, searchParams]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!password || !confirmPassword) {
      setError("Şifre alanları gereklidir.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    try {
      console.log('Setting password for user...');

      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      console.log('Password successfully updated');
      
      toast.success("Şifreniz kaydedildi. Dashboard'a yönlendiriliyorsunuz.", { duration: 1000 });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error: any) {
      console.error('Password setup error:', error);
      setError(error.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
      toast.error(error.message || "Şifre belirleme sırasında bir hata oluştu.", { duration: 1000 });
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
              Şifrenizi Belirleyin
            </h1>
            <p className="text-sm text-muted-foreground">
              Hesabınız için yeni bir şifre oluşturun
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Şifre Belirleme</CardTitle>
            <CardDescription className="text-center">
              Güvenliğiniz için güçlü bir şifre seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSetPassword} className="space-y-4">
              {/* Email (Read-only) */}
              {email && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
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
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Yeni Şifre *
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Şifreyi Tekrar Girin *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Şifreyi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-10 pr-12 text-base border-gray-300 focus:border-primary focus:ring-primary"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
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
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Şifre belirleniyor...</span>
                  </div>
                ) : (
                  "Şifremi Belirle"
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

export default SetPassword;

