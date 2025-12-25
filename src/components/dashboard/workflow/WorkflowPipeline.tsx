import { ArrowRight, Target, FileText, ShoppingCart, Truck, Receipt, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  value: number;
  urgent: number;
  color: string;
  bgColor: string;
}

interface WorkflowPipelineProps {
  stages: PipelineStage[];
  onStageClick?: (stageId: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function WorkflowPipeline({ stages, onStageClick }: WorkflowPipelineProps) {
  return (
    <div className="w-full">
      {/* Pipeline Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">İş Akışı Pipeline</h3>
          <p className="text-xs text-gray-500">Fırsat → Teklif → Sipariş → Teslimat → Fatura</p>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-[140px]">
              {/* Stage Card */}
              <button
                onClick={() => onStageClick?.(stage.id)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                  "bg-gradient-to-br",
                  stage.bgColor,
                  "border-transparent hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stage.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 truncate">{stage.label}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{stage.count}</span>
                    <span className="text-xs text-gray-500">adet</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    {formatCurrency(stage.value)}
                  </div>
                  {stage.urgent > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{stage.urgent} acil</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Arrow Connector */}
              {index < stages.length - 1 && (
                <div className="px-1 flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-xs text-gray-500">Bu Ay Tamamlanan</div>
            <div className="text-sm font-semibold text-gray-900">24 İş</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-xs text-gray-500">Ort. Tamamlanma</div>
            <div className="text-sm font-semibold text-gray-900">4.2 Gün</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div>
            <div className="text-xs text-gray-500">Geciken İşler</div>
            <div className="text-sm font-semibold text-gray-900">3 Adet</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default stages configuration
export const defaultPipelineStages: PipelineStage[] = [
  {
    id: 'opportunities',
    label: 'Fırsatlar',
    icon: Target,
    count: 0,
    value: 0,
    urgent: 0,
    color: 'bg-purple-500',
    bgColor: 'from-purple-50 to-purple-100/50'
  },
  {
    id: 'proposals',
    label: 'Teklifler',
    icon: FileText,
    count: 0,
    value: 0,
    urgent: 0,
    color: 'bg-blue-500',
    bgColor: 'from-blue-50 to-blue-100/50'
  },
  {
    id: 'orders',
    label: 'Siparişler',
    icon: ShoppingCart,
    count: 0,
    value: 0,
    urgent: 0,
    color: 'bg-indigo-500',
    bgColor: 'from-indigo-50 to-indigo-100/50'
  },
  {
    id: 'deliveries',
    label: 'Teslimatlar',
    icon: Truck,
    count: 0,
    value: 0,
    urgent: 0,
    color: 'bg-teal-500',
    bgColor: 'from-teal-50 to-teal-100/50'
  },
  {
    id: 'invoices',
    label: 'Faturalar',
    icon: Receipt,
    count: 0,
    value: 0,
    urgent: 0,
    color: 'bg-emerald-500',
    bgColor: 'from-emerald-50 to-emerald-100/50'
  }
];
