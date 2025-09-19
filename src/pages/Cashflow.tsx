import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger
} from "@/components/ui/custom-tabs";
import CashflowOverview from "@/components/cashflow/CashflowOverview";
import OpexEntry from "@/components/cashflow/OpexEntry";
import EmployeeCosts from "@/components/cashflow/EmployeeCosts";
import { LoansAndChecks } from "@/components/cashflow/LoansAndChecks";
import InvoicesManager from "@/components/cashflow/InvoicesManager";
import ExpensesManager from "@/components/cashflow/ExpensesManager";
import BankAccounts from "@/components/cashflow/BankAccounts";
import { DollarSign, FileText, BarChart2, Users2, CreditCard, Receipt, Building2 } from "lucide-react";

interface CashflowProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Cashflow = ({ isCollapsed, setIsCollapsed }: CashflowProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/opex-entry')) return 'opex-entry';
    if (path.includes('/expenses')) return 'expenses';
    if (path.includes('/employee-costs')) return 'employee-costs';
    if (path.includes('/loans-and-checks')) return 'loans-and-checks';
    if (path.includes('/invoices')) return 'invoices';
    if (path.includes('/bank-accounts')) return 'bank-accounts';
    // Redirect old main-table route to overview
    if (path.includes('/main-table')) {
      navigate('/cashflow', { replace: true });
    }
    return 'overview';
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'overview':
        navigate('/cashflow');
        break;
      case 'opex-entry':
        navigate('/cashflow/opex-entry');
        break;
      case 'expenses':
        navigate('/cashflow/expenses');
        break;
      case 'employee-costs':
        navigate('/cashflow/employee-costs');
        break;
      case 'loans-and-checks':
        navigate('/cashflow/loans-and-checks');
        break;
      case 'invoices':
        navigate('/cashflow/invoices');
        break;
      case 'bank-accounts':
        navigate('/cashflow/bank-accounts');
        break;
      default:
        navigate('/cashflow');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        <div className="p-8">
          <div className="w-full">
            {/* Header - Fırsatlar gibi */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
              {/* Sol taraf - Başlık */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Nakit Akış Yönetimi
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    Gelir ve giderlerinizi profesyonel bir şekilde yönetin ve analiz edin.
                  </p>
                </div>
              </div>
              
              {/* Sağ taraf - Boş (kartlar kaldırıldı) */}
              <div className="flex items-center gap-2">
                {/* İleride butonlar eklenebilir */}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
              <CustomTabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
                <div className="border-b border-gray-200/80 bg-gray-50/50 px-6 py-4">
                  <CustomTabsList className="bg-white shadow-sm border border-gray-200/60 rounded-xl p-1 grid grid-cols-7 w-full">
                    <CustomTabsTrigger
                      value="overview"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <BarChart2 className="h-4 w-4" />
                      Genel Bakış
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="opex-entry"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4" />
                      OPEX Girişi
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="expenses"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Receipt className="h-4 w-4" />
                      Giderler
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="employee-costs"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Users2 className="h-4 w-4" />
                      Çalışan Maliyetleri
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="invoices"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <CreditCard className="h-4 w-4" />
                      Faturalar
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="loans-and-checks"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <Building2 className="h-4 w-4" />
                      Krediler & Çekler
                    </CustomTabsTrigger>
                    <CustomTabsTrigger
                      value="bank-accounts"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                    >
                      <CreditCard className="h-4 w-4" />
                      Banka Hesapları
                    </CustomTabsTrigger>
                  </CustomTabsList>
                </div>

                <div className="p-6">
                  <CustomTabsContent value="overview" className="mt-0">
                    <div className="space-y-6">
                      <CashflowOverview />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="opex-entry" className="mt-0">
                    <div className="space-y-6">
                      <OpexEntry />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="expenses" className="mt-0">
                    <div className="space-y-6">
                      <ExpensesManager />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="employee-costs" className="mt-0">
                    <div className="space-y-6">
                      <EmployeeCosts />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="invoices" className="mt-0">
                    <div className="space-y-6">
                      <InvoicesManager />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="loans-and-checks" className="mt-0">
                    <div className="space-y-6">
                      <LoansAndChecks />
                    </div>
                  </CustomTabsContent>

                  <CustomTabsContent value="bank-accounts" className="mt-0">
                    <div className="space-y-6">
                      <BankAccounts />
                    </div>
                  </CustomTabsContent>
                </div>
              </CustomTabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cashflow;