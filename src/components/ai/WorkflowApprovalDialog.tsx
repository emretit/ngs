import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface WorkflowApproval {
  id: string;
  execution_id: string;
  workflow_name?: string;
  approval_data: Record<string, any>;
  created_at: string;
  requested_by?: string;
}

interface WorkflowApprovalDialogProps {
  approval: WorkflowApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  isSubmitting?: boolean;
}

export function WorkflowApprovalDialog({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isSubmitting = false
}: WorkflowApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = () => {
    setSelectedAction('approve');
    onApprove(comment);
  };

  const handleReject = () => {
    setSelectedAction('reject');
    onReject(comment);
  };

  const handleClose = () => {
    setComment('');
    setSelectedAction(null);
    onOpenChange(false);
  };

  if (!approval) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <DialogTitle>Workflow Onayı Gerekiyor</DialogTitle>
              <DialogDescription>
                {formatDistanceToNow(new Date(approval.created_at), {
                  addSuffix: true,
                  locale: tr
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workflow Info */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <p className="font-medium">{approval.workflow_name || 'İsimsiz Workflow'}</p>
                </div>
                <Badge variant="outline" className="gap-2">
                  <FileText className="h-3 w-3" />
                  {approval.execution_id.slice(0, 8)}
                </Badge>
              </div>

              {approval.requested_by && (
                <div>
                  <p className="text-sm text-muted-foreground">Talep Eden</p>
                  <p className="font-medium">{approval.requested_by}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Data Preview */}
          {approval.approval_data && Object.keys(approval.approval_data).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium mb-3">Onay Verileri</h4>
                <div className="space-y-3">
                  {Object.entries(approval.approval_data).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                      <p className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="col-span-2 font-medium">
                        {typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table (if array) */}
          {approval.approval_data.data && Array.isArray(approval.approval_data.data) && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium mb-3">
                  Veri Önizleme ({approval.approval_data.data.length} kayıt)
                </h4>
                <div className="overflow-auto max-h-64 border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {Object.keys(approval.approval_data.data[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left font-medium text-gray-700"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {approval.approval_data.data.slice(0, 10).map((row: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="px-4 py-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {approval.approval_data.data.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    İlk 10 kayıt gösteriliyor
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Yorum (İsteğe Bağlı)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Onay/red sebebinizi yazabilirsiniz..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
            className={cn(
              selectedAction === 'reject' && 'opacity-50'
            )}
          >
            {isSubmitting && selectedAction === 'reject' ? (
              <>Reddediliyor...</>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </>
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className={cn(
              selectedAction === 'approve' && 'opacity-50'
            )}
          >
            {isSubmitting && selectedAction === 'approve' ? (
              <>Onaylanıyor...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Onayla
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
