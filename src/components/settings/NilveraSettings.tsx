import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Key, User, Eye, EyeOff, Plug } from "lucide-react";
import { NilveraTestConnection } from "./NilveraTestConnection";

export const NilveraSettings = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [nilveraData, setNilveraData] = useState<{username: string, apiKey: string} | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const { toast } = useToast();

  // Check if user already has Nilvera authentication
  useEffect(() => {
    checkNilveraStatus();
  }, []);

  const checkNilveraStatus = async () => {
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

      // Check if company has Nilvera auth
      const { data, error } = await supabase
        .from('nilvera_auth')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (data && !error) {
        setIsConnected(true);
        setConnectionStatus("Nilvera bağlantısı aktif");
        setNilveraData({
          username: data.username,
          apiKey: data.api_key
        });
      } else {
        setIsConnected(false);
        setConnectionStatus("Nilvera bağlantısı yok");
        setNilveraData(null);
      }
    } catch (error) {
      console.error('Error checking Nilvera status:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!username.trim() || !password.trim() || !apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke('nilvera-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'authenticate',
          username: username,
          password: password,
          apiKey: apiKey
        }
      });

      if (error) throw error;

      if (data?.success) {
        setIsConnected(true);
        setConnectionStatus("Nilvera bağlantısı başarılı");
        setUsername("");
        setPassword("");
        setApiKey("");
        toast({
          title: "Başarılı",
          description: "Nilvera hesap bilgileri doğrulandı ve kaydedildi",
        });
      } else {
        throw new Error(data?.error || "Bilinmeyen hata");
      }
    } catch (error: any) {
      console.error('Nilvera auth error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Nilvera bağlantısı başarısız",
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
        .from('nilvera_auth')
        .delete()
        .eq('company_id', profile.company_id);

      if (error) throw error;

      setIsConnected(false);
      setConnectionStatus("Nilvera bağlantısı kesildi");
      setNilveraData(null);

      toast({
        title: "Başarılı",
        description: "Nilvera bağlantısı kesildi",
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
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-600 rounded-xl text-white shadow-lg">
              <Key className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                Nilvera E-Fatura Entegrasyonu
              </CardTitle>
              <p className="text-gray-600 text-sm leading-relaxed">
                E-fatura işlemlerinizi otomatikleştirmek için Nilvera hesap bilgilerinizi güvenli şekilde bağlayın
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
            isConnected
              ? 'bg-green-50 border-green-200/80 text-green-900'
              : 'bg-orange-50 border-orange-200/80 text-orange-900'
          }`}>
            {isConnected ? (
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <span className="font-semibold text-sm">{connectionStatus}</span>
              {isConnected && (
                <p className="text-xs opacity-80 mt-1">E-fatura işlemleri kullanılabilir</p>
              )}
            </div>
          </div>

          {!isConnected ? (
            <div className="space-y-4">

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Nilvera Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    Nilvera Şifre
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Şifrenizi girin..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
                    <Plug className="h-4 w-4 text-gray-500" />
                    Nilvera API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="API Key'inizi buraya girin..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <Button
                onClick={handleAuthenticate}
                disabled={loading || !username.trim() || !password.trim() || !apiKey.trim()}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Doğrulanıyor...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4" />
                    Nilvera'ya Bağlan
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {nilveraData && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-900">Hesap Bilgileri</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="h-8 px-3 text-green-700 hover:bg-green-100"
                    >
                      {showCredentials ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Göster
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800">Kullanıcı Adı:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">
                        {showCredentials ? nilveraData.username : '••••••••'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-800">API Key:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">
                        {showCredentials
                          ? `${nilveraData.apiKey.substring(0, 8)}...${nilveraData.apiKey.substring(nilveraData.apiKey.length - 4)}`
                          : '••••••••••••••••'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <NilveraTestConnection />

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full"
              >
                Bağlantıyı Kes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Key className="h-5 w-5 text-white" />
            </div>
            API Key Nasıl Alınır?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl p-5 border border-blue-200/50">
            <ol className="space-y-3 text-sm">
              {[
                "Nilvera paneline giriş yapın",
                "Sol menüden Entegrasyon sekmesine tıklayın",
                "API bölümüne gidin",
                "API Key kısmından key'inizi kopyalayın",
                "Yukarıdaki alana yapıştırıp Bağlan butonuna tıklayın"
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200/50">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <span className="text-base">🔗</span>
                <span><strong>Nilvera Panel:</strong> Hesabınızla giriş yaptıktan sonra bu adımları takip edebilirsiniz.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};