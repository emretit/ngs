import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewType = "table" | "cards";

interface OrdersViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const OrdersViewToggle = ({ activeView, setActiveView }: OrdersViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border">
      <Button
        type="button"
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("table")}
      >
        <List className="h-4 w-4 mr-2" />
        Liste
      </Button>
      <Button
        type="button"
        variant={activeView === "cards" ? "default" : "ghost"}
        size="sm"
        className="rounded-none"
        onClick={() => setActiveView("cards")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Kartlar
      </Button>
    </div>
  );
};

export default OrdersViewToggle;