import { 
  LogIn, 
  LogOut, 
  Eye, 
  Send, 
  ShoppingCart, 
  Download, 
  Upload,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupplierPortalActivities } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SupplierPortalActivityLogProps {
  supplierId: string;
}

const activityConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  login: { label: 'Giriş Yaptı', icon: LogIn, color: 'text-emerald-600' },
  logout: { label: 'Çıkış Yaptı', icon: LogOut, color: 'text-slate-600' },
  view_rfq: { label: 'RFQ Görüntüledi', icon: Eye, color: 'text-blue-600' },
  submit_quote: { label: 'Teklif Gönderdi', icon: Send, color: 'text-purple-600' },
  view_order: { label: 'Sipariş Görüntüledi', icon: ShoppingCart, color: 'text-amber-600' },
  download_document: { label: 'Doküman İndirdi', icon: Download, color: 'text-cyan-600' },
  upload_document: { label: 'Doküman Yükledi', icon: Upload, color: 'text-indigo-600' },
};

export default function SupplierPortalActivityLog({ supplierId }: SupplierPortalActivityLogProps) {
  const { data: activities, isLoading } = useSupplierPortalActivities(supplierId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-600" />
            Portal Aktiviteleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600" />
          Portal Aktiviteleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p>Henüz aktivite kaydı yok</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const config = activityConfig[activity.activity_type] || {
                label: activity.activity_type,
                icon: Activity,
                color: 'text-slate-600',
              };
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{config.label}</span>
                      {activity.object_type && activity.object_id && (
                        <Badge variant="outline" className="text-xs">
                          {activity.object_type}: {activity.object_id.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>
                        {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </span>
                      {activity.ip_address && (
                        <>
                          <span>•</span>
                          <span>{activity.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

