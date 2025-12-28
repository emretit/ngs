import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useHierarchicalApprovals } from "@/hooks/useHierarchicalApprovals";
import { ApprovalObjectType } from "@/types/approval";

interface ApprovalActionsProps {
  approvalId: string;
  objectType?: ApprovalObjectType;
  objectId?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  approvalId,
  objectType,
  objectId,
  onApprove,
  onReject
}) => {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");

  // Eğer objectType ve objectId verilmişse, hook'u kullan
  const approvalsHook = objectType && objectId 
    ? useHierarchicalApprovals(objectType, objectId)
    : null;

  const handleApprove = () => {
    if (approvalsHook) {
      approvalsHook.approve({ approvalId, comment: comment || undefined });
      setApproveOpen(false);
      setComment("");
      onApprove?.();
    }
  };

  const handleReject = () => {
    if (!reason.trim()) {
      return;
    }
    if (approvalsHook) {
      approvalsHook.reject({ approvalId, reason });
      setRejectOpen(false);
      setReason("");
      onReject?.();
    }
  };

  const isApproving = approvalsHook?.isApproving || false;
  const isRejecting = approvalsHook?.isRejecting || false;

  return (
    <div className="flex items-center gap-2">
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Onaylanıyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Onayla
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onayla</DialogTitle>
            <DialogDescription>
              Bu talebi onaylamak istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-comment">Yorum (Opsiyonel)</Label>
              <Textarea
                id="approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Onay yorumu ekleyebilirsiniz..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isApproving}
            >
              İptal
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Onaylanıyor...
                </>
              ) : (
                "Onayla"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={isApproving || isRejecting}
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reddediliyor...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reddet</DialogTitle>
            <DialogDescription>
              Bu talebi reddetmek için lütfen bir neden belirtin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Red Nedeni *</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Red nedeni zorunludur..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isRejecting}
            >
              İptal
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !reason.trim()}
              variant="destructive"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reddediliyor...
                </>
              ) : (
                "Reddet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

