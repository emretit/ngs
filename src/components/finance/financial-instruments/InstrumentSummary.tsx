
import { FileText, Bell, X } from "lucide-react";

const InstrumentSummary = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tahsil Edilecek</span>
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-blue-600">₺275,000</p>
        <span className="text-sm text-gray-500">12 Çek/Senet</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Ödenecek</span>
          <FileText className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-2xl font-bold text-red-600">₺180,000</p>
        <span className="text-sm text-gray-500">8 Çek/Senet</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Bu Ay Vadesi Gelen</span>
          <Bell className="h-5 w-5 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-orange-600">₺95,000</p>
        <span className="text-sm text-gray-500">5 Çek/Senet</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Karşılıksız</span>
          <X className="h-5 w-5 text-gray-500" />
        </div>
        <p className="text-2xl font-bold text-gray-600">₺15,000</p>
        <span className="text-sm text-gray-500">2 Çek/Senet</span>
      </div>
    </div>
  );
};

export default InstrumentSummary;
