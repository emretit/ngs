import { memo, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllAccounts } from "@/hooks/useAccountsData";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { DollarSign, Building, Wallet, CreditCard, Receipt, Calculator, Plus, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";

const MONTHS = [
  { value: "all", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" }
];

const Cashflow = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const { data: allAccounts, isLoading: accountsLoading } = useAllAccounts();
  const { categories, loading: categoriesLoading } = useCashflowCategories();

  // Generate years (5 years back, current year, 2 years forward)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const selectedMonthName = selectedMonth === "all"
    ? "Tüm Aylar"
    : MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const dateLabel = `${selectedYear} - ${selectedMonthName}`;

  // Calculate totals - memoized
  const stats = useMemo(() => {
    const totalAccounts = (allAccounts?.cashAccounts?.length || 0) +
      (allAccounts?.bankAccounts?.length || 0) +
      (allAccounts?.creditCards?.length || 0) +
      (allAccounts?.partnerAccounts?.length || 0);

    const totalBalance =
      (allAccounts?.cashAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.bankAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.creditCards?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0) +
      (allAccounts?.partnerAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0);

    const incomeCategories = categories.filter(cat => cat.type === 'income').length;
    const expenseCategories = categories.filter(cat => cat.type === 'expense').length;

    return {
      totalAccounts,
      totalBalance,
      incomeCategories,
      expenseCategories,
      totalCategories: incomeCategories + expenseCategories,
    };
  }, [allAccounts, categories]);

  const loading = accountsLoading || categoriesLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Clean Header Section - Diğer dashboard'lar gibi */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Nakit Akış Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Tüm nakit akışı işlemlerinizi takip edin ve yönetin
              </p>
            </div>
          </div>

          {/* Year and Month Selectors */}
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ay Seçin" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ana Nakit Akış Kartları - Diğer dashboard'lar gibi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Hesaplar Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate("/cashflow/bank-accounts")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Hesaplar</h2>
                    <p className="text-xs text-gray-500">Banka, kasa, kredi kartı</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/cashflow/bank-accounts");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Toplam Hesap</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalAccounts}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Bakiye</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(stats.totalBalance, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gelirler ve Giderler Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200 cursor-pointer"
            onClick={() => navigate("/cashflow/expenses")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Masraflar</h2>
                    <p className="text-xs text-gray-500">Masraf işlemleri</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/cashflow/expenses");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Kategoriler</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalCategories}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Gelir/Gider</span>
                    <span className="text-sm font-bold text-green-600">{stats.incomeCategories}/{stats.expenseCategories}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bütçe Yönetimi Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
            onClick={() => navigate("/cashflow/budget-management")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Bütçe</h2>
                    <p className="text-xs text-gray-500">Bütçe yönetimi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/cashflow/budget-management");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Durum</span>
                  <span className="text-sm font-bold text-gray-900">Aktif</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Yönetim</span>
                    <span className="text-sm font-bold text-green-600">Açık</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Çekler ve Senetler Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
            onClick={() => navigate("/cashflow/checks-notes")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Çekler/Senetler</h2>
                    <p className="text-xs text-gray-500">Çek ve senet takibi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/cashflow/checks-notes");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Durum</span>
                  <span className="text-sm font-bold text-gray-900">Aktif</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Takip</span>
                    <span className="text-sm font-bold text-green-600">Açık</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Krediler Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-red-200 cursor-pointer"
            onClick={() => navigate("/cashflow/loans")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Krediler</h2>
                    <p className="text-xs text-gray-500">Kredi ve borç yönetimi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/cashflow/loans");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Durum</span>
                  <span className="text-sm font-bold text-gray-900">Aktif</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Yönetim</span>
                    <span className="text-sm font-bold text-green-600">Açık</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları - Modernize edilmiş */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Accounts */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                Toplam Hesaplar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalAccounts}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Aktif hesap sayısı</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Balance */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Toplam Bakiye
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalBalance, 'TRY')}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span>Tüm hesaplardaki toplam</span>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-purple-500" />
                Kategoriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalCategories}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>{stats.incomeCategories} gelir, {stats.expenseCategories} gider</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default memo(Cashflow);
