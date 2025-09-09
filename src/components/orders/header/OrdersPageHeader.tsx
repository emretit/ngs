import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OrdersViewToggle, { ViewType } from "./OrdersViewToggle";

interface OrdersPageHeaderProps {
  onCreateOrder: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const OrdersPageHeader = ({ onCreateOrder, activeView, setActiveView }: OrdersPageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center p-6 bg-gradient-to-r from-card to-muted/50 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Siparişler
        </h1>
        <p className="text-sm text-muted-foreground/80">
          Müşteri siparişlerini yönetin ve takip edin
        </p>
      </div>
      <div className="flex space-x-2 w-full sm:w-auto justify-end">
        <OrdersViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="whitespace-nowrap bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
          onClick={onCreateOrder}
        >
          <Plus className="mr-2 h-4 w-4" /> Yeni Sipariş
        </Button>
      </div>
    </div>
  );
};

export default OrdersPageHeader;