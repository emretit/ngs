import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, TrendingUp, Target, Award, Users, FileText, BarChart3 } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";

interface ReportsSalesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  qualified: '#8b5cf6',
  proposal: '#f59e0b',
  negotiation: '#f97316',
  won: '#22c55e',
  lost: '#ef4444',
};

export default function ReportsSalesSection({ isExpanded, onToggle, searchParams }: ReportsSalesSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Pipeline Data with stages
  const { data: pipelineData } = useQuery({
    queryKey: ['salesPipeline', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('opportunities').select('*');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      // Group by stage
      const stageData = (data || []).reduce((acc: Record<string, { count: number; value: number }>, opp) => {
        const stage = opp.stage || 'open';
        if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
        acc[stage].count++;
        acc[stage].value += opp.value || 0;
        return acc;
      }, {});

      const stages = ['open', 'qualified', 'proposal', 'negotiation', 'won'];
      return stages.map(stage => ({
        name: stage === 'open' ? 'Açık' : 
              stage === 'qualified' ? 'Nitelikli' : 
              stage === 'proposal' ? 'Teklif' : 
              stage === 'negotiation' ? 'Müzakere' : 'Kazanıldı',
        value: stageData[stage]?.value || 0,
        count: stageData[stage]?.count || 0,
        fill: STATUS_COLORS[stage]
      }));
    },
    enabled: isExpanded
  });

  // Win Rate
  const { data: winRateData } = useQuery({
    queryKey: ['winRate', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('proposals').select('status');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      if (!data || data.length === 0) return { total: 0, won: 0, lost: 0, pending: 0, rate: 0 };
      
      const won = data.filter(p => p.status === 'accepted').length;
      const lost = data.filter(p => p.status === 'rejected').length;
      const pending = data.filter(p => ['draft', 'sent'].includes(p.status)).length;
      const total = data.length;
      
      return { 
        total, 
        won, 
        lost, 
        pending,
        rate: (won + lost) > 0 ? (won / (won + lost)) * 100 : 0,
        pieData: [
          { name: 'Kazanılan', value: won, fill: '#22c55e' },
          { name: 'Kaybedilen', value: lost, fill: '#ef4444' },
          { name: 'Bekleyen', value: pending, fill: '#f59e0b' },
        ]
      };
    },
    enabled: isExpanded
  });

  // Top Products
  const { data: topProducts } = useQuery({
    queryKey: ['topProducts', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('name, quantity, price')
        .order('quantity', { ascending: false })
        .limit(5);
      return (data || []).map(p => ({
        name: p.name?.substring(0, 20) + (p.name?.length > 20 ? '...' : ''),
        adet: p.quantity || 0,
        deger: (p.quantity || 0) * (p.price || 0)
      }));
    },
    enabled: isExpanded
  });

  // Top Customers
  const { data: topCustomers } = useQuery({
    queryKey: ['topCustomers', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('customer_id, total_amount, customers(name)')
        .eq('status', 'accepted');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const customerTotals = (data || []).reduce((acc: Record<string, { name: string; total: number }>, p) => {
        const customerId = p.customer_id;
        const customerName = (p.customers as any)?.name || 'Bilinmiyor';
        if (!acc[customerId]) acc[customerId] = { name: customerName, total: 0 };
        acc[customerId].total += p.total_amount || 0;
        return acc;
      }, {});

      return (Object.values(customerTotals) as Array<{ name: string; total: number }>)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({ name: c.name.substring(0, 15), value: c.total }));
    },
    enabled: isExpanded
  });

  const totalPipelineValue = pipelineData?.reduce((sum, s) => sum + s.value, 0) || 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Satış & CRM</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">Pipeline: ₺{totalPipelineValue.toLocaleString('tr-TR')}</Badge>
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
            {/* Pipeline Funnel */}
            <div className="lg:col-span-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Satış Pipeline
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                    <Tooltip 
                      formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Değer']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {pipelineData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Win Rate Pie */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                Kazanma Oranı
              </h4>
              <div className="text-center mb-2">
                <div className="text-3xl font-bold text-emerald-600">{winRateData?.rate.toFixed(0) || 0}%</div>
                <div className="text-xs text-muted-foreground">{winRateData?.won || 0} / {(winRateData?.won || 0) + (winRateData?.lost || 0)}</div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winRateData?.pieData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {winRateData?.pieData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Kazanılan</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Kaybedilen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Bekleyen</span>
              </div>
            </div>

            {/* Top Customers */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                En İyi Müşteriler
              </h4>
              <div className="space-y-2">
                {topCustomers?.map((customer, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white",
                        index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-amber-700" : "bg-muted-foreground"
                      )}>{index + 1}</span>
                      <span className="text-sm truncate">{customer.name}</span>
                    </div>
                    <span className="text-sm font-medium">₺{customer.value.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
                {!topCustomers?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Veri bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
