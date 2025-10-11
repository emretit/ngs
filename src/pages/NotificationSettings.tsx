import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, CheckCircle2 } from "lucide-react";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  activity_notifications: boolean;
  proposal_notifications: boolean;
  customer_notifications: boolean;
  employee_notifications: boolean;
  system_notifications: boolean;
}

const NotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to get existing settings
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_settings")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Return settings or default values
      return (data?.notification_settings as NotificationSettings) || {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        activity_notifications: true,
        proposal_notifications: true,
        customer_notifications: true,
        employee_notifications: false,
        system_notifications: true,
      };
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("profiles")
        .update({ notification_settings: newSettings })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({
        title: "Ayarlar kaydedildi",
        description: "Bildirim tercihleri başarıyla güncellendi",
      });
    },
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };

    updateSettingsMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Bildirim Ayarları</h2>
        <p className="text-muted-foreground">
          Bildirim tercihlerinizi yönetin
        </p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirim Kanalları
          </CardTitle>
          <CardDescription>
            Bildirimleri hangi kanallardan almak istediğinizi seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-posta Bildirimleri
              </Label>
              <p className="text-sm text-muted-foreground">
                Önemli güncellemeler için e-posta alın
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={() => handleToggle("email_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Bildirimleri
              </Label>
              <p className="text-sm text-muted-foreground">
                Tarayıcıda anlık bildirimler alın
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={() => handleToggle("push_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS Bildirimleri
              </Label>
              <p className="text-sm text-muted-foreground">
                Acil durumlar için SMS alın
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={settings.sms_notifications}
              onCheckedChange={() => handleToggle("sms_notifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Bildirim Türleri
          </CardTitle>
          <CardDescription>
            Hangi tür bildirimleri almak istediğinizi seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activity-notifications">Aktivite Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Görevler ve aktiviteler için bildirimler
              </p>
            </div>
            <Switch
              id="activity-notifications"
              checked={settings.activity_notifications}
              onCheckedChange={() => handleToggle("activity_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="proposal-notifications">Teklif Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Yeni teklifler ve güncellemeler
              </p>
            </div>
            <Switch
              id="proposal-notifications"
              checked={settings.proposal_notifications}
              onCheckedChange={() => handleToggle("proposal_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="customer-notifications">Müşteri Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Müşteri etkileşimleri ve güncellemeler
              </p>
            </div>
            <Switch
              id="customer-notifications"
              checked={settings.customer_notifications}
              onCheckedChange={() => handleToggle("customer_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="employee-notifications">Çalışan Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                İnsan kaynakları ve personel güncellemeleri
              </p>
            </div>
            <Switch
              id="employee-notifications"
              checked={settings.employee_notifications}
              onCheckedChange={() => handleToggle("employee_notifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-notifications">Sistem Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Önemli sistem güncellemeleri ve bakım bildirimleri
              </p>
            </div>
            <Switch
              id="system-notifications"
              checked={settings.system_notifications}
              onCheckedChange={() => handleToggle("system_notifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
          <CardDescription>
            Tüm bildirimleri tek seferde yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const allEnabled: NotificationSettings = {
                email_notifications: true,
                push_notifications: true,
                sms_notifications: true,
                activity_notifications: true,
                proposal_notifications: true,
                customer_notifications: true,
                employee_notifications: true,
                system_notifications: true,
              };
              updateSettingsMutation.mutate(allEnabled);
            }}
          >
            Tümünü Aç
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allDisabled: NotificationSettings = {
                email_notifications: false,
                push_notifications: false,
                sms_notifications: false,
                activity_notifications: false,
                proposal_notifications: false,
                customer_notifications: false,
                employee_notifications: false,
                system_notifications: false,
              };
              updateSettingsMutation.mutate(allDisabled);
            }}
          >
            Tümünü Kapat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
