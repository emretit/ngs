import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, FileText, Calculator } from "lucide-react";
import { useCashflowMain } from "@/hooks/useCashflowMain";
import { supabase } from "@/integrations/supabase/client";

// Comprehensive cashflow structure with Turkish labels
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const CashflowMainTable = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{ category: string; subcategory: string; month: number } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const { data, loading, upsertCashflowMain, refetch } = useCashflowMain();

  // Removed auth check - no authentication required
  useEffect(() => {
    setIsAuthenticated(true); // Always authenticated
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetch(selectedYear);
    }
  }, [selectedYear, refetch, isAuthenticated]);

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
      if (category.type === 'balance') return sum; // Skip balance items in totals
      
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

  const handleCellEdit = async (category: string, subcategory: string, month: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    try {
      await upsertCashflowMain(selectedYear, month, category, subcategory, numValue);
      setEditingCell(null);
      setTempValue('');
    } catch (error) {
      logger.error('Error updating cashflow value:', error);
    }
  };

  const handleCellClick = (category: string, subcategory: string, month: number) => {
    setEditingCell({ category, subcategory, month });
    setTempValue(getValue(category, subcategory, month).toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent, category: string, subcategory: string, month: number) => {
    if (e.key === 'Enter') {
      handleCellEdit(category, subcategory, month, tempValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthlyChartData = () => {
    return MONTHS.map((month, index) => ({
      month: month.substring(0, 3),
      nakit_girisi: CASHFLOW_STRUCTURE.filter(c => c.type === 'inflow' || c.type === 'investing' || c.type === 'financing')
        .reduce((sum, category) => sum + category.subcategories.reduce((catSum, subcategory) => 
          catSum + getValue(category.key, subcategory, index + 1), 0), 0),
      nakit_cikisi: CASHFLOW_STRUCTURE.filter(c => c.type === 'outflow')
        .reduce((sum, category) => sum + category.subcategories.reduce((catSum, subcategory) => 
          catSum + getValue(category.key, subcategory, index + 1), 0), 0),
      net_akis: getTotalByMonth(index + 1),
    }));
  };

  const getCategoryChartData = () => {
    return CASHFLOW_STRUCTURE.filter(c => c.type !== 'balance').map(category => ({
      category: category.label,
      amount: Math.abs(getTotalByCategory(category.key)),
      type: category.type,
    }));
  };

  const exportToExcel = () => {
    const headers = ['Ana Kategori', 'Alt Kategori', ...MONTHS, 'Toplam'];
    const rows = [];

    CASHFLOW_STRUCTURE.forEach(category => {
      category.subcategories.forEach(subcategory => {
        const monthlyValues = MONTHS.map((_, index) => getValue(category.key, subcategory, index + 1));
        const total = monthlyValues.reduce((sum, val) => sum + val, 0);
        
        rows.push([
          category.label,
          subcategory,
          ...monthlyValues,
          total
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nakit_akis_tablosu_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Kimlik doğrulaması kontrol ediliyor...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="p-6">
          <CardContent className="text-center">
            <h3 className="text-lg font-semibold mb-2">Kimlik Doğrulaması Gerekli</h3>
            <p className="text-gray-600">Nakit akış verilerini görüntülemek için giriş yapmanız gerekiyor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Nakit akış verileri yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Nakit Akış Tablosu</h1>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Nakit Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                CASHFLOW_STRUCTURE.filter(c => c.type === 'inflow' || c.type === 'investing' || c.type === 'financing')
                  .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Nakit Çıkışı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                CASHFLOW_STRUCTURE.filter(c => c.type === 'outflow')
                  .reduce((sum, cat) => sum + getTotalByCategory(cat.key), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Nakit Akışı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNetCashFlow() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getNetCashFlow())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aylık Ortalama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getNetCashFlow() / 12)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aylık Nakit Akış Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMonthlyChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="nakit_girisi" stroke="#10B981" strokeWidth={2} name="Nakit Girişi" />
                <Line type="monotone" dataKey="nakit_cikisi" stroke="#EF4444" strokeWidth={2} name="Nakit Çıkışı" />
                <Line type="monotone" dataKey="net_akis" stroke="#3B82F6" strokeWidth={2} name="Net Akış" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategorilere Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {getCategoryChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nakit Akış Tablosu - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Ana Kategori</TableHead>
                  <TableHead className="w-48">Alt Kategori</TableHead>
                  {MONTHS.map((month, index) => (
                    <TableHead key={index} className="text-center min-w-28">
                      {month.substring(0, 3)}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CASHFLOW_STRUCTURE.map(category => (
                  category.subcategories.map((subcategory, subIndex) => (
                    <TableRow key={`${category.key}-${subIndex}`} className={category.type === 'balance' ? 'bg-blue-50' : ''}>
                      {subIndex === 0 && (
                        <TableCell 
                          rowSpan={category.subcategories.length} 
                          className={`font-medium ${
                            category.type === 'balance' ? 'bg-blue-100' : 
                            category.type === 'inflow' ? 'bg-green-50' : 
                            category.type === 'outflow' ? 'bg-red-50' : 'bg-gray-50'
                          }`}
                        >
                          {category.label}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{subcategory}</TableCell>
                      {MONTHS.map((_, monthIndex) => {
                        const month = monthIndex + 1;
                        const value = getValue(category.key, subcategory, month);
                        const isEditing = editingCell?.category === category.key && 
                                         editingCell?.subcategory === subcategory && 
                                         editingCell?.month === month;
                        
                        return (
                          <TableCell key={monthIndex} className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={(e) => handleKeyPress(e, category.key, subcategory, month)}
                                onBlur={() => handleCellEdit(category.key, subcategory, month, tempValue)}
                                className="w-24 text-center"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => handleCellClick(category.key, subcategory, month)}
                              >
                                {value > 0 ? formatCurrency(value) : ''}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-gray-50">
                        {formatCurrency(
                          Array.from({ length: 12 }, (_, i) => getValue(category.key, subcategory, i + 1))
                            .reduce((sum, val) => sum + val, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ))}
                {/* Monthly Totals Row */}
                <TableRow className="border-t-2 border-gray-300 bg-gray-50">
                  <TableCell colSpan={2} className="font-bold text-center">AYLIK TOPLAM</TableCell>
                  {MONTHS.map((_, monthIndex) => (
                    <TableCell key={monthIndex} className="text-center font-bold">
                      {formatCurrency(getTotalByMonth(monthIndex + 1))}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-lg">
                    {formatCurrency(getNetCashFlow())}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};