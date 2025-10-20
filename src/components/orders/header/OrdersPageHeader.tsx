import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import OrdersViewToggle, { ViewType } from "./OrdersViewToggle";

interface OrdersPageHeaderProps {
  onCreateOrder: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const OrdersPageHeader = ({ onCreateOrder, activeView, setActiveView }: OrdersPageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white shadow-lg">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Siparişler
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Müşteri siparişlerini yönetin ve takip edin.
          </p>
        </div>
      </div>

      {/* Sağ taraf - Görünüm ve Buton */}
      <div className="flex items-center gap-2">
        <OrdersViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateOrder}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Sipariş</span>
        </Button>
      </div>
    </div>
  );
};

export default OrdersPageHeader;