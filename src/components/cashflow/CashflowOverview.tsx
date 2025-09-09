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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/40">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Finansal Genel Bakış
              </h1>
              <p className="text-muted-foreground text-sm">
                Nakit akışı ve finansal performans analizi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Dönem:
              </div>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32 bg-background/50 backdrop-blur-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10"></div>
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Nakit Girişi
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(
                    CASHFLOW_STRUCTURE.filter(c => c.type === 'inflow' || c.type === 'investing' || c.type === 'financing')
                      .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Yıllık toplam
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-destructive/10"></div>
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Nakit Çıkışı
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(
                    CASHFLOW_STRUCTURE.filter(c => c.type === 'outflow')
                      .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Yıllık toplam
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <div className={`absolute inset-0 bg-gradient-to-br ${getNetCashFlow() >= 0 ? 'from-success/5 to-success/10' : 'from-destructive/5 to-destructive/10'}`}></div>
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Nakit Akışı
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className={`text-2xl font-bold ${getNetCashFlow() >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(getNetCashFlow())}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getNetCashFlow() >= 0 ? 'Pozitif akış' : 'Negatif akış'}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aylık Ortalama
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(getNetCashFlow() / 12)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ortalama aylık akış
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview Section */}
          <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 p-6">
            <FinancialOverview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashflowOverview;