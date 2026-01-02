import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useDecideApproval } from "@/hooks/usePurchasing";
import { formatDate } from "@/utils/dateUtils";

interface PRApprovalsTabProps {
  approvals: Array<{
    id: string;
    step: number;
    status: string;
    decided_at?: string | null;
    comment?: string | null;
    approver?: {
      first_name: string;
      last_name: string;
    } | null;
  }>;
}

const statusConfig = {
  pending: { label: "Bekliyor", variant: "default" as const },
  approved: { label: "Onaylandı", variant: "default" as const },
  rejected: { label: "Reddedildi", variant: "destructive" as const },
  skipped: { label: "Atlandı", variant: "secondary" as const },
};

export function PRApprovalsTab({ approvals }: PRApprovalsTabProps) {
  const [comment, setComment] = useState("");
  const decideMutation = useDecideApproval();

  const handleDecision = (approvalId: string, status: "approved" | "rejected") => {
    decideMutation.mutate(
      { id: approvalId, status, comment: comment || undefined },
      {
        onSuccess: () => {
          setComment("");
        },
      }
    );
  };

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz onay süreci başlatılmadı
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <Card key={approval.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Seviye {approval.step}</p>
                  {approval.approver && (
                    <p className="text-sm text-muted-foreground">
                      {approval.approver.first_name} {approval.approver.last_name}
                    </p>
                  )}
                </div>
                <Badge variant={statusConfig[approval.status as keyof typeof statusConfig]?.variant}>
                  {statusConfig[approval.status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>

              {approval.decided_at && (
                <p className="text-sm text-muted-foreground">
                  Karar: {formatDate(approval.decided_at)}
                </p>
              )}

              {approval.comment && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{approval.comment}</p>
                </div>
              )}

              {approval.status === "pending" && (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Yorum (opsiyonel)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDecision(approval.id, "approved")}
                      disabled={decideMutation.isPending}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDecision(approval.id, "rejected")}
                      disabled={decideMutation.isPending}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reddet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
