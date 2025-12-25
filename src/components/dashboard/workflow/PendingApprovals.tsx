import { FileCheck, AlertCircle, Clock, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Approval {
  id: string;
  type: 'proposal' | 'expense' | 'purchase' | 'leave' | 'budget';
  title: string;
  description: string;
  amount?: number;
  requester: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

interface PendingApprovalsProps {
  approvals: Approval[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const typeConfig = {
  proposal: { label: 'Teklif', color: 'text-blue-600 bg-blue-50', icon: '📄' },
  expense: { label: 'Masraf', color: 'text-amber-600 bg-amber-50', icon: '💰' },
  purchase: { label: 'Satın Alma', color: 'text-purple-600 bg-purple-50', icon: '🛒' },
  leave: { label: 'İzin', color: 'text-teal-600 bg-teal-50', icon: '🏖️' },
  budget: { label: 'Bütçe', color: 'text-indigo-600 bg-indigo-50', icon: '📊' }
};

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Orta', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'Yüksek', color: 'bg-red-100 text-red-700' }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function PendingApprovals({ approvals, onApprove, onReject, onViewDetails }: PendingApprovalsProps) {
  const urgentCount = approvals.filter(a => a.priority === 'high').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <FileCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bekleyen Onaylar</h3>
            <p className="text-xs text-gray-500">
              {approvals.length} onay bekliyor
              {urgentCount > 0 && <span className="text-red-500 ml-1">• {urgentCount} acil</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <CheckCircle className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Bekleyen onay yok</p>
          </div>
        ) : (
          approvals.map((approval) => {
            const config = typeConfig[approval.type];
            const priority = priorityConfig[approval.priority];
            
            return (
              <div
                key={approval.id}
                className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-lg", config.color)}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {approval.title}
                      </span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {approval.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", config.color)}>
                        {config.label}
                      </span>
                      {approval.amount && (
                        <span className="text-xs font-medium text-gray-700">
                          {formatCurrency(approval.amount)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true, locale: tr })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => onApprove?.(approval.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Onayla
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onReject?.(approval.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reddet
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2"
                    onClick={() => onViewDetails?.(approval.id)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
