import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const VeribanSettings = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [veribanData, setVeribanData] = useState<{username: string, webserviceUrl: string} | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  // Check if user already has Veriban authentication
  useEffect(() => {
    checkVeribanStatus();
  }, []);

  const checkVeribanStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's company_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.company_id) {
        setIsConnected(false);
        setConnectionStatus("Şirket profili bulunamadı");
        return;
      }

      // Check if company has Veriban auth
      const { data, error } = await supabase
        .from('veriban_auth')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (data && !error) {
        setIsConnected(true);
        setConnectionStatus("Veriban bağlantısı aktif");
        setVeribanData({
          username: data.username,
          webserviceUrl: data.webservice_url
        });
        setTestMode(data.test_mode || false);
      } else {
        setIsConnected(false);
        setConnectionStatus("Veriban bağlantısı yok");
        setVeribanData(null);
      }
    } catch (error) {
      console.error('Error checking Veriban status:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen kullanıcı adı ve şifre alanlarını doldurun",
      });
      return;
    }

    setLoading(true);
    setConnectionStatus("Bağlanılıyor...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      console.log('🔐 Veriban auth edge function çağrılıyor...');
      console.log('📡 Test Mode:', testMode);
      console.log('👤 Username:', username);

      const requestBody = {
        action: 'authenticate',
        username: username.trim(),
        password: password.trim(),
        testMode: testMode
      };
      
      console.log('📤 Request body:', requestBody);

      const { data, error } = await supabase.functions.invoke('veriban-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: requestBody,
      });

      console.log('✅ Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error details:', error);
        
        // Extract error message from different error formats
        let errorMessage = "Veriban bağlantısı başarısız";
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setConnectionStatus(`Bağlantı hatası: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (data?.success) {
        setIsConnected(true);
        setConnectionStatus("✅ Veriban bağlantısı başarılı");
        setUsername("");
        setPassword("");
        await checkVeribanStatus(); // Refresh status
        toast({
          title: "Başarılı",
          description: "Veriban hesap bilgileri doğrulandı ve kaydedildi",
        });
      } else {
        const errorMsg = data?.error || "Bilinmeyen hata";
        setConnectionStatus(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Veriban auth error:', error);
      
      // Extract error message from different error formats
      let errorMessage = "Veriban bağlantısı başarısız";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setConnectionStatus(`❌ ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Bağlantı Hatası",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isConnected || !veribanData) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Önce Veriban bağlantısı kurulmalı",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus("Bağlantı test ediliyor...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı");
      }

      // Get stored credentials from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket profili bulunamadı");
      }

      const { data: authData } = await supabase
        .from('veriban_auth')
        .select('username, password, test_mode')
        .eq('company_id', profile.company_id)
        .single();

      if (!authData) {
        throw new Error("Kayıtlı Veriban bilgileri bulunamadı");
      }

      console.log('🧪 Mevcut bağlantı test ediliyor...');

      const { data, error } = await supabase.functions.invoke('veriban-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'authenticate',
          username: authData.username,
          password: authData.password,
          testMode: authData.test_mode || false,
        },
      });

      if (error) {
        throw new Error(error.message || 'Bağlantı testi başarısız');
      }

      if (data?.success) {
        setConnectionStatus("✅ Bağlantı testi başarılı");
        toast({
          title: "Başarılı",
          description: "Veriban bağlantısı çalışıyor",
        });
        await checkVeribanStatus(); // Refresh status
      } else {
        throw new Error(data?.error || 'Bağlantı testi başarısız');
      }
    } catch (error: any) {
      console.error('❌ Bağlantı testi hatası:', error);
      setConnectionStatus(`❌ Test başarısız: ${error.message || 'Bilinmeyen hata'}`);
      toast({
        variant: "destructive",
        title: "Test Başarısız",
        description: error.message || "Bağlantı test edilemedi",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's company_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error("Şirket profili bulunamadı");
      }

      const { error } = await supabase
        .from('veriban_auth')
        .delete()
        .eq('company_id', profile.company_id);

      if (error) throw error;

      setIsConnected(false);
      setConnectionStatus("Veriban bağlantısı kesildi");
      setVeribanData(null);

      toast({
        title: "Başarılı",
        description: "Veriban bağlantısı kesildi",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Bağlantı kesilirken hata oluştu",
      });
    }
  };

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Connection Status */}
        <div className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${
          isConnected
            ? 'bg-green-50 border-green-200 text-green-900'
            : 'bg-orange-50 border-orange-200 text-orange-900'
        }`}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
            <span className="font-medium text-sm">{connectionStatus || (isConnected ? "Veriban bağlantısı aktif" : "Veriban bağlantısı yok")}</span>
          </div>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="h-7 px-3 text-xs"
            >
              {testingConnection ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                  Test Ediliyor...
                </>
              ) : (
                "Bağlantıyı Test Et"
              )}
            </Button>
          )}
        </div>

        {!isConnected ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">
                  Kullanıcı Adı
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Veriban kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Veriban şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-gray-200">
                <div className="space-y-0.5">
                  <Label htmlFor="test-mode" className="text-sm font-medium">
                    Test Modu
                  </Label>
                  <p className="text-xs text-gray-500">
                    Test ortamında çalışmak için aktif edin
                  </p>
                </div>
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  {testMode ? (
                    <>
                      <strong>Test Modu:</strong> https://efaturatransfertest.veriban.com.tr/IntegrationService.svc
                    </>
                  ) : (
                    <>
                      <strong>Production Modu:</strong> http://efaturatransfer.veriban.com.tr/IntegrationService.svc
                    </>
                  )}
                </p>
              </div>

              {testMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-900">
                    <strong>Test Hesabı:</strong> TESTER@VRBN / Vtest*2020*
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleAuthenticate}
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Doğrulanıyor...
                </div>
              ) : (
                "Bağlan"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {veribanData && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-green-900">Hesap Bilgileri</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="h-7 px-2 text-xs text-green-700 hover:bg-green-100"
                  >
                    {showCredentials ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Gizle
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Göster
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Kullanıcı:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-xs">
                      {showCredentials ? veribanData.username : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Webservice URL:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-xs truncate max-w-[200px]">
                      {showCredentials ? veribanData.webserviceUrl : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Mod:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      testMode ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {testMode ? 'Test' : 'Production'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full h-10"
              size="sm"
            >
              Bağlantıyı Kes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

