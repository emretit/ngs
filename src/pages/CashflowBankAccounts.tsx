import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import BankAccountsSimple from "@/components/cashflow/BankAccountsSimple";
import CashAccounts from "@/components/cashflow/CashAccounts";
import CreditCards from "@/components/cashflow/CreditCards";
import PartnerAccounts from "@/components/cashflow/PartnerAccounts";
import { Building, Eye, EyeOff, Wallet, CreditCard, Users } from "lucide-react";
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
                    Tüm hesaplarınızı tek yerden yönetin ve takip edin.
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

            {/* Content Section - Compact Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Nakit Kasa Hesapları */}
              <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Nakit Kasa</h2>
                        <p className="text-xs text-gray-500">Kasa işlemleri</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <CashAccounts showBalances={showBalances} />
                </div>
              </div>

              {/* Banka Hesapları */}
              <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Banka Hesapları</h2>
                        <p className="text-xs text-gray-500">Banka işlemleri</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <BankAccountsSimple showBalances={showBalances} />
                </div>
              </div>

              {/* Kredi Kartları */}
              <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Kredi Kartları</h2>
                        <p className="text-xs text-gray-500">Kart limitleri</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <CreditCards showBalances={showBalances} />
                </div>
              </div>

              {/* Şirket Ortakları Hesabı */}
              <div className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Şirket Ortakları</h2>
                        <p className="text-xs text-gray-500">Ortak hesapları</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  </div>
                  <PartnerAccounts showBalances={showBalances} />
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
