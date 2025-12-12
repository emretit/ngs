import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ShoppingCart, TrendingUp, Building, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ReportsPurchasingSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ReportsPurchasingSection({ isExpanded, onToggle, searchParams }: ReportsPurchasingSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Monthly Volume with trend
  const { data: monthlyVolume } = useQuery({
    queryKey: ['monthlyPurchasing', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('einvoices').select('total_amount, created_at');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const monthlyData = (data || []).reduce((acc: Record<string, number>, invoice) => {
        const month = new Date(invoice.created_at).toLocaleDateString('tr-TR', { month: 'short' });
        acc[month] = (acc[month] || 0) + (invoice.total_amount || 0);
        return acc;
      }, {});
      
      return Object.entries(monthlyData).map(([month, amount]) => ({ month, tutar: amount }));
    },
    enabled: isExpanded
  });

  // Open Purchase Orders
  const { data: openPOs } = useQuery({
    queryKey: ['openPurchaseOrders'],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('einvoices')
        .select('invoice_number, supplier_name, total_amount, due_date', { count: 'exact' })
        .in('status', ['new', 'pending'])
        .order('due_date', { ascending: true })
        .limit(5);
      return { items: data || [], count: count || 0 };
    },
    enabled: isExpanded
  });

  // Supplier Analysis
  const { data: supplierData } = useQuery({
    queryKey: ['supplierAnalysis', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('einvoices').select('supplier_name, total_amount');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const supplierTotals = (data || []).reduce((acc: Record<string, number>, invoice) => {
        const supplier = invoice.supplier_name || 'Bilinmiyor';
        acc[supplier] = (acc[supplier] || 0) + (invoice.total_amount || 0);
        return acc;
      }, {});
      
      return Object.entries(supplierTotals)
        .map(([name, value]) => ({ name: name.substring(0, 15), value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
    enabled: isExpanded
  });

  // Invoice Status Distribution
  const { data: statusDistribution } = useQuery({
    queryKey: ['invoiceStatusDist', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('einvoices').select('status, total_amount');
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      const { data } = await query;
      
      const statusMap: Record<string, string> = {
        new: 'Yeni',
        pending: 'Beklemede',
        approved: 'Onaylı',
        paid: 'Ödendi',
        rejected: 'Reddedildi'
      };
      
      const statusTotals = (data || []).reduce((acc: Record<string, number>, inv: any) => {
        const status = statusMap[inv.status] || inv.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(statusTotals).map(([name, value], i) => ({
        name,
        value,
        fill: ['#3b82f6', '#f59e0b', '#22c55e', '#10b981', '#ef4444'][i % 5]
      }));
    },
    enabled: isExpanded
  });

  const totalPurchasing = monthlyVolume?.reduce((sum, m) => sum + (m.tutar as number), 0) || 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Satın Alma</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">Toplam: ₺{totalPurchasing.toLocaleString('tr-TR')}</Badge>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {openPOs?.count || 0} Açık
                  </Badge>
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
            {/* Monthly Trend Line Chart */}
            <div className="lg:col-span-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Aylık Satın Alma Trendi
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Tutar']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="tutar" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Supplier Bar Chart */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                Tedarikçi Analizi
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={60} />
                    <Tooltip 
                      formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Toplam']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Pie + Open POs */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Fatura Durumları
              </h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                      {statusDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Açık Siparişler
                </h5>
                {openPOs?.items.slice(0, 3).map((po, i) => (
                  <div key={i} className="text-xs flex justify-between items-center p-1.5 bg-muted/30 rounded">
                    <span className="truncate max-w-[100px]">{po.supplier_name}</span>
                    <span className="font-medium">₺{(po.total_amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
