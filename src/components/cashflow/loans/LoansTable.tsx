import React from "react";
import { Table, TableBody } from "@/components/ui/table";
import LoansTableHeader from "./table/LoansTableHeader";
import { LoansTableRow } from "./table/LoansTableRow";
import LoansTableEmpty from "./table/LoansTableEmpty";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  installment_count?: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface LoansTableProps {
  loans: Loan[];
  isLoading?: boolean;
  onSelect: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
}

export const LoansTable = ({ loans, isLoading, onSelect, onEdit, onDelete }: LoansTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Krediler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <LoansTableHeader />
      <TableBody>
        {loans.length === 0 ? (
          <LoansTableEmpty colSpan={11} />
        ) : (
          loans.map((loan, index) => (
            <LoansTableRow
              key={loan.id}
              loan={loan}
              index={index}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

