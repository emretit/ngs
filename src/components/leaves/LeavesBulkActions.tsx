import React from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { LeaveRequest } from "./types";

interface LeavesBulkActionsProps {
  selectedLeaves: LeaveRequest[];
  onClearSelection: () => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
}

const LeavesBulkActions = ({
  selectedLeaves,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
}: LeavesBulkActionsProps) => {
  if (selectedLeaves.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-900">
          {selectedLeaves.length} izin seçildi
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 gap-1 text-blue-700 hover:text-blue-900"
        >
          <X className="h-3 w-3" />
          Seçimi Temizle
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {onBulkApprove && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkApprove}
            className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Toplu Onayla
          </Button>
        )}
        {onBulkReject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkReject}
            className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Toplu Reddet
          </Button>
        )}
      </div>
    </div>
  );
};

export default LeavesBulkActions;

