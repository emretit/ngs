import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BenchmarkAnalysisProps {
  filters: BudgetFiltersState;
}

const BenchmarkAnalysis = ({ filters }: BenchmarkAnalysisProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock data - Yıllar arası karşılaştırma
  const yearlyComparisonData = [
    {
      category: "Maaş ve Ücretler",
      "2023": 1800000,
      "2024": 1950000,
      "2025": 2100000,
    },
    {
      category: "Operasyonel",
      "2023": 600000,
      "2024": 700000,
      "2025": 650000,
    },
    {
      category: "Kira",
      "2023": 350000,
      "2024": 380000,
      "2025": 400000,
    },
    {
      category: "Vergi",
      "2023": 550000,
      "2024": 650000,
      "2025": 700000,
    },
    {
      category: "Araç",
      "2023": 280000,
      "2024": 270000,
      "2025": 250000,
    },
  ];

  // Mock data - Departman karşılaştırması
  const departmentComparisonData = [
    {
      department: "Satış",
      budget: 1200000,
      actual: 1150000,
      utilization: 95.8,
    },
    {
      department: "Pazarlama",
      budget: 800000,
      actual: 850000,
      utilization: 106.3,
    },
    {
      department: "Operasyon",
      budget: 950000,
      actual: 900000,
      utilization: 94.7,
    },
    {
      department: "İK",
      budget: 650000,
      actual: 620000,
      utilization: 95.4,
    },
    {
      department: "IT",
      budget: 500000,
      actual: 580000,
      utilization: 116.0,
    },
  ];

  // Mock data - Aylık trend karşılaştırması
  const monthlyTrendData = [
    { month: "Oca", "2024": 320000, "2025": 350000 },
    { month: "Şub", "2024": 315000, "2025": 345000 },
    { month: "Mar", "2024": 330000, "2025": 360000 },
    { month: "Nis", "2024": 340000, "2025": 370000 },
    { month: "May", "2024": 335000, "2025": 365000 },
    { month: "Haz", "2024": 345000, "2025": 375000 },
    { month: "Tem", "2024": 350000, "2025": 380000 },
    { month: "Ağu", "2024": 355000, "2025": 385000 },
  ];

  // Mock data - Performans radar chart
  const performanceRadarData = [
    { metric: "Bütçe Uyumu", value: 85, fullMark: 100 },
    { metric: "Tahmin Doğruluğu", value: 78, fullMark: 100 },
    { metric: "Maliyet Kontrolü", value: 92, fullMark: 100 },
    { metric: "Verimlilik", value: 88, fullMark: 100 },
    { metric: "Planlama Kalitesi", value: 75, fullMark: 100 },
  ];

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${(amount / 1000).toFixed(0)}K`;
  };

  // Yıllık büyüme hesaplama
  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  const totalGrowth2024 = calculateGrowth(
    yearlyComparisonData.reduce((sum, item) => sum + item["2024"], 0),
    yearlyComparisonData.reduce((sum, item) => sum + item["2023"], 0)
  );

  const totalGrowth2025 = calculateGrowth(
    yearlyComparisonData.reduce((sum, item) => sum + item["2025"], 0),
    yearlyComparisonData.reduce((sum, item) => sum + item["2024"], 0)
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">2024 Büyüme</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{totalGrowth2024.toFixed(1)}%</p>
                {totalGrowth2024 >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">2025 Büyüme (Tahmini)</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{totalGrowth2025.toFixed(1)}%</p>
                {totalGrowth2025 >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ortalama Departman Kullanımı</p>
              <p className="text-2xl font-bold">
                {(
                  departmentComparisonData.reduce((sum, d) => sum + d.utilization, 0) /
                  departmentComparisonData.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Benchmark Analizi</CardTitle>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="personnel">Personel Giderleri</SelectItem>
                <SelectItem value="operational">Operasyonel Giderler</SelectItem>
                <SelectItem value="capex">Sermaye Harcamaları</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="yearly" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="yearly">Yıllar Arası</TabsTrigger>
              <TabsTrigger value="department">Departman</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="performance">Performans</TabsTrigger>
            </TabsList>

            {/* Yıllar Arası Karşılaştırma */}
            <TabsContent value="yearly" className="space-y-4">
              <div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={yearlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(value) => formatAmount(value)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="2023" name="2023" fill="#94a3b8" />
                    <Bar dataKey="2024" name="2024" fill="#3b82f6" />
                    <Bar dataKey="2025" name="2025" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Yıllık Değişim Tablosu */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left pb-3 text-sm font-semibold">Kategori</th>
                      <th className="text-right pb-3 text-sm font-semibold">2023</th>
                      <th className="text-right pb-3 text-sm font-semibold">2024</th>
                      <th className="text-right pb-3 text-sm font-semibold">2025</th>
                      <th className="text-right pb-3 text-sm font-semibold">Değişim 24/23</th>
                      <th className="text-right pb-3 text-sm font-semibold">Değişim 25/24</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyComparisonData.map((item, index) => {
                      const growth2024 = calculateGrowth(item["2024"], item["2023"]);
                      const growth2025 = calculateGrowth(item["2025"], item["2024"]);
                      return (
                        <tr
                          key={index}
                          className={cn(
                            "border-b hover:bg-muted/50",
                            index % 2 === 0 ? "bg-muted/20" : ""
                          )}
                        >
                          <td className="py-3 text-sm font-medium">{item.category}</td>
                          <td className="py-3 text-sm text-right">{formatAmount(item["2023"])}</td>
                          <td className="py-3 text-sm text-right">{formatAmount(item["2024"])}</td>
                          <td className="py-3 text-sm text-right font-semibold">
                            {formatAmount(item["2025"])}
                          </td>
                          <td
                            className={cn(
                              "py-3 text-sm text-right font-medium",
                              growth2024 >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {growth2024 >= 0 ? "+" : ""}
                            {growth2024.toFixed(1)}%
                          </td>
                          <td
                            className={cn(
                              "py-3 text-sm text-right font-medium",
                              growth2025 >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {growth2025 >= 0 ? "+" : ""}
                            {growth2025.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Departman Karşılaştırması */}
            <TabsContent value="department" className="space-y-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={departmentComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => formatAmount(value)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="budget" name="Bütçe" fill="#3b82f6" />
                  <Bar dataKey="actual" name="Gerçekleşen" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left pb-3 text-sm font-semibold">Departman</th>
                      <th className="text-right pb-3 text-sm font-semibold">Bütçe</th>
                      <th className="text-right pb-3 text-sm font-semibold">Gerçekleşen</th>
                      <th className="text-right pb-3 text-sm font-semibold">Varyans</th>
                      <th className="text-right pb-3 text-sm font-semibold">Kullanım %</th>
                      <th className="text-center pb-3 text-sm font-semibold">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentComparisonData.map((dept, index) => {
                      const variance = dept.budget - dept.actual;
                      return (
                        <tr
                          key={index}
                          className={cn(
                            "border-b hover:bg-muted/50",
                            index % 2 === 0 ? "bg-muted/20" : ""
                          )}
                        >
                          <td className="py-3 text-sm font-medium">{dept.department}</td>
                          <td className="py-3 text-sm text-right">{formatAmount(dept.budget)}</td>
                          <td className="py-3 text-sm text-right font-medium">
                            {formatAmount(dept.actual)}
                          </td>
                          <td
                            className={cn(
                              "py-3 text-sm text-right font-semibold",
                              variance >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {formatAmount(variance)}
                          </td>
                          <td className="py-3 text-sm text-right font-semibold">
                            {dept.utilization.toFixed(1)}%
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                                dept.utilization <= 100
                                  ? "bg-green-100 text-green-700"
                                  : dept.utilization <= 110
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {dept.utilization <= 100
                                ? "✓ Hedefte"
                                : dept.utilization <= 110
                                ? "⚠ Dikkat"
                                : "✕ Aşım"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Trend Analizi */}
            <TabsContent value="trend" className="space-y-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => formatAmount(value)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="2024"
                    name="2024"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="2025"
                    name="2025"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-600 font-medium mb-2">2024 Ortalama</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatAmount(
                        monthlyTrendData.reduce((sum, item) => sum + item["2024"], 0) /
                          monthlyTrendData.length
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-green-600 font-medium mb-2">2025 Ortalama</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatAmount(
                        monthlyTrendData.reduce((sum, item) => sum + item["2025"], 0) /
                          monthlyTrendData.length
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performans Göstergeleri */}
            <TabsContent value="performance" className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Mevcut Performans"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {performanceRadarData.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{item.metric}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-sm text-muted-foreground">/100</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            item.value >= 90
                              ? "bg-green-600"
                              : item.value >= 70
                              ? "bg-blue-600"
                              : item.value >= 50
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          )}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BenchmarkAnalysis;

