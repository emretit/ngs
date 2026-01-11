import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const ElogoSettings = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [elogoData, setElogoData] = useState<{username: string, webserviceUrl: string} | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const { toast } = useToast();

  // Check if user already has e-Logo authentication
  useEffect(() => {
    checkElogoStatus();
  }, []);

  const checkElogoStatus = async () => {
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

      // Check if company has e-Logo auth
      const { data, error } = await supabase
        .from('elogo_auth')
        .select('username, webservice_url, test_mode, is_active')
        .maybeSingle();

      if (data && !error) {
        setIsConnected(true);
        setConnectionStatus("e-Logo bağlantısı aktif");
        setElogoData({
          username: data.username,
          webserviceUrl: data.webservice_url
        });
        setTestMode(data.test_mode || false);
      } else {
        setIsConnected(false);
        setConnectionStatus("e-Logo bağlantısı yok");
        setElogoData(null);
      }
    } catch (error) {
      logger.error('Error checking e-Logo status:', error);
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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke('elogo-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'authenticate',
          username: username,
          password: password,
          testMode: testMode
        }
      });

      logger.debug('Edge function response:', { data, error });

      if (error) {
        logger.error('Edge function error details:', error);
        throw error;
      }

      if (data?.success) {
        setIsConnected(true);
        setConnectionStatus("e-Logo bağlantısı başarılı");
        setUsername("");
        setPassword("");
        await checkElogoStatus(); // Refresh status
        toast({
          title: "Başarılı",
          description: "e-Logo hesap bilgileri doğrulandı ve kaydedildi",
        });
      } else {
        throw new Error(data?.error || "Bilinmeyen hata");
      }
    } catch (error: any) {
      logger.error('e-Logo auth error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "e-Logo bağlantısı başarısız",
      });
    } finally {
      setLoading(false);
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
        .from('elogo_auth')
        .delete();

      if (error) throw error;

      setIsConnected(false);
      setConnectionStatus("e-Logo bağlantısı kesildi");
      setElogoData(null);

      toast({
        title: "Başarılı",
        description: "e-Logo bağlantısı kesildi",
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
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          isConnected
            ? 'bg-green-50 border-green-200 text-green-900'
            : 'bg-orange-50 border-orange-200 text-orange-900'
        }`}>
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <span className="font-medium text-sm">{connectionStatus}</span>
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
                  placeholder="e-Logo kullanıcı adınızı girin"
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
                  placeholder="e-Logo şifrenizi girin"
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
                      <strong>Test Modu:</strong> https://pb-demo.elogo.com.tr/PostBoxService.svc
                    </>
                  ) : (
                    <>
                      <strong>Production Modu:</strong> https://pb.elogo.com.tr/PostBoxService.svc
                    </>
                  )}
                </p>
              </div>
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
            {elogoData && (
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
                      {showCredentials ? elogoData.username : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Webservice URL:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-xs truncate max-w-[200px]">
                      {showCredentials ? elogoData.webserviceUrl : '••••••••'}
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
