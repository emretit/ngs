
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { Download, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const DealAnalytics = () => {
  // This would normally come from a hook or API call
  const data = useMemo(() => [
    { name: "Ocak", yeni: 4, gorusme: 3, won: 2, lost: 1 },
    { name: "Şubat", yeni: 6, gorusme: 4, won: 3, lost: 2 },
    { name: "Mart", yeni: 8, gorusme: 6, won: 4, lost: 2 },
    { name: "Nisan", yeni: 10, gorusme: 7, won: 5, lost: 3 },
    { name: "Mayıs", yeni: 12, gorusme: 9, won: 6, lost: 3 },
  ], []);

  const kpis = [
    { 
      title: "Toplam Fırsat", 
      value: "46", 
      change: "+12%", 
      positive: true, 
      color: "bg-blue-100 text-blue-800" 
    },
    { 
      title: "Kazanım Oranı", 
      value: "43.5%", 
      change: "+5.2%", 
      positive: true, 
      color: "bg-green-100 text-green-800" 
    },
    { 
      title: "Ortalama Değer", 
      value: "₺32,240", 
      change: "+15.3%", 
      positive: true, 
      color: "bg-amber-100 text-amber-800" 
    },
    { 
      title: "Kaybedilen", 
      value: "11", 
      change: "-8%", 
      positive: true, 
      color: "bg-red-100 text-red-800" 
    },
  ];

  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    // This would normally generate and download a report
    toast.info(`${format.toUpperCase()} raporu indiriliyor...`);
  };

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

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Fırsat Dağılımı</h3>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleDownloadReport('pdf')}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownloadReport('excel')}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="yeni" name="Yeni" fill="#3b82f6" />
              <Bar dataKey="gorusme" name="Görüşme" fill="#8b5cf6" />
              <Bar dataKey="won" name="Kazanılan" fill="#10b981" />
              <Bar dataKey="lost" name="Kaybedilen" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DealAnalytics;
