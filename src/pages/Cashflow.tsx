import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import CashflowOverview from "@/components/cashflow/CashflowOverview";
import { DollarSign } from "lucide-react";

interface CashflowProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Cashflow = ({ isCollapsed, setIsCollapsed }: CashflowProps) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-56'}`}>
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

            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
              <div className="p-6">
                <div className="space-y-6">
                  <CashflowOverview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cashflow;