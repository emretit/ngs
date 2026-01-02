import React from "react";
import { Check } from "@/types/check";
import { ChecksTable } from "./ChecksTable";

interface ChecksContentProps {
  checks: Check[];
  isLoading: boolean;
  totalCount?: number;
  error: any;
  onCheckSelect: (check: Check) => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onQuickAction?: (check: Check) => void;
  searchQuery?: string;
  statusFilter?: string;
  checkTypeFilter?: string;
}

const ChecksContent = ({
  checks,
  isLoading,
  totalCount,
  error,
  onCheckSelect,
  onEdit,
  onDelete,
  onQuickAction,
  searchQuery,
  statusFilter,
  checkTypeFilter
}: ChecksContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Çekler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <ChecksTable
              checks={checks}
              isLoading={isLoading}
              onCheckSelect={onCheckSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickAction={onQuickAction}
              showPayee={true}
              showCheckType={true}
            />
          </div>
        </div>
        
        {/* Toplam çek sayısı */}
        {checks.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {totalCount || checks.length} çek
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecksContent;

