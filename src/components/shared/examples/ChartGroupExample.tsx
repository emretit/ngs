// ChartGroup kullanım örnekleri
import React from "react";
import {
  EnhancedChart,
  CardChart,
  SimpleLineChart,
  SimpleBarChart,
  SimpleAreaChart,
  SimplePieChart,
  ChartGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  type ChartConfig,
} from "../index";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";

// Örnek veriler
const salesData = [
  { month: "Oca", sales: 4000, target: 3500, growth: 12 },
  { month: "Şub", sales: 3000, target: 3200, growth: -5 },
  { month: "Mar", sales: 5000, target: 4000, growth: 25 },
  { month: "Nis", sales: 2780, target: 3800, growth: -27 },
  { month: "May", sales: 1890, target: 3600, growth: -47 },
  { month: "Haz", sales: 2390, target: 3400, growth: -30 },
  { month: "Tem", sales: 3490, target: 3700, growth: -6 },
  { month: "Ağu", sales: 4200, target: 3900, growth: 8 },
];

const categoryData = [
  { category: "Teknoloji", value: 35, count: 142 },
  { category: "Pazarlama", value: 28, count: 98 },
  { category: "Satış", value: 22, count: 86 },
  { category: "İK", value: 15, count: 45 },
];

const performanceData = [
  { week: "1. Hafta", performance: 85, team: 78 },
  { week: "2. Hafta", performance: 92, team: 85 },
  { week: "3. Hafta", performance: 78, team: 72 },
  { week: "4. Hafta", performance: 95, team: 88 },
];

// Chart konfigürasyonları
const salesConfig: ChartConfig = {
  sales: {
    label: "Satış",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Hedef",
    color: "hsl(var(--chart-2))",
  },
  growth: {
    label: "Büyüme %",
    color: "hsl(var(--chart-3))",
  },
};

const categoryConfig: ChartConfig = {
  value: {
    label: "Değer",
    color: "hsl(var(--chart-1))",
  },
};

const performanceConfig: ChartConfig = {
  performance: {
    label: "Bireysel",
    color: "hsl(var(--chart-1))",
  },
  team: {
    label: "Takım",
    color: "hsl(var(--chart-2))",
  },
};

export function ChartGroupExample() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ChartGroup Bileşenleri Örneği
        </h1>
        <p className="text-gray-600">
          Farklı grafik türleri ve kullanım senaryoları
        </p>
      </div>

      {/* Basit Chart Örnekleri */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">1. Basit Chart Bileşenleri</h2>
        
        <ChartGrid columns={2} gap={6}>
          <SimpleLineChart
            data={salesData}
            config={salesConfig}
            dataKey="sales"
            xAxisKey="month"
            title="Aylık Satış Trendi"
            description="Son 8 ayın satış performansı"
            height={250}
            smooth={true}
            showDots={true}
            showTooltip={true}
          />

          <SimpleBarChart
            data={categoryData}
            config={categoryConfig}
            dataKey="value"
            xAxisKey="category"
            title="Kategori Dağılımı"
            description="Değer bazında kategori analizi"
            height={250}
            showTooltip={true}
          />
        </ChartGrid>

        <SimpleAreaChart
          data={performanceData}
          config={performanceConfig}
          dataKey={["performance", "team"]}
          xAxisKey="week"
          title="Performans Karşılaştırması"
          description="Haftalık bireysel ve takım performansı"
          height={300}
          stacked={false}
          fillOpacity={0.4}
          showLegend={true}
        />
      </section>

      {/* Card Chart Örnekleri */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">2. Card ile Sarılı Charts</h2>
        
        <ChartGrid columns={2} gap={6}>
          <CardChart
            config={salesConfig}
            title="Satış vs Hedef"
            description="Aylık satış hedef karşılaştırması"
            icon={TrendingUp}
            variant="elevated"
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="hsl(var(--chart-1))" />
                <Bar dataKey="target" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardChart>

          <SimplePieChart
            data={categoryData}
            config={categoryConfig}
            dataKey="value"
            nameKey="category"
            title="Kategori Pasta Grafiği"
            description="Oransal dağılım analizi"
            height={300}
            showLabels={true}
            showLegend={true}
          />
        </ChartGrid>
      </section>

      {/* Enhanced Chart Örnekleri */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">3. Gelişmiş Chart Kullanımları</h2>
        
        <ChartGrid columns={1} gap={6}>
          <CardChart
            config={salesConfig}
            title="Çok Serili Analiz"
            description="Satış, hedef ve büyüme oranı karşılaştırması"
            icon={BarChart3}
            variant="outlined"
            height={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                
                <Bar yAxisId="left" dataKey="sales" fill="hsl(var(--chart-1))" name="Satış" />
                <Bar yAxisId="left" dataKey="target" fill="hsl(var(--chart-2))" name="Hedef" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="growth" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                  name="Büyüme %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardChart>
        </ChartGrid>
      </section>

      {/* Mini Dashboard */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">4. Mini Dashboard Örneği</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Küçük Chart 1 */}
          <CardChart
            config={salesConfig}
            title="Trend"
            icon={Activity}
            height={180}
            className="text-xs"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.slice(-4)}>
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ResponsiveContainer>
          </CardChart>

          {/* Küçük Chart 2 */}
          <CardChart
            config={categoryConfig}
            title="Dağılım"
            icon={PieChart}
            height={180}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={30}
                  outerRadius={60}
                  fill="hsl(var(--chart-1))"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </CardChart>

          {/* Küçük Chart 3 */}
          <CardChart
            config={performanceConfig}
            title="Performans"
            icon={BarChart3}
            height={180}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <Bar dataKey="performance" fill="hsl(var(--chart-1))" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ResponsiveContainer>
          </CardChart>
        </div>
      </section>

      {/* Responsive Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">5. Responsive Chart Grid</h2>
        
        <ChartGrid columns={4} gap={4}>
          {salesData.slice(0, 4).map((data, index) => (
            <CardChart
              key={index}
              config={salesConfig}
              title={`${data.month} Satış`}
              height={150}
              className="text-xs"
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.sales.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Hedef: {data.target.toLocaleString('tr-TR')}
                  </div>
                  <div className={`text-xs mt-1 ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.growth >= 0 ? '+' : ''}{data.growth}%
                  </div>
                </div>
              </div>
            </CardChart>
          ))}
        </ChartGrid>
      </section>
    </div>
  );
}
