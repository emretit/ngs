import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Search,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { InsightFeed } from '@/components/ai/InsightFeed';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function AIInsights() {
  const [companyId, setCompanyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyId();
  }, []);

  const loadCompanyId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
      }
    } catch (err) {
      console.error('Error loading company:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      // Trigger insight generation via Edge Function
      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { company_id: companyId, job_type: 'manual' }
      });

      if (error) throw error;

      toast({
        title: 'İçgörüler Güncelleniyor',
        description: 'Yeni içgörüler oluşturuluyor, birkaç saniye içinde görünecek.'
      });

      // Wait 3 seconds then reload
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      toast({
        title: 'Hata',
        description: 'İçgörüler güncellenemedi.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8" />
            AI İçgörüleri
          </h1>
          <p className="text-muted-foreground">
            Proaktif iş zekası ve aksiyon önerileri
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam İçgörü</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kritik</p>
                <p className="text-2xl font-bold text-red-600">-</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fırsatlar</p>
                <p className="text-2xl font-bold text-green-600">-</p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">İşlenen</p>
                <p className="text-2xl font-bold text-gray-600">-</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İçgörülerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">AI Powered İş Zekası</p>
              <p className="text-sm text-blue-700">
                Bu sayfa verilerinizi sürekli analiz ederek anomalileri tespit eder, tahminler yapar ve
                optimizasyon önerileri sunar. İçgörüler her gün otomatik olarak güncellenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Feed */}
      <div>
        <InsightFeed companyId={companyId} showFilters={true} />
      </div>
    </div>
  );
}
