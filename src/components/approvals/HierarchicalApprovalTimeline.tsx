import React from "react";
import { useHierarchicalApprovals } from "@/hooks/useHierarchicalApprovals";
import { ApprovalObjectType } from "@/types/approval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, User, Briefcase, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalActions } from "./ApprovalActions";

interface HierarchicalApprovalTimelineProps {
  objectType: ApprovalObjectType;
  objectId: string | null;
  className?: string;
}

export const HierarchicalApprovalTimeline: React.FC<HierarchicalApprovalTimelineProps> = ({
  objectType,
  objectId,
  className
}) => {
  const { approvals, isLoading } = useHierarchicalApprovals(objectType, objectId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Onay Süreci</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Onay Süreci</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Henüz onay adımı oluşturulmamış
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 border-green-300 text-green-700";
      case "rejected":
        return "bg-red-100 border-red-300 text-red-700";
      case "pending":
        return "bg-yellow-100 border-yellow-300 text-yellow-700";
      default:
        return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case "direct_manager":
        return "Direkt Yönetici";
      case "senior_manager":
        return "Üst Yönetici";
      case "department_head":
        return "Departman Şefi";
      default:
        return "Onaylayıcı";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Onay Süreci</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline Line */}
          <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gray-200"></div>

          {approvals.map((approval, index) => {
            const isLast = index === approvals.length - 1;
            const isPending = approval.status === "pending";
            const isApproved = approval.status === "approved";
            const isRejected = approval.status === "rejected";

            return (
              <div key={approval.id} className="relative flex gap-4">
                {/* Timeline Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                      getStatusColor(approval.status)
                    )}
                  >
                    {getStatusIcon(approval.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          Seviye {approval.step} - {getRoleLabel(approval.approver_role)}
                        </span>
                        {approval.hierarchy_level && (
                          <Badge variant="outline" className="text-xs">
                            Hiyerarşi: {approval.hierarchy_level}
                          </Badge>
                        )}
                        {approval.auto_approved && (
                          <Badge variant="secondary" className="text-xs">
                            Otomatik
                          </Badge>
                        )}
                      </div>

                      {approval.approver_id ? (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Onaylayıcı ID: {approval.approver_id}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Otomatik onaylandı
                        </div>
                      )}

                      {approval.comment && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Yorum:</strong> {approval.comment}
                        </div>
                      )}

                      {approval.decided_at && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(approval.decided_at).toLocaleString("tr-TR")}
                        </div>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(approval.status))}
                    >
                      {approval.status === "approved" ? "Onaylandı" :
                       approval.status === "rejected" ? "Reddedildi" :
                       approval.status === "skipped" ? "Atlandı" :
                       "Bekliyor"}
                    </Badge>
                  </div>

                  {/* Approval Actions - Sadece pending ve current user için */}
                  {isPending && approval.approver_id && (
                    <div className="mt-3">
                      <ApprovalActions
                        approvalId={approval.id}
                        onApprove={() => {}}
                        onReject={() => {}}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

