import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllAccounts } from "@/hooks/useAccountsData";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { DollarSign, Building, Wallet, CreditCard, Users, Receipt, ListTodo, Calculator, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
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

  const loading = accountsLoading || categoriesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const modules = [
    {
      title: "Hesaplar",
      description: "Banka, kasa, kredi kartı ve ortak hesaplarınız",
      icon: Building,
      path: "/cashflow/bank-accounts",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "from-emerald-50 to-emerald-100",
      stats: [
        { label: "Toplam Hesap", value: totalAccounts },
        { label: "Toplam Bakiye", value: formatCurrency(totalBalance) }
      ]
    },
    {
      title: "Masraflar",
      description: "Gelir ve gider işlemlerinizi yönetin",
      icon: Receipt,
      path: "/cashflow/expenses",
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100",
      stats: [
        { label: "Kategoriler", value: `${incomeCategories + expenseCategories} adet` }
      ]
    },
    {
      title: "OPEX Girişi",
      description: "Operasyonel giderlerinizi kaydedin",
      icon: Calculator,
      path: "/cashflow/opex-entry",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      stats: [
        { label: "Durum", value: "Hazır" }
      ]
    },
    {
      title: "Çekler ve Senetler",
      description: "Çek ve senet işlemlerinizi takip edin",
      icon: Wallet,
      path: "/cashflow/checks-notes",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      stats: [
        { label: "Durum", value: "Aktif" }
      ]
    },
    {
      title: "Krediler",
      description: "Kredi ve borçlarınızı yönetin",
      icon: CreditCard,
      path: "/cashflow/loans",
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      stats: [
        { label: "Durum", value: "Aktif" }
      ]
    },
    {
      title: "Kategoriler",
      description: "Gelir ve gider kategorilerinizi düzenleyin",
      icon: ListTodo,
      path: "/cashflow/categories",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100",
      stats: [
        { label: "Gelir", value: `${incomeCategories} adet` },
        { label: "Gider", value: `${expenseCategories} adet` }
      ]
    }
  ];

  const selectedMonthName = selectedMonth === "all"
    ? "Tüm Aylar"
    : MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const dateLabel = `${selectedYear} - ${selectedMonthName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Nakit Akış Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Tüm nakit akışı işlemlerinizi tek yerden yönetin.
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

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card
              key={index}
              className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 bg-gradient-to-br ${module.bgColor}`}
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 bg-gradient-to-r ${module.color} rounded-xl shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="mt-4">{module.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {module.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{stat.label}:</span>
                      <span className="font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center justify-between">
              <span>Toplam Hesaplar</span>
              <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded">{dateLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{totalAccounts}</div>
            <div className="text-xs text-green-600 mt-1">Aktif hesap sayısı</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">
              <span>Toplam Bakiye</span>
              <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded">{dateLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{formatCurrency(totalBalance)}</div>
            <div className="text-xs text-blue-600 mt-1">Tüm hesaplardaki toplam</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center justify-between">
              <span>Kategoriler</span>
              <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded">{dateLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{incomeCategories + expenseCategories}</div>
            <div className="text-xs text-purple-600 mt-1">{incomeCategories} gelir, {expenseCategories} gider</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(Cashflow);