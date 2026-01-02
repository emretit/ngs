import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Settings } from "lucide-react";
import { ApprovalWorkflow } from "@/types/approval";
import { useApprovalWorkflows } from "@/hooks/useApprovalWorkflows";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface WorkflowCardProps {
  workflow: ApprovalWorkflow;
  onEdit: (workflow: ApprovalWorkflow) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onEdit
}) => {
  const { deleteWorkflow } = useApprovalWorkflows();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteWorkflow(workflow.id);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const getObjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      leave_request: "İzin Talepleri",
      expense_request: "Harcama Talepleri",
      purchase_request: "Satınalma Talepleri",
      budget_revision: "Bütçe Revizyonları",
    };
    return labels[type] || type;
  };

  const getWorkflowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hierarchical: "Hiyerarşik",
      fixed: "Sabit",
      threshold: "Tutar Bazlı",
      hybrid: "Hibrit",
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {getObjectTypeLabel(workflow.object_type)}
          </CardTitle>
          <div className="flex items-center gap-2">
            {workflow.is_active ? (
              <Badge variant="default">Aktif</Badge>
            ) : (
              <Badge variant="outline">Pasif</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tip:</span>
            <p className="font-medium">{getWorkflowTypeLabel(workflow.workflow_type)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Maksimum Seviye:</span>
            <p className="font-medium">{workflow.max_hierarchy_levels}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Departman Şefi:</span>
            <p className="font-medium">
              {workflow.require_department_head ? "Gerekli" : "Gerekli Değil"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Tutar Kuralları:</span>
            <p className="font-medium">
              {workflow.threshold_rules?.length || 0} kural
            </p>
          </div>
        </div>

        {workflow.threshold_rules && workflow.threshold_rules.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tutar Kuralları:</p>
            <div className="space-y-1">
              {workflow.threshold_rules.map((rule, index) => (
                <div
                  key={index}
                  className="text-xs bg-muted p-2 rounded"
                >
                  ≤ {rule.max_amount.toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  })} → {rule.levels} seviye
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(workflow)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Onay Sürecini Sil"
        description="Bu onay sürecini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Card>
  );
};

