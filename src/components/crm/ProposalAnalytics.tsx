import { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useProposals } from "@/hooks/useProposals";

const ProposalAnalytics = () => {
  const { data } = useProposals();

  // This would normally come from a hook or API call
  const chartData = useMemo(() => [
    { name: "Ocak", gonderilen: 8, onaylanan: 3, reddedilen: 2, beklenen: 3 },
    { name: "Şubat", gonderilen: 10, onaylanan: 5, reddedilen: 2, beklenen: 3 },
    { name: "Mart", gonderilen: 12, onaylanan: 6, reddedilen: 3, beklenen: 3 },
    { name: "Nisan", gonderilen: 15, onaylanan: 8, reddedilen: 4, beklenen: 3 },
    { name: "Mayıs", gonderilen: 18, onaylanan: 10, reddedilen: 4, beklenen: 4 },
  ], []);
  
  const trendData = useMemo(() => [
    { name: "Ocak", deger: 150000 },
    { name: "Şubat", deger: 180000 },
    { name: "Mart", deger: 210000 },
    { name: "Nisan", deger: 250000 },
    { name: "Mayıs", deger: 320000 },
  ], []);

  const kpis = [
    { 
      title: "Toplam Teklif", 
      value: data?.length.toString() || "0", 
      change: "+18%", 
      positive: true, 
      color: "bg-purple-100 text-purple-800" 
    },
    { 
      title: "Onay Oranı", 
      value: "53.2%", 
      change: "+7.8%", 
      positive: true, 
      color: "bg-green-100 text-green-800" 
    },
    { 
      title: "Ortalama Değer", 
      value: "₺42,800", 
      change: "+12.5%", 
      positive: true, 
      color: "bg-blue-100 text-blue-800" 
    },
    { 
      title: "Müzakerede", 
      value: "14", 
      change: "+5", 
      positive: true, 
      color: "bg-amber-100 text-amber-800" 
    },
  ];

  const latestProposals = data?.slice(0, 3) || [];

  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    toast.info(`${format.toUpperCase()} raporu indiriliyor...`);
  };

  // Calculate metrics from actual data
  const calculateMetrics = () => {
    if (!data || data.length === 0) return null;

    const totalProposals = data.length;
    const acceptedProposals = data.filter(p => p.status === 'accepted').length;
    const rejectedProposals = data.filter(p => p.status === 'rejected').length;
    const pendingProposals = totalProposals - acceptedProposals - rejectedProposals;

    const totalValue = data.reduce((sum, p) => sum + (p.total_amount || p.total_value || 0), 0);
    const averageValue = totalValue / totalProposals || 0;
    const acceptanceRate = (acceptedProposals / totalProposals) * 100 || 0;

    return {
      totalProposals,
      acceptanceRate,
      averageValue,
      totalValue,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-4 flex flex-col items-center">
            <div className="text-sm text-gray-500 mb-1">{kpi.title}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className={`mt-1 text-xs px-2 py-1 rounded-full ${kpi.color} flex items-center`}>
              {kpi.positive ? "↑" : "↓"} {kpi.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart - Proposal Status Distribution */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Teklif Durumu</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleDownloadReport('pdf')}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="gonderilen" name="Gönderilen" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" />
                <Area type="monotone" dataKey="onaylanan" name="Onaylanan" stackId="2" fill="#10b981" stroke="#10b981" />
                <Area type="monotone" dataKey="reddedilen" name="Reddedilen" stackId="3" fill="#ef4444" stroke="#ef4444" />
                <Area type="monotone" dataKey="beklenen" name="Bekleyen" stackId="4" fill="#f59e0b" stroke="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart - Value Trend */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Toplam Değer Trendi</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleDownloadReport('excel')}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₺${value.toLocaleString()}`, 'Toplam Değer']} />
                <Line type="monotone" dataKey="deger" name="Toplam Değer" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Proposals */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Son Teklifler</h3>
        <div className="space-y-3">
          {latestProposals.length > 0 ? (
            latestProposals.map((proposal) => (
              <div key={proposal.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium">{proposal.title}</div>
                  <div className="text-sm text-gray-500">
                    {proposal.customer?.name || proposal.customer_name || 'İsimsiz Müşteri'} • {new Date(proposal.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 text-right">
                    <div className="font-semibold">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(proposal.total_amount || proposal.total_value || 0)}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                      proposal.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      proposal.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {proposal.status === 'accepted' ? 'Onaylandı' : 
                       proposal.status === 'rejected' ? 'Reddedildi' : 
                       'Beklemede'}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              Henüz teklif bulunmuyor
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProposalAnalytics;

