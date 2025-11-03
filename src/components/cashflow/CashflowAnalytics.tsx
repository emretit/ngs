import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowMainItem } from "@/hooks/useCashflowMain";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar } from "lucide-react";

interface CashflowAnalyticsProps {
  data: CashflowMainItem[];
  selectedYear: number;
}

const CASHFLOW_STRUCTURE = {
  inflows: ['operating_inflows', 'investing_activities', 'financing_activities'],
  outflows: ['operating_outflows'],
};

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const CashflowAnalytics = ({ data, selectedYear }: CashflowAnalyticsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate monthly data
  const monthlyData = MONTHS.map((month, index) => {
    const monthNum = index + 1;

    const inflows = data
      .filter(item =>
        item.month === monthNum &&
        CASHFLOW_STRUCTURE.inflows.includes(item.main_category)
      )
      .reduce((sum, item) => sum + item.value, 0);

    const outflows = data
      .filter(item =>
        item.month === monthNum &&
        CASHFLOW_STRUCTURE.outflows.includes(item.main_category)
      )
      .reduce((sum, item) => sum + item.value, 0);

    return {
      month,
      inflows,
      outflows,
      net: inflows - outflows
    };
  });

  // Calculate category totals
  const categoryData = [
    {
      category: 'Operasyonel Girişler',
      value: data.filter(item => item.main_category === 'operating_inflows').reduce((sum, item) => sum + item.value, 0),
      color: 'from-green-500 to-green-600'
    },
    {
      category: 'Operasyonel Çıkışlar',
      value: data.filter(item => item.main_category === 'operating_outflows').reduce((sum, item) => sum + item.value, 0),
      color: 'from-red-500 to-red-600'
    },
    {
      category: 'Yatırım Faaliyetleri',
      value: data.filter(item => item.main_category === 'investing_activities').reduce((sum, item) => sum + item.value, 0),
      color: 'from-blue-500 to-blue-600'
    },
    {
      category: 'Finansman Faaliyetleri',
      value: data.filter(item => item.main_category === 'financing_activities').reduce((sum, item) => sum + item.value, 0),
      color: 'from-purple-500 to-purple-600'
    }
  ];

  // Find best and worst months
  const bestMonth = monthlyData.reduce((max, month) => month.net > max.net ? month : max, monthlyData[0]);
  const worstMonth = monthlyData.reduce((min, month) => month.net < min.net ? month : min, monthlyData[0]);

  // Calculate max values for chart scaling
  const maxInflow = Math.max(...monthlyData.map(m => m.inflows));
  const maxOutflow = Math.max(...monthlyData.map(m => m.outflows));
  const maxValue = Math.max(maxInflow, maxOutflow);

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              En İyi Ay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-700">{bestMonth.month}</div>
              <div className="text-sm text-green-600">
                Net Akış: <span className="font-semibold">{formatCurrency(bestMonth.net)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              En Düşük Ay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-700">{worstMonth.month}</div>
              <div className="text-sm text-red-600">
                Net Akış: <span className="font-semibold">{formatCurrency(worstMonth.net)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Aylık Nakit Akış Trendi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-20">{month.month}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-600">Giriş: {formatCurrency(month.inflows)}</span>
                    <span className="text-red-600">Çıkış: {formatCurrency(month.outflows)}</span>
                    <span className={`font-semibold ${month.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Net: {formatCurrency(month.net)}
                    </span>
                  </div>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  {/* Inflows bar */}
                  <div
                    className="absolute left-0 top-0 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded transition-all"
                    style={{ width: `${(month.inflows / maxValue) * 100}%` }}
                  />
                  {/* Outflows bar */}
                  <div
                    className="absolute left-0 bottom-0 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded transition-all"
                    style={{ width: `${(month.outflows / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Kategori Bazlı Dağılım
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category, index) => {
              const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
              const percentage = total > 0 ? (category.value / total) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                      <span className="font-semibold">{formatCurrency(category.value)}</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full bg-gradient-to-r ${category.color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Çeyreksel Analiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((quarter) => {
              const quarterMonths = monthlyData.slice((quarter - 1) * 3, quarter * 3);
              const totalInflows = quarterMonths.reduce((sum, m) => sum + m.inflows, 0);
              const totalOutflows = quarterMonths.reduce((sum, m) => sum + m.outflows, 0);
              const netQuarter = totalInflows - totalOutflows;

              return (
                <div key={quarter} className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Ç{quarter}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giriş:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(totalInflows)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Çıkış:</span>
                      <span className="text-red-600 font-medium">{formatCurrency(totalOutflows)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="font-semibold text-gray-700">Net:</span>
                      <span className={`font-bold ${netQuarter >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(netQuarter)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowAnalytics;
