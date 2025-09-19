import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Percent, 
  FileText, 
  Target, 
  Package, 
  Wrench,
  Car
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsKPIRowProps {
  searchParams: URLSearchParams;
}

export default function ReportsKPIRow({ searchParams }: ReportsKPIRowProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const currency = searchParams.get('currency') || 'TRY';

  // Total Revenue from proposals and orders
  const { data: revenueData } = useQuery({
    queryKey: ['revenue', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('total_amount')
        .eq('status', 'accepted');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      return data?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
    }
  });

  // Total Purchasing from einvoices
  const { data: purchasingData } = useQuery({
    queryKey: ['purchasing', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('einvoices')
        .select('total_amount');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      return data?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
    }
  });

  // Gross Margin calculation
  const grossMargin = revenueData && purchasingData 
    ? revenueData > 0 ? ((revenueData - purchasingData) / revenueData * 100) : 0
    : 0;

  // Open Purchase Orders - using einvoices with pending status
  const { data: openPOs } = useQuery({
    queryKey: ['openPOs', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('einvoices')
        .select('id')
        .in('status', ['new', 'pending']);
      return data?.length || 0;
    }
  });

  // Pipeline Value from opportunities
  const { data: pipelineValue } = useQuery({
    queryKey: ['pipelineValue', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('value')
        .in('status', ['open', 'in_progress']);
      return data?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    }
  });

  // Inventory Value from products
  const { data: inventoryValue } = useQuery({
    queryKey: ['inventoryValue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('price, quantity');
      return data?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
    }
  });

  // Open Service Orders
  const { data: openServiceOrders } = useQuery({
    queryKey: ['openServiceOrders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('id')
        .in('service_status', ['new', 'in_progress', 'assigned']);
      return data?.length || 0;
    }
  });

  // Vehicle Cost per km - placeholder calculation
  const { data: vehicleCostPerKm } = useQuery({
    queryKey: ['vehicleCostPerKm', startDate, endDate],
    queryFn: async () => {
      // This would need actual km data and costs to calculate properly
      // Using vehicle fuel costs as approximate
      const { data } = await supabase
        .from('vehicle_fuel')
        .select('total_cost');
      const totalCost = data?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
      return totalCost / 1000; // Approximate cost per km
    }
  });

  const kpis = [
    {
      title: "Toplam Gelir",
      value: `₺${(revenueData || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Toplam Satın Alma",
      value: `₺${(purchasingData || 0).toLocaleString()}`,
      icon: ShoppingCart,
      color: "text-blue-600"
    },
    {
      title: "Brüt Kar Marjı",
      value: `%${grossMargin.toFixed(1)}`,
      icon: Percent,
      color: "text-purple-600"
    },
    {
      title: "Açık Siparişler",
      value: openPOs?.toString() || "0",
      icon: FileText,
      color: "text-orange-600"
    },
    {
      title: "Pipeline Değeri",
      value: `₺${(pipelineValue || 0).toLocaleString()}`,
      icon: Target,
      color: "text-cyan-600"
    },
    {
      title: "Stok Değeri",
      value: `₺${(inventoryValue || 0).toLocaleString()}`,
      icon: Package,
      color: "text-indigo-600"
    },
    {
      title: "Açık Servis",
      value: openServiceOrders?.toString() || "0",
      icon: Wrench,
      color: "text-red-600"
    },
    {
      title: "Araç ₺/km",
      value: `₺${(vehicleCostPerKm || 0).toFixed(2)}`,
      icon: Car,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}