import { useState } from 'react';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Play,
  Plus,
  Clock,
  Calendar,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowBuilder } from '@/components/ai/WorkflowBuilder';
import { WorkflowExecutionPanel } from '@/components/ai/WorkflowExecutionPanel';
import { WorkflowApprovalDialog } from '@/components/ai/WorkflowApprovalDialog';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event';
  is_active: boolean;
  execution_count?: number;
  last_run?: string;
  last_status?: string;
}

const triggerIcons = {
  manual: Play,
  scheduled: Calendar,
  event: Zap
};

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  awaiting_approval: 'bg-orange-100 text-orange-700',
  pending: 'bg-gray-100 text-gray-700'
};

export default function AIWorkflows() {
  const [view, setView] = useState<'list' | 'builder' | 'execution'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Mock data - replace with actual API calls
  const workflows: Workflow[] = [
    {
      id: '1',
      name: 'Ödeme Önerisi Workflow',
      description: 'Vadesi geçmiş faturaları analiz eder ve ödeme önerileri oluşturur',
      trigger_type: 'scheduled',
      is_active: true,
      execution_count: 24,
      last_run: new Date().toISOString(),
      last_status: 'completed'
    },
    {
      id: '2',
      name: 'Kritik Stok Uyarısı',
      description: 'Kritik stok seviyesindeki ürünler için otomatik sipariş oluşturur',
      trigger_type: 'event',
      is_active: true,
      execution_count: 156,
      last_run: new Date(Date.now() - 3600000).toISOString(),
      last_status: 'awaiting_approval'
    },
    {
      id: '3',
      name: 'Müşteri Segmentasyonu',
      description: 'RFM analizi ile müşterileri segmentlere ayırır',
      trigger_type: 'manual',
      is_active: false,
      execution_count: 5,
      last_run: new Date(Date.now() - 86400000).toISOString(),
      last_status: 'failed'
    }
  ];

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setView('builder');
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setView('builder');
  };

  const handleSaveWorkflow = (workflow: any) => {
    logger.debug('Save workflow:', workflow);
    // TODO: API call to save workflow
    setView('list');
  };

  const handleRunWorkflow = (workflowId: string) => {
    logger.debug('Run workflow:', workflowId);
    // TODO: API call to start workflow execution
    setView('execution');
  };

  if (view === 'builder') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setView('list')}
          >
            ← Geri Dön
          </Button>
        </div>
        <WorkflowBuilder
          workflow={selectedWorkflow as any}
          onSave={handleSaveWorkflow}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'execution') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setView('list')}
          >
            ← Geri Dön
          </Button>
        </div>
        {/* Mock execution data - replace with actual */}
        <WorkflowExecutionPanel
          execution={{
            id: 'exec-123',
            workflow_id: '1',
            workflow_name: 'Ödeme Önerisi Workflow',
            status: 'running',
            current_step_index: 1,
            step_results: [
              {
                step_id: 'step-1',
                step_name: 'Veri Sorgula',
                status: 'success',
                duration_ms: 245,
                executed_at: new Date().toISOString(),
                result: { rowCount: 15 }
              },
              {
                step_id: 'step-2',
                step_name: 'AI Analizi',
                status: 'running',
                executed_at: new Date().toISOString()
              }
            ],
            started_at: new Date().toISOString(),
            trigger_source: 'manual'
          }}
          onRetry={() => logger.debug('Retry')}
          onCancel={() => logger.debug('Cancel')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Workflows</h1>
          <p className="text-muted-foreground">
            Otonom iş akışlarını oluşturun ve yönetin
          </p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Workflow</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.filter(w => w.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Çalıştırma</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Onay Bekleyen</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Workflow ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Henüz workflow oluşturulmamış</p>
              <Button onClick={handleCreateWorkflow} variant="link">
                İlk workflow'u oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => {
            const TriggerIcon = triggerIcons[workflow.trigger_type];

            return (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <Badge
                          variant={workflow.is_active ? 'default' : 'secondary'}
                          className={cn(!workflow.is_active && 'opacity-60')}
                        >
                          {workflow.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <TriggerIcon className="h-3 w-3" />
                          {workflow.trigger_type === 'manual' && 'Manuel'}
                          {workflow.trigger_type === 'scheduled' && 'Zamanlanmış'}
                          {workflow.trigger_type === 'event' && 'Event Bazlı'}
                        </Badge>
                      </div>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRunWorkflow(workflow.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-muted-foreground">Toplam Çalıştırma</p>
                        <p className="font-medium">{workflow.execution_count || 0}</p>
                      </div>
                      {workflow.last_run && (
                        <div>
                          <p className="text-muted-foreground">Son Çalıştırma</p>
                          <p className="font-medium">
                            {new Date(workflow.last_run).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      )}
                    </div>

                    {workflow.last_status && (
                      <Badge className={statusColors[workflow.last_status as keyof typeof statusColors]}>
                        {workflow.last_status}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
