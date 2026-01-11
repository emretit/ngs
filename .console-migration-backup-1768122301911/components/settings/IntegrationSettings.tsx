import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  Plus,
  HardDrive,
  Share2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getGoogleDriveConnection,
  initiateGoogleDriveOAuth,
  disconnectGoogleDrive
} from '@/services/integrations/googleDriveService';
import {
  getSharePointConnection,
  initiateSharePointOAuth,
  disconnectSharePoint
} from '@/services/integrations/sharePointService';
import {
  getTeamsConnection,
  initiateTeamsOAuth,
  disconnectTeams,
  getTeamsWebhooks,
  addTeamsWebhook,
  type TeamsWebhookConfig
} from '@/services/integrations/teamsService';
import { useToast } from '@/hooks/use-toast';

interface PlatformConfig {
  id: 'google_drive' | 'sharepoint' | 'teams';
  name: string;
  description: string;
  icon: typeof HardDrive;
  color: string;
  scopes: string[];
  features: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Google Drive dosyalarına erişin ve AI ile analiz edin',
    icon: HardDrive,
    color: 'text-blue-600',
    scopes: [
      'Drive dosyalarını okuma',
      'Dosya meta verilerine erişim',
      'Arama ve listeleme'
    ],
    features: [
      'Dosya arama ve önizleme',
      'AI doküman analizi',
      'Drive içeriğini AI\'a sorabilme',
      'Otomatik doküman indeksleme'
    ]
  },
  {
    id: 'sharepoint',
    name: 'SharePoint / OneDrive',
    description: 'SharePoint ve OneDrive dosyalarına erişin',
    icon: Share2,
    color: 'text-purple-600',
    scopes: [
      'SharePoint sitelerine erişim',
      'OneDrive dosyaları okuma',
      'Dosya arama'
    ],
    features: [
      'SharePoint doküman kütüphanesi',
      'OneDrive entegrasyonu',
      'Cross-platform arama',
      'Workflow doküman yükleme'
    ]
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Teams bildirimlerini otomatikleştirin',
    icon: MessageSquare,
    color: 'text-indigo-600',
    scopes: [
      'Channel mesajları gönderme',
      'Team bilgilerine erişim',
      'Incoming webhook desteği'
    ],
    features: [
      'Workflow tamamlama bildirimleri',
      'Onay talepleri',
      'AI insight uyarıları',
      'Özel bildirimler'
    ]
  }
];

export function IntegrationSettings() {
  const [googleConnection, setGoogleConnection] = useState<any>(null);
  const [sharePointConnection, setSharePointConnection] = useState<any>(null);
  const [teamsConnection, setTeamsConnection] = useState<any>(null);
  const [teamsWebhooks, setTeamsWebhooks] = useState<TeamsWebhookConfig[]>([]);

  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    platform: string;
    connectionId?: string;
  }>({ open: false, platform: '' });

  const [webhookDialog, setWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', channelName: '' });

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const [google, sharepoint, teams, webhooks] = await Promise.all([
        getGoogleDriveConnection(),
        getSharePointConnection(),
        getTeamsConnection(),
        getTeamsWebhooks()
      ]);

      setGoogleConnection(google);
      setSharePointConnection(sharepoint);
      setTeamsConnection(teams);
      setTeamsWebhooks(webhooks);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platformId: string) => {
    switch (platformId) {
      case 'google_drive':
        initiateGoogleDriveOAuth();
        break;
      case 'sharepoint':
        initiateSharePointOAuth();
        break;
      case 'teams':
        initiateTeamsOAuth();
        break;
    }
  };

  const handleDisconnect = async () => {
    try {
      const { platform, connectionId } = disconnectDialog;
      if (!connectionId) return;

      let success = false;

      switch (platform) {
        case 'google_drive':
          success = await disconnectGoogleDrive(connectionId);
          break;
        case 'sharepoint':
          success = await disconnectSharePoint(connectionId);
          break;
        case 'teams':
          success = await disconnectTeams(connectionId);
          break;
      }

      if (success) {
        toast({
          title: 'Bağlantı Kesildi',
          description: `${platform} entegrasyonu başarıyla kaldırıldı.`
        });
        await loadConnections();
      } else {
        throw new Error('Disconnect failed');
      }
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Bağlantı kesilemedi.',
        variant: 'destructive'
      });
    } finally {
      setDisconnectDialog({ open: false, platform: '' });
    }
  };

  const handleAddWebhook = async () => {
    try {
      if (!newWebhook.url || !newWebhook.channelName) {
        toast({
          title: 'Eksik Bilgi',
          description: 'Webhook URL ve kanal adı gerekli.',
          variant: 'destructive'
        });
        return;
      }

      const success = await addTeamsWebhook(newWebhook.url, newWebhook.channelName);

      if (success) {
        toast({
          title: 'Webhook Eklendi',
          description: 'Teams webhook başarıyla eklendi.'
        });
        setWebhookDialog(false);
        setNewWebhook({ url: '', channelName: '' });
        await loadConnections();
      } else {
        throw new Error('Add webhook failed');
      }
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'Webhook eklenemedi.',
        variant: 'destructive'
      });
    }
  };

  const getConnectionForPlatform = (platformId: string) => {
    switch (platformId) {
      case 'google_drive':
        return googleConnection;
      case 'sharepoint':
        return sharePointConnection;
      case 'teams':
        return teamsConnection;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Platform Entegrasyonları</h1>
        <p className="text-muted-foreground">
          AI Agent'ınızı harici platformlarla entegre edin
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-6">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const connection = getConnectionForPlatform(platform.id);
          const isConnected = !!connection;

          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-lg bg-gray-100', platform.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Bağlı
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDisconnectDialog({
                              open: true,
                              platform: platform.name,
                              connectionId: connection.id
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Bağlantıyı Kes
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Bağlı Değil
                        </Badge>
                        <Button onClick={() => handleConnect(platform.id)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Bağlan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Connection Details */}
                {isConnected && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Bağlantı Bilgileri</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kullanıcı</p>
                        <p className="font-medium">{connection.connection_name || 'Varsayılan'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bağlanma Tarihi</p>
                        <p className="font-medium">
                          {new Date(connection.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    {connection.last_sync_at && (
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Son senkronizasyon:{' '}
                          {new Date(connection.last_sync_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* OAuth Scopes */}
                <div>
                  <p className="text-sm font-medium mb-2">İzinler</p>
                  <div className="flex flex-wrap gap-2">
                    {platform.scopes.map((scope, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-medium mb-2">Özellikler</p>
                  <ul className="space-y-1">
                    {platform.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Teams Webhooks */}
                {platform.id === 'teams' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Incoming Webhooks</p>
                      <Button size="sm" variant="outline" onClick={() => setWebhookDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Webhook Ekle
                      </Button>
                    </div>

                    {teamsWebhooks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Henüz webhook eklenmedi</p>
                    ) : (
                      <div className="space-y-2">
                        {teamsWebhooks.map((webhook) => (
                          <div
                            key={webhook.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="text-sm font-medium">{webhook.channel_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {webhook.webhook_url.substring(0, 50)}...
                              </p>
                            </div>
                            <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                              {webhook.is_active ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Güvenlik ve Gizlilik</p>
              <p className="text-sm text-blue-700">
                Tüm OAuth token'ları Supabase Vault kullanılarak şifrelenir. PAFTA hiçbir zaman
                verilerinizi eğitim için kullanmaz. Entegrasyonlar sadece okuma izinleri gerektirir
                ve istediğiniz zaman bağlantıyı kesebilirsiniz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialog.open} onOpenChange={(open) => setDisconnectDialog({ ...disconnectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bağlantıyı Kes</DialogTitle>
            <DialogDescription>
              {disconnectDialog.platform} entegrasyonunu kaldırmak istediğinizden emin misiniz? Bu işlem
              geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog({ open: false, platform: '' })}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Bağlantıyı Kes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Dialog */}
      <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teams Webhook Ekle</DialogTitle>
            <DialogDescription>
              Bildirimler almak için Teams kanalınıza Incoming Webhook ekleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://outlook.office.com/webhook/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelName">Kanal Adı</Label>
              <Input
                id="channelName"
                value={newWebhook.channelName}
                onChange={(e) => setNewWebhook({ ...newWebhook, channelName: e.target.value })}
                placeholder="Genel"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <p className="font-medium mb-1">Webhook nasıl alınır?</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Teams'de kanal ayarlarını açın</li>
                <li>Connectors → Incoming Webhook ekleyin</li>
                <li>URL'yi kopyalayın ve buraya yapıştırın</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleAddWebhook}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
