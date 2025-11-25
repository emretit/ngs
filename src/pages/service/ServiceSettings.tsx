import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Clock, 
  Bell,
  User,
  Shield,
  FileText,
  Save
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function ServiceSettings() {
  const { userData } = useCurrentUser();
  const [slaSettings, setSlaSettings] = useState({
    urgentHours: 2,
    highHours: 4,
    mediumHours: 8,
    lowHours: 24,
    warningThreshold: 20, // percentage
  });

  const [notificationSettings, setNotificationSettings] = useState({
    slaWarnings: true,
    slaBreaches: true,
    lowStock: true,
    newService: true,
    serviceCompleted: true,
  });

  const [generalSettings, setGeneralSettings] = useState({
    autoAssignTechnician: false,
    requireCustomerApproval: false,
    defaultPriority: 'medium',
    defaultStatus: 'new',
  });

  const handleSave = () => {
    // Save settings logic
    toast({
      title: 'Başarılı',
      description: 'Ayarlar kaydedildi',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Servis Ayarları</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Servis yönetimi için genel ayarlar ve yapılandırmalar
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="sla">SLA Ayarları</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="permissions">İzinler</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span>Genel Ayarlar</span>
              </CardTitle>
              <CardDescription>
                Servis yönetimi için temel ayarlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Teknisyen Atama</Label>
                  <p className="text-sm text-muted-foreground">
                    Yeni servisler için otomatik teknisyen atansın mı?
                  </p>
                </div>
                <Switch
                  checked={generalSettings.autoAssignTechnician}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, autoAssignTechnician: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Müşteri Onayı Gerekli</Label>
                  <p className="text-sm text-muted-foreground">
                    Servis başlamadan önce müşteri onayı gerekli mi?
                  </p>
                </div>
                <Switch
                  checked={generalSettings.requireCustomerApproval}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, requireCustomerApproval: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Varsayılan Öncelik</Label>
                <Select
                  value={generalSettings.defaultPriority}
                  onValueChange={(value) =>
                    setGeneralSettings({ ...generalSettings, defaultPriority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Varsayılan Durum</Label>
                <Select
                  value={generalSettings.defaultStatus}
                  onValueChange={(value) =>
                    setGeneralSettings({ ...generalSettings, defaultStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Yeni</SelectItem>
                    <SelectItem value="assigned">Atanmış</SelectItem>
                    <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Settings */}
        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>SLA Ayarları</span>
              </CardTitle>
              <CardDescription>
                Öncelik bazlı SLA sürelerini yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Acil Öncelik (Saat)</Label>
                  <Input
                    type="number"
                    value={slaSettings.urgentHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, urgentHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yüksek Öncelik (Saat)</Label>
                  <Input
                    type="number"
                    value={slaSettings.highHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, highHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orta Öncelik (Saat)</Label>
                  <Input
                    type="number"
                    value={slaSettings.mediumHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, mediumHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Düşük Öncelik (Saat)</Label>
                  <Input
                    type="number"
                    value={slaSettings.lowHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, lowHours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Uyarı Eşiği (%)</Label>
                <Input
                  type="number"
                  value={slaSettings.warningThreshold}
                  onChange={(e) =>
                    setSlaSettings({ ...slaSettings, warningThreshold: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  SLA süresinin yüzde kaçı kaldığında uyarı verilsin?
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Bildirim Ayarları</span>
              </CardTitle>
              <CardDescription>
                Hangi bildirimlerin gönderileceğini seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SLA Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">
                    SLA süresi risk altındayken bildirim gönder
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.slaWarnings}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, slaWarnings: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SLA İhlalleri</Label>
                  <p className="text-sm text-muted-foreground">
                    SLA ihlal edildiğinde bildirim gönder
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.slaBreaches}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, slaBreaches: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Düşük Stok Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">
                    Stok seviyesi düşük olduğunda bildirim gönder
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.lowStock}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, lowStock: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yeni Servis Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Yeni servis oluşturulduğunda bildirim gönder
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.newService}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, newService: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Servis Tamamlandı Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Servis tamamlandığında bildirim gönder
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.serviceCompleted}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, serviceCompleted: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>İzinler</span>
              </CardTitle>
              <CardDescription>
                Servis yönetimi için rol bazlı izinler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                İzin yönetimi yakında eklenecek
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  );
}


