import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Percent, 
  Target, 
  Package, 
  Wrench,
  Car,
  DollarSign,
  Users,
  Banknote,
  Briefcase,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { subMonths, subDays, differenceInDays } from "date-fns";

interface ReportsKPIRowProps {
  searchParams: URLSearchParams;
}

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isLoading?: boolean;
}

function KPICard({ title, value, change, changeLabel, icon: Icon, color, bgColor, isLoading }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <Card className="relative overflow-hidden p-4 hover:shadow-md transition-all duration-300 group border-border/50 bg-card/80 backdrop-blur-sm">
      {/* Background gradient */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", bgColor)} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate mb-1">
            {title}
          </p>
          
          {isLoading ? (
            <Skeleton className="h-7 w-24 mb-2" />
          ) : (
            <p className="text-xl font-bold text-foreground truncate">
              {value}
            </p>
          )}
          
          {change !== undefined && !isLoading && (
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              ) : null}
              <span className={cn(
                "text-xs font-medium",
                isPositive && "text-emerald-600",
                isNegative && "text-rose-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}>
                {isPositive ? "+" : ""}{change?.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex-shrink-0 p-2.5 rounded-xl",
          bgColor
        )}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </Card>
  );
}

export default function ReportsKPIRow({ searchParams }: ReportsKPIRowProps) {
  const location = useLocation();
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const compareMode = searchParams.get('compare') || '';
  const currency = searchParams.get('currency') || 'TRY';

  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€'
  };

  const currencySymbol = currencySymbols[currency] || '₺';

  // Calculate previous period dates
  const getPreviousPeriodDates = () => {
    if (!startDate || !endDate) return { prevStart: null, prevEnd: null };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (compareMode === 'previousYear') {
      // Same period last year
      const prevStart = new Date(start);
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      const prevEnd = new Date(end);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
      return { prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
    } else if (compareMode === 'previous') {
      // Previous period (same length)
      const daysDiff = differenceInDays(end, start);
      const prevEnd = subDays(start, 1);
      const prevStart = subDays(prevEnd, daysDiff);
      return { prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
    }
    
    return { prevStart: null, prevEnd: null };
  };

  const { prevStart, prevEnd } = getPreviousPeriodDates();
  const shouldCompare = compareMode && prevStart && prevEnd;

  // Detect report category from pathname
  const getReportCategory = () => {
    const path = location.pathname;
    if (path.includes('/reports/sales')) return 'sales';
    if (path.includes('/reports/financial')) return 'financial';
    if (path.includes('/reports/service')) return 'service';
    if (path.includes('/reports/inventory')) return 'inventory';
    if (path.includes('/reports/purchasing')) return 'purchasing';
    if (path.includes('/reports/hr')) return 'hr';
    if (path.includes('/reports/vehicles')) return 'vehicles';
    if (path.includes('/reports/vat-analysis')) return 'vat';
    return 'general';
  };

  const reportCategory = getReportCategory();

  // Total Revenue from proposals and orders
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
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

  // Previous period revenue for comparison
  const { data: prevRevenueData } = useQuery({
    queryKey: ['revenue', prevStart, prevEnd],
    queryFn: async () => {
      if (!prevStart || !prevEnd) return 0;
      let query = supabase
        .from('proposals')
        .select('total_amount')
        .eq('status', 'accepted');
        
      query = query.gte('created_at', prevStart);
      query = query.lte('created_at', prevEnd);
      
      const { data } = await query;
      return data?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
    },
    enabled: !!shouldCompare
  });

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): number | undefined => {
    if (!shouldCompare || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
  };

  // Total Purchasing from einvoices
  const { data: purchasingData, isLoading: purchasingLoading } = useQuery({
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

  // Pipeline Value from opportunities
  const { data: pipelineValue, isLoading: pipelineLoading } = useQuery({
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
  const { data: inventoryValue, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventoryValue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('price, quantity');
      return data?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
    }
  });

  // Open Service Orders
  const { data: openServiceOrders, isLoading: serviceLoading } = useQuery({
    queryKey: ['openServiceOrders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('id')
        .in('service_status', ['new', 'in_progress', 'assigned']);
      return data?.length || 0;
    }
  });

  // Active Employees
  const { data: activeEmployees, isLoading: employeesLoading } = useQuery({
    queryKey: ['activeEmployees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('is_active', true);
      return data?.length || 0;
    }
  });

  // Vehicle Cost
  const { data: vehicleCost, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicleCost', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('vehicle_fuel').select('total_cost');
      if (startDate) query = query.gte('fuel_date', startDate);
      if (endDate) query = query.lte('fuel_date', endDate);
      
      const { data } = await query;
      return data?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('tr-TR');
  };

  const kpis = [
    {
      title: "Toplam Gelir",
      value: `${currencySymbol}${formatNumber(revenueData || 0)}`,
      change: calculateChange(revenueData || 0, prevRevenueData || 0),
      changeLabel: shouldCompare ? (compareMode === 'previousYear' ? "geçen yıl aynı dönem" : "önceki dönem") : undefined,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      isLoading: revenueLoading
    },
    {
      title: "Satın Alma",
      value: `${currencySymbol}${formatNumber(purchasingData || 0)}`,
      change: -3.2,
      changeLabel: "geçen aya göre",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      isLoading: purchasingLoading
    },
    {
      title: "Kar Marjı",
      value: `%${grossMargin.toFixed(1)}`,
      change: 2.1,
      icon: Percent,
      color: "text-violet-600",
      bgColor: "bg-violet-500/10",
      isLoading: revenueLoading || purchasingLoading
    },
    {
      title: "Pipeline",
      value: `${currencySymbol}${formatNumber(pipelineValue || 0)}`,
      change: 18.7,
      icon: Target,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      isLoading: pipelineLoading
    },
    {
      title: "Stok Değeri",
      value: `${currencySymbol}${formatNumber(inventoryValue || 0)}`,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-500/10",
      isLoading: inventoryLoading
    },
    {
      title: "Açık Servis",
      value: (openServiceOrders || 0).toString(),
      icon: Wrench,
      color: "text-rose-600",
      bgColor: "bg-rose-500/10",
      isLoading: serviceLoading
    },
    {
      title: "Aktif Personel",
      value: (activeEmployees || 0).toString(),
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10",
      isLoading: employeesLoading
    },
    {
      title: "Filo Maliyeti",
      value: `${currencySymbol}${formatNumber(vehicleCost || 0)}`,
      change: -5.4,
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      isLoading: vehicleLoading
    }
  ];

  // Determine grid columns based on KPI count
  const getGridCols = () => {
    if (kpis.length <= 2) return "grid-cols-2";
    if (kpis.length <= 4) return "grid-cols-2 sm:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  };

  return (
    <div className={`grid ${getGridCols()} gap-3`}>
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}
