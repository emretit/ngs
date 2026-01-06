import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  AlertCircle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface StepResult {
  step_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration_ms?: number;
  executed_at?: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval' | 'cancelled';
  current_step_index: number;
  step_results: StepResult[];
  error_log?: string;
  started_at: string;
  completed_at?: string;
  triggered_by?: string;
  trigger_source?: string;
}

interface WorkflowExecutionPanelProps {
  execution: WorkflowExecution;
  onRetry?: () => void;
  onCancel?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const statusConfig = {
  pending: {
    label: 'Beklemede',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Clock
  },
  running: {
    label: 'Çalışıyor',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Play
  },
  completed: {
    label: 'Tamamlandı',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle
  },
  failed: {
    label: 'Başarısız',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle
  },
  awaiting_approval: {
    label: 'Onay Bekliyor',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: AlertCircle
  },
  cancelled: {
    label: 'İptal Edildi',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: XCircle
  }
};

const stepStatusConfig = {
  pending: {
    color: 'bg-gray-100 text-gray-600',
    icon: Clock
  },
  running: {
    color: 'bg-blue-100 text-blue-600 animate-pulse',
    icon: RefreshCw
  },
  success: {
    color: 'bg-green-100 text-green-600',
    icon: CheckCircle
  },
  failed: {
    color: 'bg-red-100 text-red-600',
    icon: XCircle
  },
  skipped: {
    color: 'bg-gray-100 text-gray-400',
    icon: ChevronRight
  }
};

export function WorkflowExecutionPanel({
  execution,
  onRetry,
  onCancel,
  onApprove,
  onReject
}: WorkflowExecutionPanelProps) {
  const statusInfo = statusConfig[execution.status];
  const StatusIcon = statusInfo.icon;

  const totalSteps = execution.step_results.length;
  const completedSteps = execution.step_results.filter(
    s => s.status === 'success' || s.status === 'failed' || s.status === 'skipped'
  ).length;

  const duration = execution.completed_at
    ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
    : Date.now() - new Date(execution.started_at).getTime();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}s ${minutes % 60}d`;
    if (minutes > 0) return `${minutes}d ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4">
      {/* Execution Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{execution.workflow_name || 'Workflow'}</CardTitle>
              <CardDescription>
                {formatDistanceToNow(new Date(execution.started_at), {
                  addSuffix: true,
                  locale: tr
                })}
              </CardDescription>
            </div>

            <Badge className={cn('gap-2', statusInfo.color)}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-medium">
                {completedSteps} / {totalSteps} adım
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  execution.status === 'completed' && 'bg-green-500',
                  execution.status === 'failed' && 'bg-red-500',
                  execution.status === 'running' && 'bg-blue-500',
                  execution.status === 'awaiting_approval' && 'bg-orange-500',
                  execution.status === 'pending' && 'bg-gray-400'
                )}
                style={{
                  width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Süre</p>
              <p className="font-medium">{formatDuration(duration)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tetikleme</p>
              <p className="font-medium capitalize">{execution.trigger_source || 'Manuel'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID</p>
              <p className="font-mono text-xs">{execution.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Actions */}
          {execution.status === 'awaiting_approval' && (
            <div className="flex gap-2">
              <Button onClick={onApprove} className="flex-1" variant="default">
                <CheckCircle className="h-4 w-4 mr-2" />
                Onayla
              </Button>
              <Button onClick={onReject} className="flex-1" variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </Button>
            </div>
          )}

          {execution.status === 'failed' && (
            <div className="flex gap-2">
              <Button onClick={onRetry} className="flex-1" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Yeniden Dene
              </Button>
            </div>
          )}

          {(execution.status === 'running' || execution.status === 'pending') && (
            <Button onClick={onCancel} variant="outline" className="w-full">
              <XCircle className="h-4 w-4 mr-2" />
              İptal Et
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Adım Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {execution.step_results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz adım çalıştırılmadı
                </p>
              ) : (
                execution.step_results.map((step, index) => {
                  const stepInfo = stepStatusConfig[step.status];
                  const StepIcon = stepInfo.icon;

                  return (
                    <Card key={step.step_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn('p-2 rounded-full', stepInfo.color)}
                            >
                              <StepIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{step.step_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Adım {index + 1}
                              </p>
                            </div>
                          </div>

                          {step.duration_ms && (
                            <Badge variant="outline" className="text-xs">
                              {step.duration_ms}ms
                            </Badge>
                          )}
                        </div>

                        {step.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <p className="font-medium">Hata:</p>
                            <p>{step.error}</p>
                          </div>
                        )}

                        {step.result && step.status === 'success' && (
                          <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Sonuç:
                            </p>
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(step.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Error Log */}
      {execution.error_log && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">Hata Detayı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-red-50 rounded text-sm text-red-700 font-mono">
              {execution.error_log}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
