import ExpensesManager from "@/components/cashflow/ExpensesManager";
import { Receipt, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const CashflowExpenses = () => {
  const navigate = useNavigate();
  const [triggerAddDialog, setTriggerAddDialog] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [totalAmount, setTotalAmount] = useState(0);

  const handleAddClick = () => {
    setTriggerAddDialog(prev => prev + 1);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Masraflar
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Tüm masraflarınızı yönetin ve kategorilere ayırın.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700 font-medium">
            {format(startDate, 'dd MMM', { locale: tr })} - {format(endDate, 'dd MMM yyyy', { locale: tr })}
          </div>
          <div className="w-px h-4 bg-green-300"></div>
          <div className="text-lg font-bold text-green-800">
            ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/cashflow/categories')}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Tag className="mr-2 h-4 w-4" />
            Gelir-Masraf Kategorileri
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Masraf
          </Button>
        </div>
      </div>
      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
          <div className="space-y-6">
            <ExpensesManager 
              triggerAddDialog={triggerAddDialog}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onTotalAmountChange={setTotalAmount}
            />
          </div>
        </div>
          </div>
        </div>
  );
};
export default CashflowExpenses;
