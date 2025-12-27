import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingBag,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PurchasingOverviewProps {
  data?: {
    pendingPRs: number;
    pendingRFQs: number;
    pendingPOs: number;
    pendingApprovals: number;
    threeWayMatchIssues: number;
    totalPendingValue: number;
    purchaseRequests: Array<{
      id: string;
      requestNumber: string;
      department: string;
      totalAmount: number;
      status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';
      priority: 'low' | 'normal' | 'high' | 'urgent';
      needByDate?: string;
    }>;
    rfqs: Array<{
      id: string;
      rfqNumber: string;
      vendorCount: number;
      dueDate?: string;
      status: 'draft' | 'sent' | 'received' | 'closed' | 'cancelled';
    }>;
    purchaseOrders: Array<{
      id: string;
      orderNumber: string;
      vendor: string;
      totalAmount: number;
      status: 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';
      matchStatus?: 'matched' | 'partial' | 'unmatched';
    }>;
  };
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'submitted':
    case 'sent':
      return { label: 'Gönderildi', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: Clock };
    case 'approved':
      return { label: 'Onaylandı', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 };
    case 'draft':
      return { label: 'Taslak', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', icon: FileText };
    case 'received':
      return { label: 'Alındı', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', icon: Package };
    default:
      return { label: 'Bekliyor', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Acil', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' };
    case 'high':
      return { label: 'Yüksek', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' };
    case 'normal':
      return { label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' };
    default:
      return { label: 'Düşük', color: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400' };
  }
};

export const PurchasingOverview = memo(({ data, isLoading }: PurchasingOverviewProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    pendingPRs: 8,
    pendingRFQs: 5,
    pendingPOs: 12,
    pendingApprovals: 6,
    threeWayMatchIssues: 3,
    totalPendingValue: 450000,
    purchaseRequests: [
      {
        id: '1',
        requestNumber: 'PR-2024-001',
        department: 'Üretim',
        totalAmount: 85000,
        status: 'submitted' as const,
        priority: 'high' as const,
        needByDate: '2024-01-20'
      },
      {
        id: '2',
        requestNumber: 'PR-2024-002',
        department: 'IT',
        totalAmount: 45000,
        status: 'submitted' as const,
        priority: 'urgent' as const,
        needByDate: '2024-01-15'
      },
      {
        id: '3',
        requestNumber: 'PR-2024-003',
        department: 'Satın Alma',
        totalAmount: 120000,
        status: 'approved' as const,
        priority: 'normal' as const
      }
    ],
    rfqs: [
      {
        id: '1',
        rfqNumber: 'RFQ-2024-001',
        vendorCount: 3,
        dueDate: '2024-01-18',
        status: 'sent' as const
      },
      {
        id: '2',
        rfqNumber: 'RFQ-2024-002',
        vendorCount: 5,
        dueDate: '2024-01-20',
        status: 'sent' as const
      }
    ],
    purchaseOrders: [
      {
        id: '1',
        orderNumber: 'PO-2024-001',
        vendor: 'ABC Tedarik A.Ş.',
        totalAmount: 125000,
        status: 'approved' as const,
        matchStatus: 'matched' as const
      },
      {
        id: '2',
        orderNumber: 'PO-2024-002',
        vendor: 'XYZ Lojistik Ltd.',
        totalAmount: 85000,
        status: 'received' as const,
        matchStatus: 'partial' as const
      },
      {
        id: '3',
        orderNumber: 'PO-2024-003',
        vendor: 'DEF Malzeme A.Ş.',
        totalAmount: 95000,
        status: 'approved' as const,
        matchStatus: 'unmatched' as const
      }
    ]
  };

  const { pendingPRs, pendingRFQs, pendingPOs, pendingApprovals, threeWayMatchIssues, totalPendingValue, purchaseRequests, rfqs, purchaseOrders } = mockData;
  const urgentPRs = purchaseRequests.filter(pr => pr.priority === 'urgent').length;
  const unmatchedPOs = purchaseOrders.filter(po => po.matchStatus === 'unmatched' || po.matchStatus === 'partial').length;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <ShoppingBag className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Satın Alma Özeti</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Bekleyen PR, RFQ, PO onayları ve 3-way match
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                PR
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{pendingPRs}</p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              Bekleyen
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-purple-600" />
              <p className="text-[9px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">
                RFQ
              </p>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{pendingRFQs}</p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">
              Açık
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingBag className="h-3 w-3 text-emerald-600" />
              <p className="text-[9px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                PO
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{pendingPOs}</p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              Aktif
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-amber-600" />
              <p className="text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Onay
              </p>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{pendingApprovals}</p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">
              Bekleyen
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Pending Approvals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Bekleyen Onaylar</h4>
            {urgentPRs > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {urgentPRs} Acil
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/purchasing/approvals')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {purchaseRequests.filter(pr => pr.status === 'submitted').length > 0 ? (
              purchaseRequests
                .filter(pr => pr.status === 'submitted')
                .slice(0, 3)
                .map((pr) => {
                  const priority = getPriorityConfig(pr.priority);
                  const isUrgent = pr.priority === 'urgent';
                  
                  return (
                    <div
                      key={pr.id}
                      onClick={() => navigate(`/purchasing/requests/${pr.id}`)}
                      className={cn(
                        "group p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                        isUrgent 
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                          : "bg-card border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                            <h5 className="text-sm font-semibold text-foreground truncate">
                              {pr.requestNumber}
                            </h5>
                            <Badge className={cn("h-4 px-1.5 text-[9px]", priority.color)}>
                              {priority.label}
                            </Badge>
                            {isUrgent && (
                              <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                                Acil!
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {pr.department}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{formatCurrency(pr.totalAmount)}</span>
                            {pr.needByDate && (
                              <span>
                                Gerekli: {format(new Date(pr.needByDate), 'd MMM', { locale: tr })}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="p-4 text-center border border-border/50 rounded-lg bg-muted/30">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Bekleyen onay yok</p>
              </div>
            )}
          </div>
        </div>

        {/* 3-Way Match Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">3-Way Match Durumu</h4>
            {unmatchedPOs > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {unmatchedPOs} Uyumsuz
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {purchaseOrders.length > 0 ? (
              purchaseOrders.slice(0, 3).map((po) => {
                const matchConfig = {
                  matched: { label: 'Eşleşti', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
                  partial: { label: 'Kısmi', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: AlertTriangle },
                  unmatched: { label: 'Eşleşmedi', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: AlertTriangle }
                };
                const match = po.matchStatus ? matchConfig[po.matchStatus] : matchConfig.matched;
                const MatchIcon = match.icon;

                return (
                  <div
                    key={po.id}
                    onClick={() => navigate(`/purchasing/orders/${po.id}`)}
                    className="group p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-sm bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <p className="text-xs font-semibold text-foreground truncate">
                            {po.orderNumber}
                          </p>
                          <Badge className={cn("h-4 px-1.5 text-[9px]", match.color)}>
                            <MatchIcon className="h-2.5 w-2.5 mr-0.5" />
                            {match.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="truncate">{po.vendor}</span>
                          <span className="font-semibold text-foreground ml-2">
                            {formatCurrency(po.totalAmount)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center border border-border/50 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground">Sipariş bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Total Pending Value */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Toplam Bekleyen Değer</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(totalPendingValue)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {threeWayMatchIssues > 0 && (
              <span className="text-red-600 font-semibold">{threeWayMatchIssues} 3-way match sorunu var!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/purchasing')}
            className="gap-1.5 h-7 text-xs"
          >
            Satın Alma Yönetimi
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

PurchasingOverview.displayName = "PurchasingOverview";

