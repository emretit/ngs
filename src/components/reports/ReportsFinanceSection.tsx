import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";

interface ReportsFinanceSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const AGING_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444'];

export default function ReportsFinanceSection({ isExpanded, onToggle, searchParams }: ReportsFinanceSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // AR Aging with chart data
  const { data: arAging } = useQuery({
    queryKey: ['arAging'],
    queryFn: async () => {
      const { data } = await supabase.from('proposals').select('total_amount, created_at, status').eq('status', 'accepted');
      
      const today = new Date();
      const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      (data || []).forEach(p => {
        const days = Math.floor((today.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const amount = p.total_amount || 0;
        if (days <= 30) aging.current += amount;
        else if (days <= 60) aging.overdue30 += amount;
        else if (days <= 90) aging.overdue60 += amount;
        else aging.overdue90 += amount;
      });
      
      return {
        ...aging,
        total: aging.current + aging.overdue30 + aging.overdue60 + aging.overdue90,
        chartData: [
          { name: '0-30', value: aging.current, fill: '#22c55e' },
          { name: '31-60', value: aging.overdue30, fill: '#f59e0b' },
          { name: '61-90', value: aging.overdue60, fill: '#f97316' },
          { name: '90+', value: aging.overdue90, fill: '#ef4444' }
        ]
      };
    },
    enabled: isExpanded
  });

  // AP Aging
  const { data: apAging } = useQuery({
    queryKey: ['apAging'],
    queryFn: async () => {
      const { data } = await supabase.from('einvoices').select('total_amount, due_date, status').neq('status', 'paid');
      
      const today = new Date();
      const aging = { current: 0, overdue30: 0, overdue60: 0, overdue90: 0 };
      
      (data || []).forEach(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date();
        const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = inv.total_amount || 0;
        if (days <= 0) aging.current += amount;
        else if (days <= 30) aging.overdue30 += amount;
        else if (days <= 60) aging.overdue60 += amount;
        else aging.overdue90 += amount;
      });
      
      return {
        ...aging,
        total: aging.current + aging.overdue30 + aging.overdue60 + aging.overdue90,
        chartData: [
          { name: '0-30', value: aging.current, fill: '#22c55e' },
          { name: '31-60', value: aging.overdue30, fill: '#f59e0b' },
          { name: '61-90', value: aging.overdue60, fill: '#f97316' },
          { name: '90+', value: aging.overdue90, fill: '#ef4444' }
        ]
      };
    },
    enabled: isExpanded
  });

  // Cash Flow Trend
  const { data: cashFlowTrend } = useQuery({
    queryKey: ['cashFlowTrend', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('bank_transactions').select('amount, transaction_type, transaction_date');
      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);
      const { data } = await query;
      
      const monthly = (data || []).reduce((acc: Record<string, { inflow: number; outflow: number }>, t: any) => {
        const month = new Date(t.transaction_date).toLocaleDateString('tr-TR', { month: 'short' });
        if (!acc[month]) acc[month] = { inflow: 0, outflow: 0 };
        if (t.transaction_type === 'credit') acc[month].inflow += t.amount || 0;
        else acc[month].outflow += t.amount || 0;
        return acc;
      }, {} as Record<string, { inflow: number; outflow: number }>);
      
      return Object.entries(monthly).map(([month, d]) => {
        const data = d as { inflow: number; outflow: number };
        return {
          month,
          gelen: data.inflow,
          giden: data.outflow,
          net: data.inflow - data.outflow
        };
      });
    },
    enabled: isExpanded
  });

  // Bank Accounts Summary
  const { data: bankAccounts } = useQuery({
    queryKey: ['bankAccountsSummary'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('account_name, bank_name, current_balance, currency').eq('is_active', true).limit(5);
      const total = (data || []).reduce((sum, a) => sum + (a.current_balance || 0), 0);
      return { accounts: data || [], total };
    },
    enabled: isExpanded
  });

  // Cash Flow Statement
  const { data: cashFlowStatement } = useQuery({
    queryKey: ['cashFlowStatement', startDate, endDate],
    queryFn: async () => {
      // Operating activities
      let salesQuery = supabase.from('proposals').select('total_amount').eq('status', 'accepted');
      if (startDate) salesQuery = salesQuery.gte('created_at', startDate);
      if (endDate) salesQuery = salesQuery.lte('created_at', endDate);
      const { data: sales } = await salesQuery;
      const operatingInflow = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);

      let purchaseQuery = supabase.from('einvoices').select('total_amount');
      if (startDate) purchaseQuery = purchaseQuery.gte('created_at', startDate);
      if (endDate) purchaseQuery = purchaseQuery.lte('created_at', endDate);
      const { data: purchases } = await purchaseQuery;
      const operatingOutflow = (purchases || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);

      return {
        operating: { inflow: operatingInflow, outflow: operatingOutflow, net: operatingInflow - operatingOutflow },
        investing: { inflow: 0, outflow: 0, net: 0 },
        financing: { inflow: 0, outflow: 0, net: 0 },
        netChange: operatingInflow - operatingOutflow,
      };
    },
    enabled: isExpanded && !!startDate && !!endDate,
  });

  // Profit & Loss Summary
  const { data: profitLoss } = useQuery({
    queryKey: ['profitLoss', startDate, endDate],
    queryFn: async () => {
      let revenueQuery = supabase.from('proposals').select('total_amount').eq('status', 'accepted');
      if (startDate) revenueQuery = revenueQuery.gte('created_at', startDate);
      if (endDate) revenueQuery = revenueQuery.lte('created_at', endDate);
      const { data: revenues } = await revenueQuery;
      const totalRevenue = (revenues || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);

      let expenseQuery = supabase.from('einvoices').select('total_amount');
      if (startDate) expenseQuery = expenseQuery.gte('created_at', startDate);
      if (endDate) expenseQuery = expenseQuery.lte('created_at', endDate);
      const { data: expenses } = await expenseQuery;
      const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.total_amount || 0), 0);

      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        grossProfit: totalRevenue - totalExpenses,
        margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      };
    },
    enabled: isExpanded && !!startDate && !!endDate,
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Finans</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600">Alacak: ₺{(arAging?.total || 0).toLocaleString('tr-TR')}</Badge>
                  <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600">Borç: ₺{(apAging?.total || 0).toLocaleString('tr-TR')}</Badge>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* AR Aging Chart */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Alacak Yaşlandırma
              </h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={arAging?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Tutar']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {arAging?.chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="flex justify-between"><span className="text-emerald-600">0-30:</span><span>₺{(arAging?.current || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-amber-600">31-60:</span><span>₺{(arAging?.overdue30 || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-orange-600">61-90:</span><span>₺{(arAging?.overdue60 || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-rose-600">90+:</span><span>₺{(arAging?.overdue90 || 0).toLocaleString()}</span></div>
              </div>
            </div>

            {/* AP Aging Chart */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Borç Yaşlandırma
              </h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apAging?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Tutar']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {apAging?.chartData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="flex justify-between"><span className="text-emerald-600">0-30:</span><span>₺{(apAging?.current || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-amber-600">31-60:</span><span>₺{(apAging?.overdue30 || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-orange-600">61-90:</span><span>₺{(apAging?.overdue60 || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-rose-600">90+:</span><span>₺{(apAging?.overdue90 || 0).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Cash Flow Trend */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Nakit Akış Trendi
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, '']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="gelen" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="giden" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Gelen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Giden</span>
              </div>
            </div>

            {/* Bank Accounts */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Banka Hesapları
              </h4>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                <div className="text-xs text-muted-foreground">Toplam Bakiye</div>
                <div className="text-2xl font-bold text-primary">₺{(bankAccounts?.total || 0).toLocaleString('tr-TR')}</div>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {bankAccounts?.accounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{acc.account_name}</div>
                      <div className="text-xs text-muted-foreground">{acc.bank_name}</div>
                    </div>
                    <div className="text-sm font-medium text-right">
                      ₺{(acc.current_balance || 0).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
                {!bankAccounts?.accounts.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Hesap bulunamadı</p>
                )}
              </div>
            </div>
          </div>

          {/* Cash Flow Statement & P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Cash Flow Statement Table */}
            <Card className="p-4 border-border/50">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Nakit Akış Tablosu
              </h4>
              {cashFlowStatement ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">Faaliyetlerden Gelen Nakit</div>
                    <div className="flex justify-between items-center p-2 bg-emerald-50 rounded">
                      <span className="text-sm">Tahsilatlar</span>
                      <span className="font-medium text-emerald-700">
                        ₺{cashFlowStatement.operating.inflow.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-rose-50 rounded">
                      <span className="text-sm">Ödemeler</span>
                      <span className="font-medium text-rose-700">
                        -₺{cashFlowStatement.operating.outflow.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-primary/10 rounded border-t border-primary/20">
                      <span className="text-sm font-semibold">Net Faaliyet Nakit Akışı</span>
                      <span className={cn(
                        "font-bold",
                        cashFlowStatement.operating.net >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}>
                        ₺{cashFlowStatement.operating.net.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Tarih aralığı seçin
                </div>
              )}
            </Card>

            {/* Profit & Loss Summary */}
            <Card className="p-4 border-border/50">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Kar/Zarar Özeti
              </h4>
              {profitLoss ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Toplam Gelir</div>
                    <div className="text-xl font-bold text-emerald-700">
                      ₺{profitLoss.revenue.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Toplam Gider</div>
                    <div className="text-xl font-bold text-rose-700">
                      ₺{profitLoss.expenses.toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border-2",
                    profitLoss.grossProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                  )}>
                    <div className="text-xs text-muted-foreground mb-1">Net Kar/Zarar</div>
                    <div className={cn(
                      "text-2xl font-bold",
                      profitLoss.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    )}>
                      ₺{profitLoss.grossProfit.toLocaleString('tr-TR')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Kar Marjı: %{profitLoss.margin.toFixed(1)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Tarih aralığı seçin
                </div>
              )}
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
