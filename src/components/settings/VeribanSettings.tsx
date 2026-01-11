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

export const VeribanSettings = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [webserviceUrl, setWebserviceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [veribanData, setVeribanData] = useState<{username: string, password: string, webserviceUrl: string} | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  // Check if user already has Veriban authentication
  useEffect(() => {
    checkVeribanStatus();
  }, []);

  // Test mode değiştiğinde webservice URL'i otomatik güncelle
  useEffect(() => {
    if (testMode) {
      setWebserviceUrl("https://efaturatransfertest.veriban.com.tr/IntegrationService.svc");
    } else {
      setWebserviceUrl("https://efaturatransfer.veriban.com.tr/IntegrationService.svc");
    }
  }, [testMode]);

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
        .maybeSingle();

      if (data && !error) {
        setIsConnected(data.is_active || false);
        setHasSavedCredentials(true);
        setConnectionStatus(data.is_active ? "Veriban bağlantısı aktif" : "Veriban bilgileri kaydedilmiş (bağlı değil)");
        setVeribanData({
          username: data.username,
          password: data.password || "",
          webserviceUrl: data.webservice_url
        });
        // Form alanlarına kaydedilmiş verileri yükle
        setUsername(data.username);
        setPassword(""); // Güvenlik için password gösterilmiyor, kullanıcı yeni girmeli
        setTestMode(data.test_mode || false);
        setWebserviceUrl(data.webservice_url || "");
      } else {
        setIsConnected(false);
        setHasSavedCredentials(false);
        setConnectionStatus("Veriban bilgileri kaydedilmemiş");
        setVeribanData(null);
      }
    } catch (error) {
      logger.error('Error checking Veriban status:', error);
    }
  };

  const handleSaveCredentials = async () => {
      if (!username.trim()) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Lütfen kullanıcı adı alanını doldurun",
        });
        return;
      }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      // Get user's company_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.company_id) {
        throw new Error("Şirket profili bulunamadı");
      }

      // Check if record exists and get current password if password field is empty
      const { data: existing } = await supabase
        .from('veriban_auth')
        .select('id, password')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      // Password boşsa ve kayıtlı veri varsa, mevcut password'u kullan
      let passwordToSave = password.trim();
      if (!passwordToSave && existing) {
        passwordToSave = existing.password;
      }

      if (!passwordToSave) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Lütfen şifre alanını doldurun",
        });
        setSaving(false);
        return;
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('veriban_auth')
          .update({
            username: username.trim(),
            password: passwordToSave,
            webservice_url: webserviceUrl || (testMode 
              ? "https://efaturatransfertest.veriban.com.tr/IntegrationService.svc"
              : "https://efaturatransfer.veriban.com.tr/IntegrationService.svc"
            ),
            test_mode: testMode,
            is_active: false, // Kaydetme sırasında bağlı değil
            updated_at: new Date().toISOString()
          })
          .eq('company_id', profile.company_id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('veriban_auth')
          .insert({
            user_id: session.user.id,
            company_id: profile.company_id,
            username: username.trim(),
            password: passwordToSave,
            webservice_url: webserviceUrl || (testMode 
              ? "https://efaturatransfertest.veriban.com.tr/IntegrationService.svc"
              : "https://efaturatransfer.veriban.com.tr/IntegrationService.svc"
            ),
            test_mode: testMode,
            is_active: false // Kaydetme sırasında bağlı değil
          });

        if (error) throw error;
      }

      setHasSavedCredentials(true);
      setConnectionStatus("Veriban bilgileri kaydedildi (bağlı değil)");
      
      // veribanData'yı güncelle
      setVeribanData({
        username: username.trim(),
        password: passwordToSave,
        webserviceUrl: webserviceUrl || (testMode 
          ? "https://efaturatransfertest.veriban.com.tr/IntegrationService.svc"
          : "https://efaturatransfer.veriban.com.tr/IntegrationService.svc"
        )
      });
      
      toast({
        title: "Başarılı",
        description: "Veriban bilgileri kaydedildi. Şimdi 'Bağlan' butonuna tıklayarak bağlantıyı test edebilirsiniz.",
      });
      
      await checkVeribanStatus(); // Refresh status
    } catch (error: any) {
      logger.error('❌ Veriban kaydetme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Bilgiler kaydedilirken hata oluştu",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!hasSavedCredentials) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Önce bilgileri kaydedin",
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

      // Get saved credentials from database
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
        .select('username, password, test_mode, webservice_url')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (!authData) {
        throw new Error("Kayıtlı Veriban bilgileri bulunamadı. Lütfen önce bilgileri kaydedin.");
      }

      logger.debug('🔐 Veriban auth edge function çağrılıyor...');
      logger.debug('📡 Test Mode:', authData.test_mode);
      logger.debug('👤 Username:', authData.username);

      const requestBody = {
        action: 'authenticate',
        username: authData.username,
        password: authData.password,
        testMode: authData.test_mode || false
      };
      
      logger.debug('📤 Request body:', requestBody);

      const { data, error } = await supabase.functions.invoke('veriban-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: requestBody,
      });

      logger.debug('✅ Edge function response:', { data, error });
      logger.debug('📋 Full error object:', JSON.stringify(error, null, 2));
      logger.debug('📋 Full data object:', JSON.stringify(data, null, 2));

      if (error) {
        logger.error('❌ Edge function error details:', error);
        logger.error('❌ Error context:', error.context);
        logger.error('❌ Error message:', error.message);

        // Try to get response body if available
        if (error.context instanceof Response) {
          try {
            const responseText = await error.context.text();
            logger.error('❌ Response body:', responseText);
            try {
              const responseJson = JSON.parse(responseText);
              if (responseJson.error) {
                setConnectionStatus(`Bağlantı hatası: ${responseJson.error}`);
                throw new Error(responseJson.error);
              }
            } catch (e) {
              // Not JSON, use text as is
              if (responseText) {
                setConnectionStatus(`Bağlantı hatası: ${responseText}`);
                throw new Error(responseText);
              }
            }
          } catch (e) {
            logger.error('❌ Could not read response body:', e);
          }
        }

        // Extract error message from different error formats
        let errorMessage = "Veriban bağlantısı başarısız";
        if (error.context?.body?.error) {
          errorMessage = error.context.body.error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        setConnectionStatus(`Bağlantı hatası: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Check if data contains error even if no error object
      if (data && !data.success && data.error) {
        logger.error('❌ Edge function returned error in data:', data.error);
        setConnectionStatus(`❌ ${data.error}`);
        throw new Error(data.error);
      }

      if (data?.success) {
        // Update is_active to true
        const { error: updateError } = await supabase
          .from('veriban_auth')
          .update({ is_active: true })
          .eq('company_id', profile.company_id);

        if (updateError) {
          logger.error('is_active güncelleme hatası:', updateError);
        }

        setIsConnected(true);
        setConnectionStatus("✅ Veriban bağlantısı başarılı");
        await checkVeribanStatus(); // Refresh status
        toast({
          title: "Başarılı",
          description: "Veriban bağlantısı başarıyla kuruldu",
        });
      } else {
        const errorMsg = data?.error || "Bilinmeyen hata";
        setConnectionStatus(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      logger.error('❌ Veriban auth error:', error);
      
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
        .maybeSingle();

      if (!authData) {
        throw new Error("Kayıtlı Veriban bilgileri bulunamadı");
      }

      logger.debug('🧪 Mevcut bağlantı test ediliyor...');

      const { data, error } = await supabase.functions.invoke('veriban-auth', {
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
      logger.error('❌ Bağlantı testi hatası:', error);
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

      // Sadece is_active'i false yap, kayıtları silme
      const { error } = await supabase
        .from('veriban_auth')
        .update({ is_active: false })
        .eq('company_id', profile.company_id);

      if (error) throw error;

      setIsConnected(false);
      setConnectionStatus("Veriban bağlantısı kesildi (bilgiler kayıtlı)");

      toast({
        title: "Başarılı",
        description: "Veriban bağlantısı kesildi. Bilgiler kayıtlı kaldı.",
      });
      
      await checkVeribanStatus(); // Refresh status
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

        {/* Hesap Bilgileri - Kart Başında */}
        {veribanData && hasSavedCredentials && (
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
                <span className="text-green-800">Şifre:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded text-xs">
                  {showCredentials ? veribanData.password : '••••••••'}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isConnected || hasSavedCredentials ? (
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
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-blue-900">
                    Webservice URL
                  </Label>
                  <p className="text-xs text-blue-800 font-mono break-all">
                    {webserviceUrl || (testMode
                      ? "https://efaturatransfertest.veriban.com.tr/IntegrationService.svc"
                      : "https://efaturatransfer.veriban.com.tr/IntegrationService.svc"
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Test modu değiştiğinde otomatik güncellenir
                  </p>
                </div>
              </div>

              {testMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-900">
                    <strong>Test Hesabı:</strong> TESTER@VRBN / Vtest*2020*
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveCredentials}
                disabled={saving || !username.trim() || !password.trim()}
                variant="outline"
                className="flex-1 h-10"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Kaydediliyor...
                  </div>
                ) : (
                  "Kaydet"
                )}
              </Button>
              <Button
                onClick={handleAuthenticate}
                disabled={loading || !hasSavedCredentials}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Bağlanıyor...
                  </div>
                ) : (
                  "Bağlan"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isConnected && (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full h-10"
                size="sm"
              >
                Bağlantıyı Kes
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

