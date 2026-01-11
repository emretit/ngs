import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ApprovalTimelineProps {
  revisionId: string;
  onClose: () => void;
}

interface Approval {
  id: string;
  approver_id: string;
  approval_level: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  comment: string | null;
  decided_at: string | null;
}

interface Revision {
  id: string;
  category: string;
  subcategory: string | null;
  old_budget_amount: number;
  new_requested_amount: number;
  reason: string;
  status: string;
  approval_level: number;
  max_approval_level: number;
}

const ApprovalTimeline = ({ revisionId, onClose }: ApprovalTimelineProps) => {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [revisionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch revision
      const { data: revisionData, error: revisionError } = await supabase
        .from("budget_revisions")
        .select("*")
        .eq("id", revisionId)
        .single();

      if (revisionError) throw revisionError;
      setRevision(revisionData);

      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from("budget_approvals")
        .select("*")
        .eq("revision_id", revisionId)
        .order("approval_level", { ascending: true });

      if (approvalsError) throw approvalsError;
      setApprovals(approvalsData || []);
    } catch (error: any) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

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
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  if (loading || !revision) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Onay İş Akışı</DialogTitle>
          <DialogDescription>
            {revision.category} - Revizyon Talebi Detayları
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revision Details */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mevcut Bütçe:</span>
                <span className="ml-2">₺{revision.old_budget_amount.toLocaleString("tr-TR")}</span>
              </div>
              <div>
                <span className="font-medium">İstenen Tutar:</span>
                <span className="ml-2">₺{revision.new_requested_amount.toLocaleString("tr-TR")}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Gerekçe:</span>
                <p className="mt-1 text-muted-foreground">{revision.reason}</p>
              </div>
            </div>
          </div>

          {/* Approval Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Onay Süreci</h3>
            {Array.from({ length: revision.max_approval_level }, (_, i) => {
              const level = i + 1;
              const approval = approvals.find(a => a.approval_level === level);
              const isCurrentLevel = level === revision.approval_level;
              const isCompleted = level < revision.approval_level;

              return (
                <div key={level} className="flex items-start gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    isCompleted && "bg-green-100 border-green-500",
                    isCurrentLevel && !approval && "bg-yellow-100 border-yellow-500",
                    !isCurrentLevel && !isCompleted && "bg-gray-100 border-gray-300"
                  )}>
                    {approval ? getStatusIcon(approval.status) : <span className="text-xs font-medium">{level}</span>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Seviye {level} Onayı</span>
                      {approval && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs px-2 py-1 border", getStatusColor(approval.status))}
                        >
                          {approval.status === "approved" ? "Onaylandı" :
                           approval.status === "rejected" ? "Reddedildi" :
                           approval.status === "skipped" ? "Atlandı" :
                           "Bekliyor"}
                        </Badge>
                      )}
                    </div>
                    {approval?.comment && (
                      <p className="text-xs text-muted-foreground">{approval.comment}</p>
                    )}
                    {approval?.decided_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(approval.decided_at).toLocaleString("tr-TR")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalTimeline;

