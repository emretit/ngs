
import { TrendingUp, Receipt, FileText, PieChart } from "lucide-react";

const FinanceSummaryCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Nakit Akışı</span>
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-blue-600">₺50,000</p>
        <span className="text-sm text-gray-500">Bu ay</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Alacaklar</span>
          <Receipt className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-green-600">₺125,000</p>
        <span className="text-sm text-gray-500">Toplam</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Borçlar</span>
          <FileText className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-2xl font-bold text-red-600">₺75,000</p>
        <span className="text-sm text-gray-500">Toplam</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Net Durum</span>
          <PieChart className="h-5 w-5 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-purple-600">₺100,000</p>
        <span className="text-sm text-gray-500">Genel Bakiye</span>
      </div>
    </div>
  );
};

export default FinanceSummaryCards;
