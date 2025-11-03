import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashflowMainItem } from "@/hooks/useCashflowMain";
import { TrendingUp, Activity, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";

interface CashflowForecastProps {
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

const CashflowForecast = ({ data, selectedYear }: CashflowForecastProps) => {
  const [scenario, setScenario] = useState<"expected" | "best" | "worst">("expected");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate historical averages for forecasting
  const calculateMonthlyAverages = () => {
    const monthlyAverages = MONTHS.map((_, index) => {
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
        inflows,
        outflows,
        net: inflows - outflows
      };
    });

    return monthlyAverages;
  };

  const historicalData = calculateMonthlyAverages();

  // Calculate averages
  const avgInflows = historicalData.reduce((sum, m) => sum + m.inflows, 0) / 12;
  const avgOutflows = historicalData.reduce((sum, m) => sum + m.outflows, 0) / 12;
  const avgNet = avgInflows - avgOutflows;

  // Calculate trend (simple linear regression)
  const calculateTrend = () => {
    const netValues = historicalData.map(m => m.net);
    const n = netValues.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = netValues.reduce((sum, val) => sum + val, 0);
    const sumXY = netValues.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const trend = calculateTrend();

  // Generate 6-month forecast
  const generateForecast = () => {
    const currentMonth = new Date().getMonth();
    const forecastMonths = [];

    for (let i = 1; i <= 6; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const monthName = MONTHS[monthIndex];

      // Base forecast on historical average and trend
      const trendValue = trend.intercept + trend.slope * (12 + i);
      const baseInflows = avgInflows * (1 + (trend.slope / avgNet) * 0.5);
      const baseOutflows = avgOutflows * 0.98; // Slight optimization assumption

      // Scenario adjustments
      let inflowsMultiplier = 1;
      let outflowsMultiplier = 1;

      if (scenario === "best") {
        inflowsMultiplier = 1.15;
        outflowsMultiplier = 0.9;
      } else if (scenario === "worst") {
        inflowsMultiplier = 0.85;
        outflowsMultiplier = 1.1;
      }

      const forecastInflows = baseInflows * inflowsMultiplier;
      const forecastOutflows = baseOutflows * outflowsMultiplier;
      const forecastNet = forecastInflows - forecastOutflows;

      // Calculate confidence based on historical variance
      const historicalVariance = historicalData.reduce((sum, m) => {
        return sum + Math.pow(m.net - avgNet, 2);
      }, 0) / 12;
      const confidence = Math.max(60, Math.min(95, 100 - (Math.sqrt(historicalVariance) / avgNet) * 100));

      forecastMonths.push({
        month: monthName,
        inflows: forecastInflows,
        outflows: forecastOutflows,
        net: forecastNet,
        confidence: Math.round(confidence)
      });
    }

    return forecastMonths;
  };

  const forecast = generateForecast();

  // Calculate forecast totals
  const forecastTotalInflows = forecast.reduce((sum, m) => sum + m.inflows, 0);
  const forecastTotalOutflows = forecast.reduce((sum, m) => sum + m.outflows, 0);
  const forecastTotalNet = forecastTotalInflows - forecastTotalOutflows;

  // Determine health status
  const getHealthStatus = () => {
    if (forecastTotalNet > avgNet * 6 * 1.1) {
      return { status: "excellent", color: "green", icon: CheckCircle, message: "Güçlü pozitif trend" };
    } else if (forecastTotalNet > 0) {
      return { status: "good", color: "blue", icon: TrendingUp, message: "Pozitif akış bekleniyor" };
    } else if (forecastTotalNet > avgNet * 6 * 0.5) {
      return { status: "warning", color: "yellow", icon: AlertTriangle, message: "Dikkat gerekiyor" };
    } else {
      return { status: "critical", color: "red", icon: AlertTriangle, message: "Kritik seviye" };
    }
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Tahmin Senaryosu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button
              onClick={() => setScenario("best")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scenario === "best"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              İyimser
            </button>
            <button
              onClick={() => setScenario("expected")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scenario === "expected"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Beklenen
            </button>
            <button
              onClick={() => setScenario("worst")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scenario === "worst"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Kötümser
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-${health.color}-200 bg-gradient-to-br from-${health.color}-50 to-${health.color}-100`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-700 flex items-center gap-2">
              <HealthIcon className="h-4 w-4" />
              Genel Durum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">{health.message}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Tahmini Giriş</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">{formatCurrency(forecastTotalInflows)}</div>
            <div className="text-xs text-gray-500 mt-1">Sonraki 6 ay</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Tahmini Çıkış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{formatCurrency(forecastTotalOutflows)}</div>
            <div className="text-xs text-gray-500 mt-1">Sonraki 6 ay</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Tahmini Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${forecastTotalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(forecastTotalNet)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Sonraki 6 ay</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            6 Aylık Tahmin ({scenario === "best" ? "İyimser" : scenario === "worst" ? "Kötümser" : "Beklenen"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecast.map((month, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-gray-900">{month.month}</div>
                    <div className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-medium text-blue-700">
                      {month.confidence}% güven
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.net)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beklenen Giriş:</span>
                    <span className="text-green-600 font-medium">{formatCurrency(month.inflows)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beklenen Çıkış:</span>
                    <span className="text-red-600 font-medium">{formatCurrency(month.outflows)}</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${month.net >= 0 ? 'bg-green-500' : 'bg-red-500'} transition-all`}
                    style={{
                      width: `${Math.min(100, Math.abs(month.net) / Math.max(...forecast.map(f => Math.abs(f.net))) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Öneriler ve İçgörüler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecastTotalNet > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Pozitif Nakit Akışı</div>
                    <div className="text-sm text-gray-600">
                      Önümüzdeki 6 ayda pozitif nakit akışı bekleniyor. Yatırım fırsatlarını değerlendirebilirsiniz.
                    </div>
                  </div>
                </div>
                {trend.slope > 0 && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Büyüme Trendi</div>
                      <div className="text-sm text-gray-600">
                        Geçmiş verilere göre pozitif bir büyüme trendi mevcut. Bu momentumu korumaya çalışın.
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Dikkat Gerekli</div>
                    <div className="text-sm text-gray-600">
                      Önümüzdeki dönemde nakit sıkışıklığı yaşanabilir. Masrafları gözden geçirmeniz önerilir.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Finansman Seçenekleri</div>
                    <div className="text-sm text-gray-600">
                      Kısa vadeli finansman kaynaklarını değerlendirin. Kredileri ve nakit rezervlerini gözden geçirin.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowForecast;
