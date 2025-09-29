import ExpensesManager from "@/components/cashflow/ExpensesManager";
import { Receipt } from "lucide-react";

const CashflowExpenses = () => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Giderler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Tüm giderlerinizi yönetin ve kategorilere ayırın.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
          <div className="space-y-6">
            <ExpensesManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashflowExpenses;
