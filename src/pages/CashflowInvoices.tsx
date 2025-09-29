import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import InvoicesManager from "@/components/cashflow/InvoicesManager";
import { FileEdit } from "lucide-react";

interface CashflowInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CashflowInvoices = ({ isCollapsed, setIsCollapsed }: CashflowInvoicesProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-56'}`}>
        <TopBar />
        <div className="p-8">
          <div className="w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg text-white shadow-lg">
                  <FileEdit className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Faturalar
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    Fatura işlemlerinizi yönetin ve takip edin.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
              <div className="p-6">
                <div className="space-y-6">
                  <InvoicesManager />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CashflowInvoices;
