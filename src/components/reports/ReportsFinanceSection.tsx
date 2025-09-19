import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsFinanceSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsFinanceSection({ isExpanded, onToggle, searchParams }: ReportsFinanceSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: arAging } = useQuery({
    queryKey: ['arAging'],
    queryFn: async () => {
      // Note: This would need proper invoice due dates and payment tracking
      // Using proposals as placeholder for AR
      const { data } = await supabase
        .from('proposals')
        .select('total_amount, created_at, status')
        .eq('status', 'accepted');
      
      if (!data) return { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      const today = new Date();
      const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      data.forEach(proposal => {
        const daysOld = Math.floor((today.getTime() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const amount = proposal.total_amount || 0;
        
        if (daysOld <= 30) aging.current += amount;
        else if (daysOld <= 60) aging.overdue30 += amount;
        else if (daysOld <= 90) aging.overdue60 += amount;
        else aging.overdue90 += amount;
      });
      
      return aging;
    },
    enabled: isExpanded
  });

  const { data: apAging } = useQuery({
    queryKey: ['apAging'],
    queryFn: async () => {
      // Using einvoices for AP aging
      const { data } = await supabase
        .from('einvoices')
        .select('total_amount, due_date, status')
        .neq('status', 'paid');
      
      if (!data) return { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      const today = new Date();
      const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      data.forEach(invoice => {
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = invoice.total_amount || 0;
        
        if (daysOverdue <= 0) aging.current += amount;
        else if (daysOverdue <= 30) aging.overdue30 += amount;
        else if (daysOverdue <= 60) aging.overdue60 += amount;
        else aging.overdue90 += amount;
      });
      
      return aging;
    },
    enabled: isExpanded
  });

  const { data: cashFlow } = useQuery({
    queryKey: ['cashFlow', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('bank_transactions')
        .select('amount, transaction_type, transaction_date');
        
      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);
      
      const { data } = await query;
      
      if (!data) return { inflow: 0, outflow: 0, net: 0 };
      
      const inflow = data.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
      const outflow = data.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return { inflow, outflow, net: inflow - outflow };
    },
    enabled: isExpanded
  });

  const { data: unpaidInvoices } = useQuery({
    queryKey: ['unpaidInvoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('einvoices')
        .select('invoice_number, supplier_name, total_amount, due_date')
        .neq('status', 'paid')
        .order('due_date', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finans Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* AR Aging */}
            <div>
              <h4 className="font-semibold mb-3">Alacak Yaşlandırma</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Güncel (0-30)</span>
                  <span className="font-medium">₺{(arAging?.current || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">31-60 gün</span>
                  <span className="font-medium">₺{(arAging?.overdue30 || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">61-90 gün</span>
                  <span className="font-medium">₺{(arAging?.overdue60 || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">90+ gün</span>
                  <span className="font-medium text-red-600">₺{(arAging?.overdue90 || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* AP Aging */}
            <div>
              <h4 className="font-semibold mb-3">Borç Yaşlandırma</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Güncel (0-30)</span>
                  <span className="font-medium">₺{(apAging?.current || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">31-60 gün</span>
                  <span className="font-medium">₺{(apAging?.overdue30 || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">61-90 gün</span>
                  <span className="font-medium">₺{(apAging?.overdue60 || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">90+ gün</span>
                  <span className="font-medium text-red-600">₺{(apAging?.overdue90 || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Cash Flow */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Nakit Akış
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-sm text-green-700">Gelen</div>
                  <div className="text-lg font-bold text-green-800">
                    ₺{(cashFlow?.inflow || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <div className="text-sm text-red-700">Giden</div>
                  <div className="text-lg font-bold text-red-800">
                    ₺{(cashFlow?.outflow || 0).toLocaleString()}
                  </div>
                </div>
                <div className={`p-3 rounded ${(cashFlow?.net || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className={`text-sm ${(cashFlow?.net || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    Net
                  </div>
                  <div className={`text-lg font-bold ${(cashFlow?.net || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                    ₺{(cashFlow?.net || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Unpaid Invoices */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Ödenmemiş Faturalar
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unpaidInvoices?.map((invoice, index) => (
                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-medium">{invoice.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">{invoice.supplier_name}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">₺{(invoice.total_amount || 0).toLocaleString()}</span>
                      <span className="text-xs text-red-600">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('tr-TR') : 'Tarih yok'}
                      </span>
                    </div>
                  </div>
                ))}
                {!unpaidInvoices?.length && (
                  <p className="text-sm text-green-600">Tüm faturalar ödenmiş</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}