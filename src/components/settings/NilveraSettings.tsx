import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
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
        .maybeSingle();

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
                  placeholder="Kullanıcı adınızı girin"
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
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="API Key'inizi girin"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <Button
              onClick={handleAuthenticate}
              disabled={loading || !username.trim() || !password.trim() || !apiKey.trim()}
              className="w-full h-10 bg-green-600 hover:bg-green-700"
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
            {nilveraData && (
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
                      {showCredentials ? nilveraData.username : '••••••••'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">API Key:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-xs">
                      {showCredentials
                        ? `${nilveraData.apiKey.substring(0, 8)}...${nilveraData.apiKey.substring(nilveraData.apiKey.length - 4)}`
                        : '••••••••'
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