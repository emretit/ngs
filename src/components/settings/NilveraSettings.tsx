import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Key } from "lucide-react";

export const NilveraSettings = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
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
      } else {
        setIsConnected(false);
        setConnectionStatus("Nilvera bağlantısı yok");
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Nilvera E-Fatura Entegrasyonu
          </CardTitle>
          <CardDescription>
            E-fatura işlemlerinizi gerçekleştirmek için Nilvera hesap bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className="text-sm font-medium">{connectionStatus}</span>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nilvera Kullanıcı Adı</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Kullanıcı adınızı girin..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nilvera Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Şifrenizi girin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Nilvera API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="API Key'inizi buraya girin..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  API Key'inizi Nilvera panel - Entegrasyon - API bölümünden alabilirsiniz
                </p>
              </div>

              <Button 
                onClick={handleAuthenticate} 
                disabled={loading || !username.trim() || !password.trim() || !apiKey.trim()}
                className="w-full"
              >
                {loading ? "Doğrulanıyor..." : "Bağlan"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Nilvera bağlantınız aktif. E-fatura işlemlerini gerçekleştirebilirsiniz.
                </p>
              </div>

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

      <Card>
        <CardHeader>
          <CardTitle>API Key Nasıl Alınır?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Nilvera paneline giriş yapın</li>
            <li>Sol menüden Entegrasyon sekmesine tıklayın</li>
            <li>API bölümüne gidin</li>
            <li>API Key kısmından key'inizi kopyalayın</li>
            <li>Yukarıdaki alana yapıştırıp Bağlan butonuna tıklayın</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};