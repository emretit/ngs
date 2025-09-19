import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ShoppingCart, TrendingUp, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsPurchasingSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsPurchasingSection({ isExpanded, onToggle, searchParams }: ReportsPurchasingSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: monthlyVolume } = useQuery({
    queryKey: ['monthlyPurchasing', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('einvoices')
        .select('total_amount, created_at');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      
      const monthlyData = (data || []).reduce((acc: Record<string, number>, invoice) => {
        const month = new Date(invoice.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + (invoice.total_amount || 0);
        return acc;
      }, {});
      
      return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
    },
    enabled: isExpanded
  });

  const { data: openPOs } = useQuery({
    queryKey: ['openPurchaseOrders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('einvoices')
        .select('invoice_number, supplier_name, total_amount, due_date')
        .in('status', ['new', 'pending'])
        .order('due_date', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: isExpanded
  });

  const { data: supplierPerformance } = useQuery({
    queryKey: ['supplierPerformance', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('einvoices')
        .select('supplier_name, total_amount');
        
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data } = await query;
      
      const supplierData = (data || []).reduce((acc: Record<string, number>, invoice) => {
        const supplier = invoice.supplier_name;
        acc[supplier] = (acc[supplier] || 0) + (invoice.total_amount || 0);
        return acc;
      }, {});
      
      return Object.entries(supplierData)
        .map(([supplier, amount]) => ({ supplier, amount: amount as number }))
        .sort((a, b) => (b.amount as number) - (a.amount as number))
        .slice(0, 5);
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Satın Alma Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Volume */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Aylık Hacim
              </h4>
              <div className="space-y-2">
                {monthlyVolume?.slice(-5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{item.month}</span>
                    <span className="text-sm font-medium">₺{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {!monthlyVolume?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>

            {/* Open Purchase Orders */}
            <div>
              <h4 className="font-semibold mb-3">Açık Siparişler</h4>
              <div className="space-y-2">
                {openPOs?.slice(0, 5).map((po, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{po.invoice_number}</span>
                      <span className="text-sm">₺{(po.total_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{po.supplier_name}</div>
                  </div>
                ))}
                {!openPOs?.length && (
                  <p className="text-sm text-muted-foreground">Açık sipariş bulunamadı</p>
                )}
              </div>
            </div>

            {/* Supplier Performance */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Tedarikçi Performansı
              </h4>
              <div className="space-y-2">
                {supplierPerformance?.map((supplier, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{supplier.supplier}</span>
                    <span className="text-sm font-medium">₺{supplier.amount.toLocaleString()}</span>
                  </div>
                ))}
                {!supplierPerformance?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}