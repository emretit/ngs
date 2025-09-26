import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import BankAccounts from "@/components/cashflow/BankAccounts";
import { Building, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CashflowBankAccountsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CashflowBankAccounts = ({ isCollapsed, setIsCollapsed }: CashflowBankAccountsProps) => {
  const [showBalances, setShowBalances] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        <div className="p-8">
          <div className="w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg text-white shadow-lg">
                  <Building className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Hesaplar
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    Banka hesaplarınızı yönetin ve takip edin.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="flex items-center gap-2 bg-white border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBalances ? 'Bakiyeleri Gizle' : 'Bakiyeleri Göster'}
              </Button>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
              <div className="p-6">
                <div className="space-y-6">
                  <BankAccounts showBalances={showBalances} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CashflowBankAccounts;
