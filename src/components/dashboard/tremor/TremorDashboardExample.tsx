import { Card, Metric, Text, Flex, BadgeDelta, DeltaType, Grid } from "@tremor/react";
import { BarChart, AreaChart, LineChart } from "@tremor/react";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

// Örnek veri
const salesData = [
  { month: "Ocak", revenue: 2890, expenses: 2338 },
  { month: "Şubat", revenue: 2756, expenses: 2103 },
  { month: "Mart", revenue: 3322, expenses: 2194 },
  { month: "Nisan", revenue: 3470, expenses: 2108 },
  { month: "Mayıs", revenue: 3120, expenses: 2400 },
  { month: "Haziran", revenue: 3890, expenses: 2500 },
];

const chartData = [
  { date: "Ocak", "Satış": 2890, "Gider": 2338 },
  { date: "Şubat", "Satış": 2756, "Gider": 2103 },
  { date: "Mart", "Satış": 3322, "Gider": 2194 },
  { date: "Nisan", "Satış": 3470, "Gider": 2108 },
];

// KPI Kartları için veri
const kpiData = [
  {
    title: "Aylık Ciro",
    metric: "₺347,000",
    delta: "12.5%",
    deltaType: "moderateIncrease" as DeltaType,
    icon: DollarSign,
  },
  {
    title: "Toplam Satış",
    metric: "1,234",
    delta: "8.2%",
    deltaType: "moderateIncrease" as DeltaType,
    icon: ShoppingCart,
  },
  {
    title: "Aktif Müşteriler",
    metric: "456",
    delta: "5.1%",
    deltaType: "moderateIncrease" as DeltaType,
    icon: Users,
  },
  {
    title: "Büyüme Oranı",
    metric: "23.4%",
    delta: "2.3%",
    deltaType: "moderateIncrease" as DeltaType,
    icon: TrendingUp,
  },
];

export function TremorDashboardExample() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI Kartları */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
        {kpiData.map((item) => (
          <Card key={item.title}>
            <Flex alignItems="start">
              <div className="truncate">
                <Text>{item.title}</Text>
                <Metric className="truncate">{item.metric}</Metric>
              </div>
              <BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>
            </Flex>
            <Flex className="mt-4 space-x-2">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Grafikler */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Bar Chart */}
        <Card>
          <Text className="text-lg font-semibold mb-4">Aylık Satış ve Giderler</Text>
          <BarChart
            className="h-80"
            data={chartData}
            index="date"
            categories={["Satış", "Gider"]}
            colors={["blue", "red"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            yAxisWidth={60}
            showLegend={true}
            showGridLines={true}
          />
        </Card>

        {/* Area Chart */}
        <Card>
          <Text className="text-lg font-semibold mb-4">Gelir Trendi</Text>
          <AreaChart
            className="h-80"
            data={chartData}
            index="date"
            categories={["Satış"]}
            colors={["emerald"]}
            valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
            yAxisWidth={60}
            showLegend={false}
            showGridLines={true}
          />
        </Card>
      </Grid>

      {/* Line Chart - Tam Genişlik */}
      <Card>
        <Text className="text-lg font-semibold mb-4">6 Aylık Performans Analizi</Text>
        <LineChart
          className="h-80"
          data={chartData}
          index="date"
          categories={["Satış", "Gider"]}
          colors={["blue", "red"]}
          valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
          yAxisWidth={60}
          showLegend={true}
          showGridLines={true}
          curveType="natural"
        />
      </Card>
    </div>
  );
}
