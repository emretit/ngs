import OpexEntry from "@/components/cashflow/OpexEntry";
import { FileText } from "lucide-react";
const CashflowOpexEntry = () => {
  return (
    <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                OPEX Girişi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Operasyonel giderlerinizi kaydedin ve takip edin.
              </p>
            </div>
          </div>
        </div>
        {/* Content Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              <OpexEntry />
            </div>
          </div>
        </div>
      </div>
  );
};
export default CashflowOpexEntry;
