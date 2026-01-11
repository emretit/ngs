import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { useMonthlyFinancials } from "@/hooks/useMonthlyFinancials";

const FINANCIAL_CATEGORIES = [
  { key: 'revenue', label: 'Gelirler', subcategories: ['Ürün Satışları', 'Hizmet Gelirleri', 'Diğer Gelirler'] },
  { key: 'cogs', label: 'Satışların Maliyeti', subcategories: ['Direkt Malzemeler', 'Direkt İşçilik', 'Üretim Masrafları'] },
  { key: 'gross_profit', label: 'Brüt Kar', subcategories: [] },
  { key: 'opex', label: 'Faaliyet Masrafları', subcategories: ['Maaşlar', 'Kira', 'Utilities', 'Pazarlama', 'Yönetim'] },
  { key: 'ebitda', label: 'FAVÖK', subcategories: [] },
  { key: 'depreciation', label: 'Amortisman', subcategories: [] },
  { key: 'ebit', label: 'Faiz ve Vergi Öncesi Kar', subcategories: [] },
  { key: 'interest', label: 'Faiz', subcategories: ['Faiz Gelirleri', 'Faiz Masrafları'] },
  { key: 'tax', label: 'Vergi', subcategories: [] },
  { key: 'net_profit', label: 'Net Kar', subcategories: [] },
  { key: 'cash_flow', label: 'Nakit Akışı', subcategories: ['Faaliyet NA', 'Yatırım NA', 'Finansman NA'] },
];

const MONTHS = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
];

const MonthlyFinancialOverview = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{ category: string; subcategory: string; month: number } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [selectedMonthForPie, setSelectedMonthForPie] = useState(new Date().getMonth() + 1);
  
  const { financials, loading, upsertFinancial, refetch } = useMonthlyFinancials();

  useEffect(() => {
    console.log('Fetching financials for year:', selectedYear);
    refetch(selectedYear);
  }, [selectedYear, refetch]);

  const getFinancialValue = (category: string, subcategory: string, month: number) => {
    const financial = financials.find(f => 
      f.category === category && 
      f.subcategory === subcategory && 
      f.month === month && 
      f.year === selectedYear
    );
    return financial?.amount || 0;
  };

  const handleCellEdit = (category: string, subcategory: string, month: number, currentValue: number) => {
    setEditingCell({ category, subcategory, month });
    setTempValue(currentValue.toString());
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const value = parseFloat(tempValue) || 0;
    
    try {
      await upsertFinancial({
        year: selectedYear,
        month: editingCell.month,
        category: editingCell.category,
        subcategory: editingCell.subcategory,
        amount: value,
      });
      
      setEditingCell(null);
      setTempValue('');
    } catch (error) {
      console.error('Error saving financial data:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  // Auto-calculation functions for derived financial metrics
  const calculateGrossProfit = (month: number) => {
    const revenue = getFinancialValue('revenue', '', month) + 
      FINANCIAL_CATEGORIES.find(c => c.key === 'revenue')?.subcategories.reduce((sum, sub) => 
        sum + getFinancialValue('revenue', sub, month), 0) || 0;
    const cogs = getFinancialValue('cogs', '', month) + 
      FINANCIAL_CATEGORIES.find(c => c.key === 'cogs')?.subcategories.reduce((sum, sub) => 
        sum + getFinancialValue('cogs', sub, month), 0) || 0;
    return revenue - cogs;
  };

  const calculateEBITDA = (month: number) => {
    const grossProfit = calculateGrossProfit(month);
    const opex = getFinancialValue('opex', '', month) + 
      FINANCIAL_CATEGORIES.find(c => c.key === 'opex')?.subcategories.reduce((sum, sub) => 
        sum + getFinancialValue('opex', sub, month), 0) || 0;
    return grossProfit - opex;
  };

  const calculateEBIT = (month: number) => {
    const ebitda = calculateEBITDA(month);
    const depreciation = getFinancialValue('depreciation', '', month);
    return ebitda - depreciation;
  };

  const calculateNetProfit = (month: number) => {
    const ebit = calculateEBIT(month);
    const interestIncome = getFinancialValue('interest', 'Faiz Gelirleri', month);
    const interestExpense = getFinancialValue('interest', 'Faiz Masrafları', month);
    const tax = getFinancialValue('tax', '', month);
    return ebit + interestIncome - interestExpense - tax;
  };

  const getCalculatedValue = (category: string, subcategory: string, month: number) => {
    if (category === 'gross_profit') return calculateGrossProfit(month);
    if (category === 'ebitda') return calculateEBITDA(month);
    if (category === 'ebit') return calculateEBIT(month);
    if (category === 'net_profit') return calculateNetProfit(month);
    return getFinancialValue(category, subcategory, month);
  };

  const isCalculatedField = (category: string) => {
    return ['gross_profit', 'ebitda', 'ebit', 'net_profit'].includes(category);
  };

  const calculateMonthlyTotal = (month: number) => {
    let total = 0;
    FINANCIAL_CATEGORIES.forEach(category => {
      if (category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          total += getCalculatedValue(category.key, subcategory, month);
        });
      } else {
        total += getCalculatedValue(category.key, '', month);
      }
    });
    return total;
  };

  const calculateMonthlySummary = (month: number) => {
    const revenue = FINANCIAL_CATEGORIES.find(c => c.key === 'revenue')?.subcategories.reduce((sum, sub) => 
      sum + getFinancialValue('revenue', sub, month), 0) || 0;
    const expenses = (FINANCIAL_CATEGORIES.find(c => c.key === 'cogs')?.subcategories.reduce((sum, sub) => 
      sum + getFinancialValue('cogs', sub, month), 0) || 0) +
      (FINANCIAL_CATEGORIES.find(c => c.key === 'opex')?.subcategories.reduce((sum, sub) => 
        sum + getFinancialValue('opex', sub, month), 0) || 0);
    const netResult = calculateNetProfit(month);
    
    return { revenue, expenses, netResult };
  };

  const calculateCategoryTotal = (category: string) => {
    let total = 0;
    if (isCalculatedField(category)) {
      for (let month = 1; month <= 12; month++) {
        total += getCalculatedValue(category, '', month);
      }
    } else {
      total = financials
        .filter(f => f.category === category && f.year === selectedYear)
        .reduce((sum, f) => sum + f.amount, 0);
    }
    return total;
  };

  const getChartData = () => {
    return MONTHS.map(month => {
      const summary = calculateMonthlySummary(month.value);
      
      return {
        month: month.label.substring(0, 3),
        revenue: summary.revenue,
        expenses: summary.expenses,
        profit: summary.netResult,
      };
    });
  };

  const getExpenseBreakdownData = (selectedMonth: number) => {
    const opexCategories = FINANCIAL_CATEGORIES.find(c => c.key === 'opex')?.subcategories || [];
    const cogsCategories = FINANCIAL_CATEGORIES.find(c => c.key === 'cogs')?.subcategories || [];
    
    const data = [
      ...opexCategories.map(sub => ({
        name: sub,
        value: getFinancialValue('opex', sub, selectedMonth),
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`
      })),
      ...cogsCategories.map(sub => ({
        name: sub,
        value: getFinancialValue('cogs', sub, selectedMonth),
        fill: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
    ].filter(item => item.value > 0);
    
    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Kategori', 'Alt Kategori', ...MONTHS.map(m => m.label), 'Toplam'];
    const rows = [];
    
    FINANCIAL_CATEGORIES.forEach(category => {
      if (category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          const row = [
            category.label,
            subcategory,
            ...MONTHS.map(month => getFinancialValue(category.key, subcategory, month.value)),
            calculateCategoryTotal(category.key)
          ];
          rows.push(row);
        });
      } else {
        const row = [
          category.label,
          '',
          ...MONTHS.map(month => getFinancialValue(category.key, '', month.value)),
          calculateCategoryTotal(category.key)
        ];
        rows.push(row);
      }
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `aylik_finansal_durum_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Finansal veriler yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Aylık Finansal Durum</h2>
          <p className="text-gray-600">Finansal performansınızı ay ay takip edin</p>
        </div>
        <div className="flex items-center space-x-4">
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
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {/* Financial Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Finansal Veriler - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Kategori</TableHead>
                  <TableHead className="w-32">Alt Kategori</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month.value} className="text-center min-w-24">
                      {month.label.substring(0, 3)}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FINANCIAL_CATEGORIES.map(category => (
                  category.subcategories.length > 0 ? (
                    category.subcategories.map((subcategory, index) => (
                      <TableRow key={`${category.key}-${subcategory}`}>
                        {index === 0 && (
                          <TableCell rowSpan={category.subcategories.length} className="font-medium">
                            {category.label}
                          </TableCell>
                        )}
                        <TableCell className="text-sm">{subcategory}</TableCell>
                        {MONTHS.map(month => {
                          const value = isCalculatedField(category.key) ? 
                            getCalculatedValue(category.key, subcategory, month.value) :
                            getFinancialValue(category.key, subcategory, month.value);
                          const isEditing = editingCell?.category === category.key && 
                                           editingCell?.subcategory === subcategory && 
                                           editingCell?.month === month.value;
                          
                          return (
                            <TableCell key={month.value} className="text-center">
                              {isEditing ? (
                                <div className="flex items-center space-x-1">
                                  <Input
                                    type="number"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="h-8 w-20 text-center"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave();
                                      if (e.key === 'Escape') handleCellCancel();
                                    }}
                                    autoFocus
                                  />
                                  <Button size="sm" onClick={handleCellSave}>✓</Button>
                                  <Button size="sm" variant="ghost" onClick={handleCellCancel}>✗</Button>
                                </div>
                              ) : (
                                <button
                                  className={`hover:bg-gray-100 p-1 rounded w-full ${isCalculatedField(category.key) ? 'bg-gray-50 cursor-default' : ''}`}
                                  onClick={() => !isCalculatedField(category.key) && handleCellEdit(category.key, subcategory, month.value, value)}
                                >
                                  {formatCurrency(value)}
                                </button>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-medium">
                          {formatCurrency(calculateCategoryTotal(category.key))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key={category.key}>
                      <TableCell className="font-medium">{category.label}</TableCell>
                      <TableCell>-</TableCell>
                      {MONTHS.map(month => {
                        const value = isCalculatedField(category.key) ? 
                          getCalculatedValue(category.key, '', month.value) :
                          getFinancialValue(category.key, '', month.value);
                        const isEditing = editingCell?.category === category.key && 
                                         editingCell?.subcategory === '' && 
                                         editingCell?.month === month.value;
                        
                        return (
                          <TableCell key={month.value} className="text-center">
                            {isEditing ? (
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  className="h-8 w-20 text-center"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave();
                                    if (e.key === 'Escape') handleCellCancel();
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleCellSave}>✓</Button>
                                <Button size="sm" variant="ghost" onClick={handleCellCancel}>✗</Button>
                              </div>
                            ) : (
                              <button
                                className={`hover:bg-gray-100 p-1 rounded w-full ${isCalculatedField(category.key) ? 'bg-gray-50 cursor-default' : ''}`}
                                onClick={() => !isCalculatedField(category.key) && handleCellEdit(category.key, '', month.value, value)}
                              >
                                {formatCurrency(value)}
                              </button>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-medium">
                        {formatCurrency(calculateCategoryTotal(category.key))}
                      </TableCell>
                    </TableRow>
                  )
                ))}
                {/* Summary Row */}
                <TableRow className="border-t-2 bg-gray-50 font-semibold">
                  <TableCell className="font-bold">ÖZET</TableCell>
                  <TableCell>-</TableCell>
                  {MONTHS.map(month => {
                    const summary = calculateMonthlySummary(month.value);
                    const netResult = summary.netResult;
                    
                    return (
                      <TableCell key={month.value} className={`text-center ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netResult)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold">
                    {formatCurrency(MONTHS.reduce((sum, month) => sum + calculateMonthlySummary(month.value).netResult, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aylık Gelir vs Masraflar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Gelir" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Masraf" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık Kar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Bar dataKey="profit" fill="#3b82f6" name="Kar" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Masraf Dağılımı</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Select value={selectedMonthForPie.toString()} onValueChange={(value) => setSelectedMonthForPie(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getExpenseBreakdownData(selectedMonthForPie)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getExpenseBreakdownData(selectedMonthForPie).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyFinancialOverview;