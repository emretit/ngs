import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Download,
  AlertTriangle,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import IncomeExpenseFilterBar from "@/components/budget/IncomeExpenseFilterBar";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { useIncomeExpenseAnalysis } from "@/hooks/useIncomeExpenseAnalysis";
import { useBudgetMatrix } from "@/hooks/useBudgetMatrix";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedBudgetMatrix from "@/components/budget/comparison/EnhancedBudgetMatrix";

const IncomeExpenseAnalysis = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<BudgetFiltersState>({
    year: currentYear,
    periodView: "yearly",
    company: "all",
    department: "all",
    project: "all",
    currency: "TRY",
  });

  const { data: analysisData, isLoading, error } = useIncomeExpenseAnalysis({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
  });

  // Bütçe verileri için hook
  const {
    matrixRows,
    grandTotals,
    loading: budgetLoading,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

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
    if (Math.abs(amount) >= 1000000) {
      return `${symbol}${(Math.abs(amount) / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${symbol}${(Math.abs(amount) / 1000).toFixed(0)}K`;
    }
    return `${symbol}${Math.abs(amount).toFixed(0)}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  const exportToCSV = () => {
    const { income, expenses, profit, comparisons } = analysisData;

    // Prepare CSV data
    const csvRows: string[] = [];

    // Header
    csvRows.push("Gelir-Gider Analizi Raporu");
    csvRows.push(`Yıl: ${filters.year}`);
    csvRows.push(`Para Birimi: ${filters.currency}`);
    csvRows.push("");

    // Summary
    csvRows.push("ÖZET");
    csvRows.push(`Toplam Gelir,${income.total}`);
    csvRows.push(`Toplam Gider,${expenses.total}`);
    csvRows.push(`Net Kar,${profit.total}`);
    csvRows.push(`Kar Marjı,${profit.margin.toFixed(2)}%`);
    csvRows.push("");

    // Income by Customer
    csvRows.push("GELİR - MÜŞTERİ BAZLI");
    csvRows.push("Müşteri, Tutar, Yüzde, Fatura Sayısı");
    income.byCustomer.forEach((customer) => {
      csvRows.push(`${customer.customerName},${customer.amount},${customer.percentage.toFixed(2)}%,${customer.invoiceCount}`);
    });
    csvRows.push("");

    // Expenses by Category
    csvRows.push("GİDER - KATEGORİ BAZLI");
    csvRows.push("Kategori, Tutar, Yüzde, Gider Sayısı");
    expenses.byCategory.forEach((category) => {
      csvRows.push(`${category.categoryName},${category.amount},${category.percentage.toFixed(2)}%,${category.expenseCount}`);
    });
    csvRows.push("");

    // Monthly data
    csvRows.push("AYLIK VERİLER");
    csvRows.push("Ay, Gelir, Gider, Kar, Kar Marjı");
    profit.byMonth.forEach((month) => {
      csvRows.push(`${month.monthName},${month.income},${month.expenses},${month.profit},${month.margin.toFixed(2)}%`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gelir_gider_analizi_${filters.year}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || budgetLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">Veriler yüklenirken bir hata oluştu</p>
        <p className="text-xs text-muted-foreground">Lütfen sayfayı yenileyin</p>
      </div>
    );
  }

  const { income, expenses, profit, comparisons } = analysisData;

  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

  // Bütçe grafiği için kategori bazlı veri
  const budgetCategoryData = matrixRows
    .filter(row => !row.isSubcategory)
    .map(row => ({
      category: row.category,
      budget: row.total.budget_amount,
      actual: row.total.actual_amount,
    }));

  // Bütçe grafiği için aylık veri
  const budgetMonthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const cell = grandTotals.months[month] || {
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0,
      variance: 0,
      variancePercent: 0,
    };

    return {
      month: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][i],
      budget: cell.budget_amount,
      actual: cell.actual_amount,
      forecast: cell.forecast_amount,
      variance: cell.variance,
    };
  });

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div className="flex flex-col gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Üst kısım - Başlık ve Buton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/budget")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight">Gelir-Gider Analizi</h1>
              <p className="text-xs text-muted-foreground">
                Detaylı gelir ve gider analizi, karşılaştırmalar ve trendler
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Excel'e Aktar
          </Button>
        </div>

        {/* İstatistikler - Header içinde */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Toplam Gelir */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span className="font-medium">Gelir</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(income.total)}
            </span>
          </div>

          {/* Toplam Gider */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <ArrowDownCircle className="h-3.5 w-3.5" />
            <span className="font-medium">Gider</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(expenses.total)}
            </span>
          </div>

          {/* Net Kar */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border",
            profit.total >= 0 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          )}>
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-medium">Net Kar</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(profit.total)}
            </span>
          </div>

          {/* Kar Marjı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">Kar Marjı</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatPercent(profit.margin)}
            </span>
          </div>

          {/* Önceki Yıl Karşılaştırması */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border",
            comparisons.vsPreviousYear.profit.change >= 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}>
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">Önceki Yıl</span>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatPercent(comparisons.vsPreviousYear.profit.changePercent)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <IncomeExpenseFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Detaylı Matris
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Sadece tablolar ve karşılaştırmalar */}
        <TabsContent value="overview" className="space-y-4">
          {/* Gelir Analizi Bölümü */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bazlı Gelir Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-right">Yüzde</TableHead>
                      <TableHead className="text-right">Fatura Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.byCustomer.map((customer, index) => (
                      <TableRow key={customer.customerId}>
                        <TableCell>{customer.customerName}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatAmount(customer.amount)}
                        </TableCell>
                        <TableCell className="text-right">{customer.percentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                      </TableRow>
                    ))}
                    {income.byCustomer.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Veri bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Gider Analizi Bölümü */}
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bazlı Gider Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-right">Yüzde</TableHead>
                      <TableHead className="text-right">Gider Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.byCategory.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell>{category.categoryName}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatAmount(category.amount)}
                        </TableCell>
                        <TableCell className="text-right">{category.percentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{category.expenseCount}</TableCell>
                      </TableRow>
                    ))}
                    {expenses.byCategory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Veri bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {expenses.bySubcategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Alt Kategori Bazlı Gider Analizi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Alt Kategori</TableHead>
                        <TableHead className="text-right">Tutar</TableHead>
                        <TableHead className="text-right">Yüzde</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.bySubcategory.slice(0, 20).map((subcategory, index) => (
                        <TableRow key={index}>
                          <TableCell>{subcategory.categoryName}</TableCell>
                          <TableCell>{subcategory.subcategory}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatAmount(subcategory.amount)}
                          </TableCell>
                          <TableCell className="text-right">{subcategory.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Karşılaştırmalar Bölümü */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bütçe Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gelir</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">Bütçe</p>
                      <p className="text-sm font-semibold">{formatAmount(comparisons.vsBudget.income.budget)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Gerçekleşen</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatAmount(comparisons.vsBudget.income.actual)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsBudget.income.variance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    Varyans: {formatAmount(comparisons.vsBudget.income.variance)} ({formatPercent(comparisons.vsBudget.income.variancePercent)})
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Gider</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">Bütçe</p>
                      <p className="text-sm font-semibold">{formatAmount(comparisons.vsBudget.expenses.budget)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Gerçekleşen</p>
                      <p className="text-sm font-semibold text-red-600">
                        {formatAmount(comparisons.vsBudget.expenses.actual)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsBudget.expenses.variance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    Varyans: {formatAmount(comparisons.vsBudget.expenses.variance)} ({formatPercent(comparisons.vsBudget.expenses.variancePercent)})
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Kar</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">Bütçe</p>
                      <p className="text-sm font-semibold">{formatAmount(comparisons.vsBudget.profit.budget)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Gerçekleşen</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        comparisons.vsBudget.profit.actual >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatAmount(comparisons.vsBudget.profit.actual)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsBudget.profit.variance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    Varyans: {formatAmount(comparisons.vsBudget.profit.variance)} ({formatPercent(comparisons.vsBudget.profit.variancePercent)})
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Önceki Yıl Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Gelir</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">{filters.year - 1}</p>
                      <p className="text-sm font-semibold">
                        {formatAmount(comparisons.vsPreviousYear.income.previous)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{filters.year}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatAmount(comparisons.vsPreviousYear.income.current)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsPreviousYear.income.change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    Değişim: {formatAmount(comparisons.vsPreviousYear.income.change)} ({formatPercent(comparisons.vsPreviousYear.income.changePercent)})
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Gider</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">{filters.year - 1}</p>
                      <p className="text-sm font-semibold">
                        {formatAmount(comparisons.vsPreviousYear.expenses.previous)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{filters.year}</p>
                      <p className="text-sm font-semibold text-red-600">
                        {formatAmount(comparisons.vsPreviousYear.expenses.current)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsPreviousYear.expenses.change >= 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                  )}>
                    Değişim: {formatAmount(comparisons.vsPreviousYear.expenses.change)} ({formatPercent(comparisons.vsPreviousYear.expenses.changePercent)})
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Kar</p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-muted-foreground">{filters.year - 1}</p>
                      <p className="text-sm font-semibold">
                        {formatAmount(comparisons.vsPreviousYear.profit.previous)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{filters.year}</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        comparisons.vsPreviousYear.profit.current >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatAmount(comparisons.vsPreviousYear.profit.current)}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded text-xs",
                    comparisons.vsPreviousYear.profit.change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    Değişim: {formatAmount(comparisons.vsPreviousYear.profit.change)} ({formatPercent(comparisons.vsPreviousYear.profit.changePercent)})
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab - Tüm grafikler burada */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Aylık Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profit.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Gelir" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Gider" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Kar" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gider Kategorileri Dağılımı */}
            <Card>
              <CardHeader>
                <CardTitle>Gider Kategorileri Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenses.byCategory.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenses.byCategory.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Aylık Gelir Trendi */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={income.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#10b981" name="Gelir" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Aylık Gider Trendi */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Gider Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenses.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#ef4444" name="Gider" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gelir vs Gider Karşılaştırması */}
            <Card>
              <CardHeader>
                <CardTitle>Gelir vs Gider Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profit.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Gelir" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Gider" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Kar Marjı Trendi */}
            <Card>
              <CardHeader>
                <CardTitle>Kar Marjı Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profit.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Kar Marjı %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Kategori Bazlı Bütçe vs Gerçekleşen */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Bütçe vs Gerçekleşen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Bütçe" />
                    <Bar dataKey="actual" fill="#10b981" name="Gerçekleşen" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Aylık Bütçe vs Gerçekleşen vs Tahmin */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Bütçe vs Gerçekleşen vs Tahmin</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={budgetMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Bütçe" />
                    <Bar dataKey="actual" fill="#10b981" name="Gerçekleşen" />
                    <Bar dataKey="forecast" fill="#f59e0b" name="Tahmin" />
                    <Line
                      type="monotone"
                      dataKey="variance"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Varyans"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detaylı Matris Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <EnhancedBudgetMatrix 
            filters={filters} 
            showSubcategories={true}
            editable={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeExpenseAnalysis;

