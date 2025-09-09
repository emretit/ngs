import { BarChart3 } from "lucide-react";
import InvoiceAnalysisTable from "./InvoiceAnalysisTable";

const InvoicesManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Fatura Analizi
        </h2>
        <p className="text-gray-600">Aylık fatura analizi verilerinizi yönetin ve görüntüleyin</p>
        </div>
      </div>

      <InvoiceAnalysisTable />
    </div>
  );
};

export default InvoicesManager;