import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronsUpDown, 
  Search, 
  ShoppingCart, 
  Loader2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Order {
  id: string;
  order_number: string;
  title: string;
  customer?: {
    id: string;
    name: string;
    company?: string;
  };
  status: string;
}

interface OrderSelectorProps {
  value: string;
  onChange: (orderId: string, order: Order | null) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
}

const OrderSelector: React.FC<OrderSelectorProps> = ({ 
  value, 
  onChange, 
  error,
  label = "Sipariş",
  placeholder = "Sipariş seçin...",
  showLabel = true
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { userData } = useCurrentUser();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          title,
          status,
          customer:customers(id, name, company)
        `)
        
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as Order[]) || [];
    },
    enabled: !!userData?.company_id,
  });

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.title.toLowerCase().includes(query) ||
        order.customer?.name.toLowerCase().includes(query) ||
        order.customer?.company?.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const selectedOrder = orders.find(order => order.id === value);

  const handleSelectOrder = (order: Order) => {
    onChange(order.id, order);
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <Label className={cn("text-sm font-medium text-gray-700", error ? "text-red-500" : "")}>
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-8 text-sm justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="truncate text-left flex-1">
              {selectedOrder 
                ? `${selectedOrder.order_number} - ${selectedOrder.title}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="flex flex-col">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Sipariş ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Siparişler yükleniyor...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Sipariş bulunamadı
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      value === order.id && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === order.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {order.order_number}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.title}
                      </div>
                      {order.customer && (
                        <div className="text-xs text-muted-foreground truncate">
                          {order.customer.company || order.customer.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default OrderSelector;
