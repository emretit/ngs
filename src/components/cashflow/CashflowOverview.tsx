import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCashflowMain } from "@/hooks/useCashflowMain";
import FinancialOverview from "@/components/dashboard/FinancialOverview";

const CASHFLOW_STRUCTURE = [
  {
    key: 'opening_balance',
    label: 'Dönem Başı Bakiyesi',
    subcategories: ['Nakit ve Nakit Benzerleri'],
    type: 'balance'
  },
  {
    key: 'operating_inflows',
    label: 'Faaliyetlerden Gelen Nakit (Tahsilatlar)',
    subcategories: [
      'Ürün Satışları',
      'Hizmet Gelirleri',
      'Diğer Nakit Girişleri'
    ],
    type: 'inflow'
  },
  {
    key: 'operating_outflows',
    label: 'Faaliyetlerden Çıkan Nakit (Ödemeler)',
    subcategories: [
      'Operasyonel Giderler (OPEX)',
      'Personel Giderleri',
      'Kira Giderleri',
      'Elektrik/Su/Doğalgaz/İnternet',
      'Vergi ve Resmi Ödemeler',
      'Pazarlama Giderleri',
      'Diğer Nakit Çıkışları'
    ],
    type: 'outflow'
  },
  {
    key: 'investing_activities',
    label: 'Yatırım Faaliyetleri',
    subcategories: [
      'Demirbaş/Makine Alımları',
      'Yatırım Amaçlı Ödemeler',
      'Yatırımlardan Gelen Nakit'
    ],
    type: 'investing'
  },
  {
    key: 'financing_activities',
    label: 'Finansman Faaliyetleri',
    subcategories: [
      'Kredi Kullanımı',
      'Kredi Geri Ödemeleri',
      'Sermaye Artırımı',
      'Kar Payı Dağıtımı'
    ],
    type: 'financing'
  },
  {
    key: 'other_activities',
    label: 'Diğer Gelir ve Giderler',
    subcategories: [
      'Faiz Geliri',
      'Faiz Gideri',
      'Kur Farkı Kar/Zarar',
      'Olağandışı Gelir/Gider'
    ],
    type: 'other'
  },
  {
    key: 'closing_balance',
    label: 'Dönem Sonu Bakiyesi',
    subcategories: ['Nakit ve Nakit Benzerleri'],
    type: 'balance'
  }
];

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];


const CashflowOverview = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data, loading, refetch } = useCashflowMain();

  // Refetch data only when year changes and avoid unnecessary calls
  useEffect(() => {
    if (selectedYear) {
      refetch(selectedYear);
    }
  }, [selectedYear]); // Removed refetch from dependencies to prevent infinite loops

  const getValue = (category: string, subcategory: string, month: number) => {
    const item = data.find(d => 
      d.main_category === category && 
      d.subcategory === subcategory && 
      d.month === month && 
      d.year === selectedYear
    );
    return item?.value || 0;
  };

  const getTotalByCategory = (category: string) => {
    const categoryData = CASHFLOW_STRUCTURE.find(c => c.key === category);
    if (!categoryData) return 0;
    
    return categoryData.subcategories.reduce((sum, subcategory) => {
      return sum + Array.from({ length: 12 }, (_, i) => getValue(category, subcategory, i + 1))
        .reduce((monthSum, value) => monthSum + value, 0);
    }, 0);
  };

  const getTotalByMonth = (month: number) => {
    return CASHFLOW_STRUCTURE.reduce((sum, category) => {
      if (category.type === 'balance') return sum;
      
      return sum + category.subcategories.reduce((catSum, subcategory) => {
        const value = getValue(category.key, subcategory, month);
        return catSum + (category.type === 'outflow' ? -value : value);
      }, 0);
    }, 0);
  };

  const getNetCashFlow = () => {
    return Array.from({ length: 12 }, (_, i) => getTotalByMonth(i + 1))
      .reduce((sum, monthTotal) => sum + monthTotal, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-lg font-medium text-muted-foreground">
              Finansal veriler yükleniyor...
            </div>
            <div className="text-sm text-muted-foreground">
              Lütfen bekleyiniz
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-white border border-green-100 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-green-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Toplam Nakit Girişi
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(
                CASHFLOW_STRUCTURE.filter(c => c.type === 'inflow' || c.type === 'investing' || c.type === 'financing')
                  .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-green-100 rounded-full">
                <span className="text-xs font-medium text-green-700">Yıllık toplam</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-red-100 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Toplam Nakit Çıkışı
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(
                CASHFLOW_STRUCTURE.filter(c => c.type === 'outflow')
                  .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-red-100 rounded-full">
                <span className="text-xs font-medium text-red-700">Yıllık toplam</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`group relative overflow-hidden bg-white border ${getNetCashFlow() >= 0 ? 'border-green-100 hover:shadow-green-500/10' : 'border-red-100 hover:shadow-red-500/10'} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${getNetCashFlow() >= 0 ? 'from-green-50 to-emerald-50' : 'from-red-50 to-rose-50'}`}></div>
          <div className="absolute top-4 right-4">
            <div className={`p-2 ${getNetCashFlow() >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-lg shadow-lg`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Net Nakit Akışı
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-2xl lg:text-3xl font-bold ${getNetCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'} mb-2`}>
              {formatCurrency(getNetCashFlow())}
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 ${getNetCashFlow() >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full`}>
                <span className={`text-xs font-medium ${getNetCashFlow() >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {getNetCashFlow() >= 0 ? 'Pozitif akış' : 'Negatif akış'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Aylık Ortalama
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(getNetCashFlow() / 12)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">Ortalama aylık akış</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Financial Overview Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detaylı Finansal Analiz</h2>
            <p className="text-gray-600 text-sm">Kapsamlı finansal performans göstergeleri</p>
          </div>
        </div>
        <FinancialOverview />
      </div>
    </div>
  );
};

export default CashflowOverview;