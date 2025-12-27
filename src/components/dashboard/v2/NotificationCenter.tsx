import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Users,
  DollarSign,
  FileText,
  Package,
  X,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'system' | 'finance' | 'sales' | 'inventory' | 'team';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (id: string, route?: string) => void;
}

const notificationTypeConfig = {
  success: { 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  info: { 
    icon: Info, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  error: { 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  }
};

const categoryConfig = {
  system: { label: 'Sistem', icon: Bell, color: 'bg-gray-100 text-gray-700' },
  finance: { label: 'Finans', icon: DollarSign, color: 'bg-green-100 text-green-700' },
  sales: { label: 'Satış', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  inventory: { label: 'Stok', icon: Package, color: 'bg-purple-100 text-purple-700' },
  team: { label: 'Ekip', icon: Users, color: 'bg-orange-100 text-orange-700' }
};

export const NotificationCenter = memo(({ 
  notifications: propNotifications, 
  onMarkAsRead, 
  onDismiss, 
  onAction 
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['category']>('all');

  // Mock data
  const mockNotifications: Notification[] = propNotifications || [
    {
      id: '1',
      type: 'warning',
      category: 'finance',
      title: 'Vadesi Yaklaşan Fatura',
      message: 'ABC Teknoloji A.Ş. firmasının 45,000 TL tutarındaki faturası 3 gün içinde vadesi dolacak.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: 'Görüntüle',
      actionRoute: '/invoices'
    },
    {
      id: '2',
      type: 'success',
      category: 'sales',
      title: 'Yeni Sipariş Onaylandı',
      message: 'XYZ Holding\'den gelen 125,000 TL tutarındaki sipariş onaylandı.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: 'Detay',
      actionRoute: '/orders/list'
    },
    {
      id: '3',
      type: 'error',
      category: 'inventory',
      title: 'Kritik Stok Seviyesi',
      message: '5 üründe stok seviyesi kritik düzeyin altına düştü. Acil tedarik gerekiyor.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: 'İncele',
      actionRoute: '/inventory'
    },
    {
      id: '4',
      type: 'info',
      category: 'team',
      title: 'Yeni Görev Atandı',
      message: 'Ahmet Yılmaz tarafından size "Müşteri sunumu hazırla" görevi atandı.',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: 'Göster',
      actionRoute: '/activities'
    },
    {
      id: '5',
      type: 'info',
      category: 'system',
      title: 'Sistem Güncellemesi',
      message: 'Dashboard V2 sistemi başarıyla güncellendi. Yeni özellikler kullanıma hazır.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: '6',
      type: 'warning',
      category: 'finance',
      title: 'Bütçe Aşımı Uyarısı',
      message: 'Operasyonel giderler bütçesinin %85\'i kullanıldı.',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: 'Bütçe',
      actionRoute: '/budget'
    }
  ];

  const filteredNotifications = mockNotifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.category === filter;
  });

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Bell className="h-4.5 w-4.5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Bildirim Merkezi</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {filteredNotifications.length} bildirim • {unreadCount} okunmamış
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                mockNotifications.forEach(n => onMarkAsRead?.(n.id));
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tümünü Okundu İşaretle
            </Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mt-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter('all')}
            >
              Tümü ({mockNotifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter('unread')}
            >
              Okunmamış ({unreadCount})
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = mockNotifications.filter(n => n.category === key).length;
              return (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setFilter(key as any)}
                >
                  <Icon className="h-3 w-3" />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm">Bildirim bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredNotifications.map((notification) => {
              const typeConfig = notificationTypeConfig[notification.type];
              const TypeIcon = typeConfig.icon;
              const category = categoryConfig[notification.category];
              const CategoryIcon = category.icon;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 transition-all duration-200",
                    notification.isRead 
                      ? "bg-background border-border opacity-60 hover:opacity-100" 
                      : `${typeConfig.bgColor} ${typeConfig.borderColor}`,
                    "hover:shadow-md"
                  )}
                >
                  {/* Dismiss Button */}
                  <button
                    onClick={() => onDismiss?.(notification.id)}
                    className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", typeConfig.color, "bg-background/80")}>
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "text-sm font-semibold truncate",
                              !notification.isRead && "font-bold"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <Badge className={cn("text-[10px] px-2 py-0.5 gap-1", category.color)}>
                            <CategoryIcon className="h-3 w-3" />
                            {category.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.timestamp), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => onMarkAsRead?.(notification.id)}
                            >
                              Okundu İşaretle
                            </Button>
                          )}
                          {notification.actionLabel && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              onClick={() => onAction?.(notification.id, notification.actionRoute)}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
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
});

NotificationCenter.displayName = "NotificationCenter";

