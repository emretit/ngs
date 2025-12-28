import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Trash2 } from "lucide-react";
import { ApprovalWorkflow, ThresholdRule, ApprovalObjectType } from "@/types/approval";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";

const workflowSchema = z.object({
  object_type: z.enum(["leave_request", "expense_request", "purchase_request", "budget_revision"]),
  workflow_type: z.enum(["hierarchical", "fixed", "threshold", "hybrid"]).default("hierarchical"),
  max_hierarchy_levels: z.number().min(1).max(10).default(3),
  require_department_head: z.boolean().default(false),
  threshold_rules: z.array(z.object({
    max_amount: z.number().min(0),
    levels: z.number().min(1).max(10),
  })).default([]),
  is_active: z.boolean().default(true),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

interface WorkflowFormProps {
  workflow?: ApprovalWorkflow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflow,
  onSuccess,
  onCancel
}) => {
  const { createWorkflow, updateWorkflow } = useApprovalWorkflows();
  const [thresholdRules, setThresholdRules] = useState<ThresholdRule[]>(
    workflow?.threshold_rules || []
  );

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      object_type: workflow?.object_type || "expense_request",
      workflow_type: workflow?.workflow_type || "hierarchical",
      max_hierarchy_levels: workflow?.max_hierarchy_levels || 3,
      require_department_head: workflow?.require_department_head || false,
      threshold_rules: workflow?.threshold_rules || [],
      is_active: workflow?.is_active ?? true,
    },
  });

  const addThresholdRule = () => {
    const newRule: ThresholdRule = { max_amount: 0, levels: 1 };
    setThresholdRules([...thresholdRules, newRule]);
    form.setValue("threshold_rules", [...thresholdRules, newRule]);
  };

  const removeThresholdRule = (index: number) => {
    const updated = thresholdRules.filter((_, i) => i !== index);
    setThresholdRules(updated);
    form.setValue("threshold_rules", updated);
  };

  const updateThresholdRule = (index: number, field: keyof ThresholdRule, value: number) => {
    const updated = [...thresholdRules];
    updated[index] = { ...updated[index], [field]: value };
    setThresholdRules(updated);
    form.setValue("threshold_rules", updated);
  };

  const onSubmit = (values: WorkflowFormValues) => {
    const workflowData = {
      ...values,
      threshold_rules: thresholdRules,
    };

    if (workflow) {
      updateWorkflow(
        { id: workflow.id, updates: workflowData },
        { onSuccess }
      );
    } else {
      createWorkflow(workflowData, { onSuccess });
    }
  };

  const getObjectTypeLabel = (type: ApprovalObjectType) => {
    const labels: Record<ApprovalObjectType, string> = {
      leave_request: "İzin Talepleri",
      expense_request: "Harcama Talepleri",
      purchase_request: "Satınalma Talepleri",
      budget_revision: "Bütçe Revizyonları",
    };
    return labels[type];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="object_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nesne Tipi</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!workflow}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Nesne tipi seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="leave_request">İzin Talepleri</SelectItem>
                  <SelectItem value="expense_request">Harcama Talepleri</SelectItem>
                  <SelectItem value="purchase_request">Satınalma Talepleri</SelectItem>
                  <SelectItem value="budget_revision">Bütçe Revizyonları</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Bu onay sürecinin uygulanacağı nesne tipi
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workflow_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İş Akışı Tipi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hierarchical">Hiyerarşik</SelectItem>
                  <SelectItem value="fixed">Sabit</SelectItem>
                  <SelectItem value="threshold">Tutar Bazlı</SelectItem>
                  <SelectItem value="hybrid">Hibrit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_hierarchy_levels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maksimum Hiyerarşi Seviyesi</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                Yönetici zincirinde kaç seviye yukarı çıkılacak
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="require_department_head"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Departman Şefi Gerekli</FormLabel>
                <FormDescription>
                  Departman şefinin onayı zorunlu olsun mu?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Threshold Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Tutar Bazlı Kurallar</h3>
              <p className="text-xs text-muted-foreground">
                Belirli tutarlar için farklı onay seviyeleri tanımlayın
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addThresholdRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Kural Ekle
            </Button>
          </div>

          {thresholdRules.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              Henüz kural tanımlanmamış
            </div>
          ) : (
            <div className="space-y-2">
              {thresholdRules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Maksimum Tutar</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={rule.max_amount}
                        onChange={(e) =>
                          updateThresholdRule(index, "max_amount", parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Onay Seviyesi</label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={rule.levels}
                        onChange={(e) =>
                          updateThresholdRule(index, "levels", parseInt(e.target.value) || 1)
                        }
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeThresholdRule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Aktif</FormLabel>
                <FormDescription>
                  Bu onay süreci aktif olsun mu?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {workflow ? "Güncelle" : "Oluştur"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              İptal
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

