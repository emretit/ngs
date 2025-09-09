
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const FinanceHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          Finans Yönetimi
        </h1>
        <p className="text-gray-600">
          Finansal işlemler ve raporlar
        </p>
      </div>
      <div className="flex gap-2">
        <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="h-4 w-4" />
          <span>Yeni Gelir</span>
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Yeni Gider</span>
        </Button>
      </div>
    </div>
  );
};

export default FinanceHeader;
