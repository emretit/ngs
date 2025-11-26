import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupplierPortalAuth } from '@/hooks/useSupplierPortal';

export default function SupplierPortalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useSupplierPortalAuth();
  
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-login if token in URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !authLoading) {
      handleLogin(urlToken);
    }
  }, [searchParams, authLoading]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/supplier-portal/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (loginToken?: string) => {
    const tokenToUse = loginToken || token;
    
    if (!tokenToUse.trim()) {
      setError('Lütfen erişim kodunuzu girin');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(tokenToUse);
      if (success) {
        navigate('/supplier-portal/dashboard');
      } else {
        setError('Geçersiz veya süresi dolmuş erişim kodu');
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-300 mx-auto" />
          <p className="text-emerald-200">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Tedarikçi Portalı
          </CardTitle>
          <CardDescription className="text-slate-500">
            Teklif taleplerini görüntüleyin ve yanıtlayın
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Erişim Kodu
              </label>
              <Input
                type="text"
                placeholder="Davet e-postasındaki kodu girin"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError('');
                }}
                className="h-12 text-center text-lg tracking-wider font-mono"
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium"
              disabled={isLoading || !token.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-center text-slate-500">
              Erişim kodunuz yok mu?
              <br />
              <span className="text-slate-600">
                Lütfen müşterinizle iletişime geçin.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-emerald-300/60 text-sm">
        PAFTA - Tedarikçi Portalı
      </div>
    </div>
  );
}

