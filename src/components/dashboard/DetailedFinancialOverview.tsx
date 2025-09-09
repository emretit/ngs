import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Download, ArrowLeft, ArrowRight } from "lucide-react";

interface FinancialData {
  [key: string]: {
    [month: string]: number;
  };
}

interface EmployeeCosts {
  [month: string]: {
    grossSalary: number;
    totalCost: number;
    count: number;
  };
}

export const DetailedFinancialOverview = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<FinancialData>({});
  const [expenseData, setExpenseData] = useState<FinancialData>({});
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCosts>({});
  const { toast } = useToast();

  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  useEffect(() => {
    fetchFinancialData();
  }, [selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch monthly financials
      // Fetch monthly financials without user filtering
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_financials')
        .select('*')
        .eq('year', selectedYear);

      if (monthlyError) throw monthlyError;

      // Fetch employee salary data
      const { data: salaryData, error: salaryError } = await supabase
        .from('employee_salaries')
        .select(`
          *,
          employees!inner(
            first_name,
            last_name,
            status
          )
        `)
        .eq('employees.status', 'aktif')
        .gte('effective_date', `${selectedYear}-01-01`)
        .lt('effective_date', `${selectedYear + 1}-01-01`);

      if (salaryError) throw salaryError;

      // Process revenue data
      const revenues: FinancialData = {};
      const expenses: FinancialData = {};

      monthlyData?.forEach(item => {
        const monthName = months[item.month - 1];
        
        if (['Satış Gelirleri', 'Hizmet Gelirleri', 'Diğer Gelirler'].includes(item.category)) {
          if (!revenues[item.category]) revenues[item.category] = {};
          revenues[item.category][monthName] = (revenues[item.category][monthName] || 0) + item.amount;
        } else {
          if (!expenses[item.category]) expenses[item.category] = {};
          expenses[item.category][monthName] = (expenses[item.category][monthName] || 0) + item.amount;
        }
      });

      // Process employee costs by month
      const employeeMonthlyData: EmployeeCosts = {};
      salaryData?.forEach(salary => {
        const effectiveDate = new Date(salary.effective_date);
        const monthIndex = effectiveDate.getMonth();
        const monthName = months[monthIndex];
        
        if (!employeeMonthlyData[monthName]) {
          employeeMonthlyData[monthName] = { grossSalary: 0, totalCost: 0, count: 0 };
        }
        
        employeeMonthlyData[monthName].grossSalary += salary.gross_salary || 0;
        employeeMonthlyData[monthName].totalCost += salary.total_employer_cost || 0;
        employeeMonthlyData[monthName].count += 1;
      });

      setRevenueData(revenues);
      setExpenseData(expenses);
      setEmployeeCosts(employeeMonthlyData);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Finansal veriler yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRowTotal = (rowData: { [month: string]: number }) => {
    return Object.values(rowData).reduce((sum, value) => sum + value, 0);
  };

  const calculateColumnTotal = (monthName: string, data: FinancialData) => {
    return Object.values(data).reduce((sum, rowData) => sum + (rowData[monthName] || 0), 0);
  };

  const calculateGrandTotal = (data: FinancialData) => {
    return Object.values(data).reduce((sum, rowData) => 
      sum + Object.values(rowData).reduce((rowSum, value) => rowSum + value, 0), 0
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₺', '₺ ');
  };

  const exportToCSV = () => {
    const csvData = [];
    
    // Header
    csvData.push(['GELİR TABLOSU ŞABLONU - VERİ TABANI', '', '', '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['', ...months, 'TOPLAM']);
    
    // Revenue section
    csvData.push(['GELİR DETAYLARI', '', '', '', '', '', '', '', '', '', '', '', '']);
    Object.entries(revenueData).forEach(([category, monthData]) => {
      const row = [category];
      months.forEach(month => {
        row.push((monthData[month] || 0).toString());
      });
      row.push(calculateRowTotal(monthData).toString());
      csvData.push(row);
    });
    
    // Revenue total
    const revenueTotal = ['TOPLAM GELİR'];
    months.forEach(month => {
      revenueTotal.push(calculateColumnTotal(month, revenueData).toString());
    });
    revenueTotal.push(calculateGrandTotal(revenueData).toString());
    csvData.push(revenueTotal);
    
    csvData.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Expense section
    csvData.push(['GİDER DETAYLARI', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Employee costs first
    const employeeRow = ['Personel Giderleri'];
    months.forEach(month => {
      employeeRow.push((employeeCosts[month]?.totalCost || 0).toString());
    });
    employeeRow.push(Object.values(employeeCosts).reduce((sum, data) => sum + data.totalCost, 0).toString());
    csvData.push(employeeRow);
    
    // Other expenses
    Object.entries(expenseData).forEach(([category, monthData]) => {
      const row = [category];
      months.forEach(month => {
        row.push((monthData[month] || 0).toString());
      });
      row.push(calculateRowTotal(monthData).toString());
      csvData.push(row);
    });
    
    // Export CSV
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gelir-tablosu-${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">GELİR TABLOSU ŞABLONU - VERİ TABANI</h1>
        <div className="flex gap-4 items-center">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="border border-gray-300 p-3 text-left min-w-[200px]">Kategori</th>
                  {months.map(month => (
                    <th key={month} className="border border-gray-300 p-3 text-center min-w-[100px]">{month}</th>
                  ))}
                  <th className="border border-gray-300 p-3 text-center min-w-[120px]">TOPLAM</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue Section */}
                <tr className="bg-green-50">
                  <td colSpan={14} className="border border-gray-300 p-3 font-bold text-green-800 text-center">
                    GELİR DETAYLARI
                  </td>
                </tr>
                {Object.entries(revenueData).map(([category, monthData]) => (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">{category}</td>
                    {months.map(month => (
                      <td key={month} className="border border-gray-300 p-3 text-right">
                        {formatCurrency(monthData[month] || 0)}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-3 text-right font-bold bg-green-100">
                      {formatCurrency(calculateRowTotal(monthData))}
                    </td>
                  </tr>
                ))
                }
                <tr className="bg-green-200 font-bold">
                  <td className="border border-gray-300 p-3">TOPLAM GELİR (BRÜT)</td>
                  {months.map(month => (
                    <td key={month} className="border border-gray-300 p-3 text-right">
                      {formatCurrency(calculateColumnTotal(month, revenueData))}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-3 text-right text-lg">
                    {formatCurrency(calculateGrandTotal(revenueData))}
                  </td>
                </tr>

                {/* Spacer */}
                <tr>
                  <td colSpan={14} className="p-2"></td>
                </tr>

                {/* Expense Section */}
                <tr className="bg-red-50">
                  <td colSpan={14} className="border border-gray-300 p-3 font-bold text-red-800 text-center">
                    GİDER DETAYLARI
                  </td>
                </tr>
                
                {/* Employee Costs */}
                <tr className="hover:bg-gray-50 bg-yellow-50">
                  <td className="border border-gray-300 p-3 font-medium">Personel Giderleri</td>
                  {months.map(month => (
                    <td key={month} className="border border-gray-300 p-3 text-right">
                      {formatCurrency(employeeCosts[month]?.totalCost || 0)}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-3 text-right font-bold bg-yellow-100">
                    {formatCurrency(Object.values(employeeCosts).reduce((sum, data) => sum + data.totalCost, 0))}
                  </td>
                </tr>

                {/* Other Expenses */}
                {Object.entries(expenseData).map(([category, monthData]) => (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">{category}</td>
                    {months.map(month => (
                      <td key={month} className="border border-gray-300 p-3 text-right">
                        {formatCurrency(monthData[month] || 0)}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-3 text-right font-bold bg-red-100">
                      {formatCurrency(calculateRowTotal(monthData))}
                    </td>
                  </tr>
                ))}

                {/* Total Expenses */}
                <tr className="bg-red-200 font-bold">
                  <td className="border border-gray-300 p-3">TOPLAM GİDER</td>
                  {months.map(month => {
                    const totalExpense = calculateColumnTotal(month, expenseData) + (employeeCosts[month]?.totalCost || 0);
                    return (
                      <td key={month} className="border border-gray-300 p-3 text-right">
                        {formatCurrency(totalExpense)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-3 text-right text-lg">
                    {formatCurrency(
                      calculateGrandTotal(expenseData) + 
                      Object.values(employeeCosts).reduce((sum, data) => sum + data.totalCost, 0)
                    )}
                  </td>
                </tr>

                {/* Net Profit */}
                <tr className="bg-blue-200 font-bold text-lg">
                  <td className="border border-gray-300 p-4">NET GELİR</td>
                  {months.map(month => {
                    const revenue = calculateColumnTotal(month, revenueData);
                    const expense = calculateColumnTotal(month, expenseData) + (employeeCosts[month]?.totalCost || 0);
                    const netProfit = revenue - expense;
                    return (
                      <td key={month} className={`border border-gray-300 p-4 text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-4 text-right text-xl">
                    {(() => {
                      const totalRevenue = calculateGrandTotal(revenueData);
                      const totalExpense = calculateGrandTotal(expenseData) + 
                        Object.values(employeeCosts).reduce((sum, data) => sum + data.totalCost, 0);
                      const netProfit = totalRevenue - totalExpense;
                      return (
                        <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(netProfit)}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Personel Giderleri Özeti ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Toplam Brüt Maaş</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(Object.values(employeeCosts).reduce((sum, data) => sum + data.grossSalary, 0))}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Toplam İşveren Maliyeti</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(Object.values(employeeCosts).reduce((sum, data) => sum + data.totalCost, 0))}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Ortalama Çalışan Sayısı</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(Object.values(employeeCosts).reduce((sum, data) => sum + data.count, 0) / Math.max(Object.keys(employeeCosts).length, 1))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
