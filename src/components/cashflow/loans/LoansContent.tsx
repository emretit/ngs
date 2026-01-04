import React from "react";
import { LoansTable } from "./LoansTable";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface LoansContentProps {
  loans: Loan[];
  isLoading: boolean;
  error: any;
  onSelect: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
}

const LoansContent = ({
  loans,
  isLoading,
  error,
  onSelect,
  onEdit,
  onDelete
}: LoansContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Krediler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <LoansTable
              loans={loans}
              isLoading={isLoading}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
        
        {/* Toplam kredi sayısı */}
        {loans.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {loans.length} kredi
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansContent;

