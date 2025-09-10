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

import { TrendingUp, FileText, BarChart2, Users2, CreditEnhancedCard, Receipt, Wallet, Building2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nakit Akış Yönetimi</h1>
            <p className="text-gray-600 mt-1">Gelir ve giderlerinizi yönetin</p>
          </div>
          </div>

          <CustomTabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
              <CustomTabsList className="w-full h-auto flex flex-wrap gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
                <CustomTabsTrigger value="overview" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <TrendingUp className="h-4 w-4" />
                  <span>Genel Bakış</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="opex-entry" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <FileText className="h-4 w-4" />
                  <span>OPEX Girişi</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="expenses" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <Wallet className="h-4 w-4" />
                  <span>Masraflar</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="employee-costs" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <Users2 className="h-4 w-4" />
                  <span>Personel Maliyetleri</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="invoices" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <Receipt className="h-4 w-4" />
                  <span>Fatura Analizi</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="loans-and-checks" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <CreditEnhancedCard className="h-4 w-4" />
                  <span>Krediler ve Çekler</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger value="bank-accounts" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  <Building2 className="h-4 w-4" />
                  <span>Banka Hesapları</span>
                </CustomTabsTrigger>
              </CustomTabsList>
            </div>

            <CustomTabsContent value="overview" className="mt-6 animate-fade-in">
              <CashflowOverview />
            </CustomTabsContent>



            <CustomTabsContent value="opex-entry" className="mt-6 animate-fade-in">
              <OpexEntry />
            </CustomTabsContent>

            <CustomTabsContent value="expenses" className="mt-6 animate-fade-in">
              <ExpensesManager />
            </CustomTabsContent>

            <CustomTabsContent value="employee-costs" className="mt-6 animate-fade-in">
              <EmployeeCosts />
            </CustomTabsContent>

            <CustomTabsContent value="invoices" className="mt-6 animate-fade-in">
              <InvoicesManager />
            </CustomTabsContent>

            <CustomTabsContent value="loans-and-checks" className="mt-6 animate-fade-in">
              <LoansAndChecks />
            </CustomTabsContent>

            <CustomTabsContent value="bank-accounts" className="mt-6 animate-fade-in">
              <BankAccounts />
            </CustomTabsContent>
          </CustomTabs>
        </div>
      </main>
    </div>
  );
};

export default Cashflow;