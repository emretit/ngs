import React from "react";
import { LeaveRequest } from "./types";
import { LeaveTable } from "./LeaveTable";

interface LeavesContentProps {
  leaves: LeaveRequest[];
  isLoading: boolean;
  totalCount?: number;
  error?: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelectLeave: (id: string) => void;
}

const LeavesContent = ({
  leaves,
  isLoading,
  totalCount,
  error,
  onApprove,
  onReject,
  onSelectLeave,
}: LeavesContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">İzinler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <LeaveTable
              leaves={leaves}
              isLoading={isLoading}
              onApprove={onApprove}
              onReject={onReject}
              onSelectLeave={onSelectLeave}
            />
          </div>
        </div>
        
        {/* Toplam izin sayısı */}
        {leaves.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {totalCount || leaves.length} izin talebi
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavesContent;

