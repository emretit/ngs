import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Brain,
  Zap,
  CheckCircle,
  Bell,
  Plus,
  X,
  ArrowDown,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  type: 'DataQuery' | 'AIAnalysis' | 'FunctionCall' | 'Approval' | 'Notification';
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id?: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event';
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  approval_required: boolean;
}

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
}

const stepTypeIcons = {
  DataQuery: Database,
  AIAnalysis: Brain,
  FunctionCall: Zap,
  Approval: CheckCircle,
  Notification: Bell
};

const stepTypeColors = {
  DataQuery: 'bg-blue-100 text-blue-700 border-blue-300',
  AIAnalysis: 'bg-purple-100 text-purple-700 border-purple-300',
  FunctionCall: 'bg-green-100 text-green-700 border-green-300',
  Approval: 'bg-orange-100 text-orange-700 border-orange-300',
  Notification: 'bg-gray-100 text-gray-700 border-gray-300'
};

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState<Workflow['trigger_type']>(
    workflow?.trigger_type || 'manual'
  );
  const [triggerConfig, setTriggerConfig] = useState(workflow?.trigger_config || {});
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [approvalRequired, setApprovalRequired] = useState(workflow?.approval_required || false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: `${type} Step`,
      config: {}
    };

    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (selectedStepIndex === index) {
      setSelectedStepIndex(null);
    }
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSave = () => {
    const workflowData: Workflow = {
      ...(workflow?.id && { id: workflow.id }),
      name,
      description,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      steps,
      approval_required: approvalRequired
    };

    onSave(workflowData);
  };

  const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null;

  return (
    <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Left Panel - Workflow Steps */}
      <div className="col-span-2 space-y-4">
        {/* Workflow Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ödeme Önerisi Workflow"
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Workflow açıklaması..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger">Tetikleyici Tip</Label>
                <Select value={triggerType} onValueChange={(v: any) => setTriggerType(v)}>
                  <SelectTrigger id="trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="scheduled">Zamanlanmış</SelectItem>
                    <SelectItem value="event">Event Bazlı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === 'scheduled' && (
                <div>
                  <Label htmlFor="cron">Cron Expression</Label>
                  <Input
                    id="cron"
                    value={triggerConfig.cron || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, cron: e.target.value })}
                    placeholder="0 9 * * 1"
                  />
                </div>
              )}

              {triggerType === 'event' && (
                <div>
                  <Label htmlFor="event">Event Adı</Label>
                  <Input
                    id="event"
                    value={triggerConfig.event || ''}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, event: e.target.value })}
                    placeholder="low_stock"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Workflow Adımları</CardTitle>
            <CardDescription>Adımları sırayla ekleyin ve yapılandırın</CardDescription>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Henüz adım eklenmedi</p>
                <p className="text-sm">Sağdaki panelden adım ekleyin</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = stepTypeIcons[step.type];
                  const colorClass = stepTypeColors[step.type];

                  return (
                    <div key={step.id}>
                      <Card
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          selectedStepIndex === index && 'ring-2 ring-violet-500'
                        )}
                        onClick={() => setSelectedStepIndex(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('p-2 rounded-lg border', colorClass)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{step.name}</p>
                                <p className="text-xs text-muted-foreground">{step.type}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(index);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {index < steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={!name || steps.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Workflow Kaydet
          </Button>
        </div>
      </div>

      {/* Right Panel - Add Steps & Configure */}
      <div className="space-y-4">
        {/* Add Step */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Adım Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addStep('DataQuery')}
            >
              <Database className="h-4 w-4 mr-2" />
              Veri Sorgula
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addStep('AIAnalysis')}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Analizi
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addStep('FunctionCall')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Fonksiyon Çağır
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addStep('Approval')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Onay Bekle
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addStep('Notification')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Bildirim Gönder
            </Button>
          </CardContent>
        </Card>

        {/* Step Configuration */}
        {selectedStep && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Adım Yapılandırması</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adım Adı</Label>
                <Input
                  value={selectedStep.name}
                  onChange={(e) =>
                    updateStep(selectedStepIndex!, { name: e.target.value })
                  }
                />
              </div>

              {/* Type-specific configuration */}
              {selectedStep.type === 'DataQuery' && (
                <>
                  <div>
                    <Label>Tablo</Label>
                    <Input
                      value={selectedStep.config.table || ''}
                      onChange={(e) =>
                        updateStep(selectedStepIndex!, {
                          config: { ...selectedStep.config, table: e.target.value }
                        })
                      }
                      placeholder="customers"
                    />
                  </div>
                  <div>
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      value={selectedStep.config.limit || 100}
                      onChange={(e) =>
                        updateStep(selectedStepIndex!, {
                          config: { ...selectedStep.config, limit: parseInt(e.target.value) }
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'AIAnalysis' && (
                <div>
                  <Label>AI Prompt</Label>
                  <Textarea
                    value={selectedStep.config.prompt || ''}
                    onChange={(e) =>
                      updateStep(selectedStepIndex!, {
                        config: { ...selectedStep.config, prompt: e.target.value }
                      })
                    }
                    placeholder="Verileri analiz et ve öneriler sun..."
                    rows={4}
                  />
                </div>
              )}

              {selectedStep.type === 'FunctionCall' && (
                <>
                  <div>
                    <Label>Fonksiyon Adı</Label>
                    <Select
                      value={selectedStep.config.functionName || ''}
                      onValueChange={(v) =>
                        updateStep(selectedStepIndex!, {
                          config: { ...selectedStep.config, functionName: v }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fonksiyon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create_excel">Excel Oluştur</SelectItem>
                        <SelectItem value="send_email">Email Gönder</SelectItem>
                        <SelectItem value="create_purchase_order">Sipariş Oluştur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
