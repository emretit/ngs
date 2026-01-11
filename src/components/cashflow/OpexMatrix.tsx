import React, { useState, useEffect, useCallback } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Download, Users, Calculator } from "lucide-react";
import { useOpexMatrix } from "@/hooks/useOpexMatrix";
import { useOpexCategories, OpexCategory } from "@/hooks/useOpexCategories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmployeeSalaryData {
  department: string;
  total_employer_cost: number;
  employee_count: number;
  gross_salary: number;
  net_salary: number;
  meal_allowance: number;
  transport_allowance: number;
  manual_employer_sgk_cost: number;
  unemployment_employer_amount: number;
  accident_insurance_amount: number;
}

// OPEX_CATEGORIES artık veritabanından gelecek

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const OpexMatrix = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [personnelData, setPersonnelData] = useState<EmployeeSalaryData[]>([]);
  const [matrixData, setMatrixData] = useState<Record<string, Record<number, number>>>({});
  const [loading, setLoading] = useState(false);
  const { data: opexData, loading: opexLoading } = useOpexMatrix();
  const { categories: opexCategories, loading: categoriesLoading } = useOpexCategories();

  // Fetch personnel data for auto-population
  const fetchPersonnelData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          department,
          total_employer_cost,
          effective_date,
          gross_salary,
          net_salary,
          meal_allowance,
          transport_allowance,
          manual_employer_sgk_cost,
          unemployment_employer_rate,
          accident_insurance_rate
        `)
        .eq('status', 'aktif')
        .order('department');

      if (error) throw error;

      // Group by department and calculate totals
      const departmentTotals = data?.reduce((acc, employee) => {
        const department = employee.department;
        
        // Calculate unemployment and accident insurance amounts from rates and gross salary
        const unemploymentAmount = (employee.gross_salary || 0) * ((employee.unemployment_employer_rate || 0) / 100);
        const accidentInsuranceAmount = (employee.gross_salary || 0) * ((employee.accident_insurance_rate || 0) / 100);

        if (!acc[department]) {
          acc[department] = { 
            total_cost: 0, 
            count: 0,
            gross_salary: 0,
            net_salary: 0,
            meal_allowance: 0,
            transport_allowance: 0,
            manual_employer_sgk_cost: 0,
            unemployment_employer_amount: 0,
            accident_insurance_amount: 0
          };
        }
        acc[department].total_cost += employee.total_employer_cost || 0;
        acc[department].count += 1;
        acc[department].gross_salary += employee.gross_salary || 0;
        acc[department].net_salary += employee.net_salary || 0;
        acc[department].meal_allowance += employee.meal_allowance || 0;
        acc[department].transport_allowance += employee.transport_allowance || 0;
        acc[department].manual_employer_sgk_cost += employee.manual_employer_sgk_cost || 0;
        acc[department].unemployment_employer_amount += unemploymentAmount;
        acc[department].accident_insurance_amount += accidentInsuranceAmount;

        return acc;
      }, {} as Record<string, { 
        total_cost: number; 
        count: number;
        gross_salary: number;
        net_salary: number;
        meal_allowance: number;
        transport_allowance: number;
        manual_employer_sgk_cost: number;
        unemployment_employer_amount: number;
        accident_insurance_amount: number;
      }>);

      type DeptTotals = { 
        total_cost: number; 
        count: number;
        gross_salary: number;
        net_salary: number;
        meal_allowance: number;
        transport_allowance: number;
        manual_employer_sgk_cost: number;
        unemployment_employer_amount: number;
        accident_insurance_amount: number;
      };
      
      const personnelDataArray = Object.entries(departmentTotals || {} as Record<string, DeptTotals>).map(([department, data]) => {
        const typedData = data as DeptTotals;
        return {
          department,
          total_employer_cost: typedData.total_cost,
          employee_count: typedData.count,
          gross_salary: typedData.gross_salary,
          net_salary: typedData.net_salary,
          meal_allowance: typedData.meal_allowance,
          transport_allowance: typedData.transport_allowance,
          manual_employer_sgk_cost: typedData.manual_employer_sgk_cost,
          unemployment_employer_amount: typedData.unemployment_employer_amount,
          accident_insurance_amount: typedData.accident_insurance_amount
        };
      });

      setPersonnelData(personnelDataArray);
    } catch (error) {
      logger.error('Error fetching personnel data:', error);
      toast.error("Personel verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch expense data from expenses table
  const fetchExpenseData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          cashflow_categories!category_id(name)
        `)
        .eq('type', 'expense')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (error) throw error;

      // Group expenses by category, subcategory, and month
      const expenseMatrix: Record<string, Record<number, number>> = {};
      
      data?.forEach((expense: any) => {
        const categoryName = expense.cashflow_categories?.name;
        const date = new Date(expense.date);
        const month = date.getMonth() + 1;
        const amount = expense.amount;
        
        // Use category name directly from cashflow_categories
        const opexCategory = categoryName || 'Genel Giderler';
        const opexSubcategory = expense.subcategory || expense.description || 'Diğer';
        
        const key = `${opexCategory}|${opexSubcategory}`;
        
        if (!expenseMatrix[key]) {
          expenseMatrix[key] = {};
        }
        
        if (!expenseMatrix[key][month]) {
          expenseMatrix[key][month] = 0;
        }
        
        expenseMatrix[key][month] += amount;
      });

      // Add expense data to matrix
      setMatrixData(prev => ({
        ...prev,
        ...expenseMatrix
      }));

    } catch (error) {
      logger.error('Error fetching expense data:', error);
    }
  }, [selectedYear]);

  // Transform opex data to matrix format
  useEffect(() => {
    const matrix: Record<string, Record<number, number>> = {};

    opexData.forEach(item => {
      const key = `${item.category}|${item.subcategory || ''}`;
      if (!matrix[key]) {
        matrix[key] = {};
      }
      matrix[key][item.month] = item.amount;
    });

    setMatrixData(matrix);
  }, [opexData]);

  // Fetch data on component mount and year change
  useEffect(() => {
    fetchPersonnelData();
    fetchExpenseData();
  }, [fetchPersonnelData, fetchExpenseData, selectedYear]);

  // Toggle category expansion - memoized with useCallback
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName);
      } else {
        newExpanded.add(categoryName);
      }
      return newExpanded;
    });
  }, []);

  // Toggle subcategory expansion - memoized with useCallback
  const toggleSubcategory = useCallback((categoryName: string, subcategory: string) => {
    const key = `${categoryName}|${subcategory}`;
    setExpandedSubcategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  }, []);


  // Get cell value
  const getCellValue = (category: string, subcategory: string | null, month: number): number => {
    const key = `${category}|${subcategory || ''}`;
    return matrixData[key]?.[month] || 0;
  };

  // Calculate row total
  const getRowTotal = (category: string, subcategory: string | null): number => {
    const key = `${category}|${subcategory || ''}`;
    const row = matrixData[key] || {};
    return Object.values(row).reduce((sum, value) => sum + value, 0);
  };

  // Calculate column total
  const getColumnTotal = (month: number): number => {
    return opexCategories.reduce((total, category) => {
      return total + getCategoryTotal(category.name, month);
    }, 0);
  };

  // Calculate grand total
  const getGrandTotal = (): number => {
    return MONTHS.reduce((total, _, monthIndex) => {
      return total + getColumnTotal(monthIndex + 1);
    }, 0);
  };

  // Get auto-populated value for personnel expenses
  const getAutoPopulatedValue = (subcategory: string, month: number): number => {
    switch (subcategory) {
      case "Net Maaşlar":
        return personnelData.reduce((sum, dept) => sum + dept.net_salary, 0);
      case "SGK İşveren Payı":
        return personnelData.reduce((sum, dept) => sum + dept.manual_employer_sgk_cost, 0);
      case "İşsizlik Sigortası":
        return personnelData.reduce((sum, dept) => sum + dept.unemployment_employer_amount, 0);
      case "İş Kazası Sigortası":
        return personnelData.reduce((sum, dept) => sum + dept.accident_insurance_amount, 0);
      case "Yemek Yardımı":
        return personnelData.reduce((sum, dept) => sum + dept.meal_allowance, 0);
      case "Ulaşım Yardımı":
        return personnelData.reduce((sum, dept) => sum + dept.transport_allowance, 0);
      default:
        return 0;
    }
  };

  // Calculate category total (sum of all subcategories in a category)
  const getCategoryTotal = (category: string, month: number): number => {
    const categoryData = opexCategories.find(c => c.name === category);
    if (!categoryData) return 0;

    return categoryData.subcategories.reduce((total, subcategory) => {
      const cellValue = getCellValue(category, subcategory.name, month);
      const autoValue = categoryData.isAutoPopulated ? getAutoPopulatedValue(subcategory.name, month) : 0;
      return total + cellValue + autoValue;
    }, 0);
  };

  // Calculate category row total (sum across all months)
  const getCategoryRowTotal = (category: string): number => {
    return MONTHS.reduce((total, _, monthIndex) => {
      return total + getCategoryTotal(category, monthIndex + 1);
    }, 0);
  };

  // Format currency - memoized with useCallback
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Export to Excel
  const exportToExcel = () => {
    const csvData = [
      ['Kategori', 'Alt Kategori', ...MONTHS, 'Toplam'],
      ...opexCategories.flatMap(category => 
        category.subcategories.map(subcategory => {
          const subcategoryName = typeof subcategory === 'string' ? subcategory : subcategory.name;
          const monthValues = MONTHS.map((_, index) => {
            const month = index + 1;
            const value = getCellValue(category.name, subcategoryName, month);
            const autoValue = category.isAutoPopulated ? getAutoPopulatedValue(subcategoryName, month) : 0;
            return value + autoValue;
          });
          const rowTotal = monthValues.reduce((sum, val) => sum + val, 0);
          
          return [
            category.name,
            subcategoryName,
            ...monthValues,
            rowTotal
          ];
        })
      ),
      ['TOPLAM', '', ...MONTHS.map((_, index) => getColumnTotal(index + 1)), getGrandTotal()]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `opex_matrix_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading || opexLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                OPEX Matrix
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Operasyonel giderlerinizi aylık bazda takip edin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32 h-9 bg-white border-slate-200 shadow-sm hover:border-slate-300 transition-colors text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToExcel} variant="outline" className="h-9 border-slate-200 hover:bg-slate-50 shadow-sm text-sm px-3">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel'e Aktar
            </Button>
          </div>
        </div>
      </div>
      <div className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100/50 z-20 w-[150px] font-semibold text-sm text-slate-900 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-2">
                    Kategori
                  </TableHead>
                  <TableHead className="sticky left-[150px] bg-gradient-to-r from-slate-50 to-slate-100/50 z-20 w-[130px] font-semibold text-sm text-slate-900 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-2">
                    Alt Kategori
                  </TableHead>
                  {MONTHS.map((month, index) => (
                    <TableHead 
                      key={index} 
                      className="text-center w-[90px] font-medium text-xs text-slate-700 py-2 px-1.5 border-r border-slate-200/50 last:border-r-0"
                    >
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-center w-[100px] font-semibold text-sm text-slate-900 bg-slate-100/50 py-2 px-2">
                    Toplam
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let rowIndex = 0;
                  return opexCategories.map((category) => {
                    const categoryRowIndex = rowIndex++;
                    const isCategoryEven = categoryRowIndex % 2 === 0;
                    
                    return (
                      <>
                        <TableRow 
                          key={category.name} 
                          className={cn(
                            "hover:from-slate-100 hover:to-slate-50 transition-all duration-200 border-b border-slate-200/60",
                            isCategoryEven 
                              ? "bg-gradient-to-r from-slate-50 to-slate-100/70" 
                              : "bg-white"
                          )}
                        >
                          <TableCell 
                            className="sticky left-0 z-10 font-medium text-sm cursor-pointer group transition-all duration-200 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-2 w-[150px]"
                            style={{ 
                              background: isCategoryEven 
                                ? 'linear-gradient(to right, rgb(248 250 252), rgb(241 245 249 / 0.7))'
                                : 'white'
                            }}
                            onClick={() => toggleCategory(category.name)}
                          >
                            <div className="flex items-center gap-2 group-hover:gap-2.5 transition-all">
                              <div className="text-slate-600 group-hover:text-blue-600 transition-colors">
                                {expandedCategories.has(category.name) ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <span className="text-slate-900 group-hover:text-blue-700 transition-colors">
                                {category.name}
                              </span>
                              {category.isAutoPopulated && (
                                <Badge variant="secondary" className="ml-1.5 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 text-xs px-1.5 py-0.5">
                                  <Users className="h-2.5 w-2.5 mr-0.5" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className="sticky left-[150px] z-10 font-medium text-sm text-slate-700 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-2 w-[130px]"
                            style={{ 
                              background: isCategoryEven 
                                ? 'linear-gradient(to right, rgb(248 250 252), rgb(241 245 249 / 0.7))'
                                : 'white'
                            }}
                          >
                            Kategori Toplamı
                          </TableCell>
                          {MONTHS.map((_, monthIndex) => {
                            const month = monthIndex + 1;
                            const total = getCategoryTotal(category.name, month);
                            return (
                              <TableCell 
                                key={monthIndex} 
                                className={cn(
                                  "text-center font-medium text-xs text-slate-800 py-1.5 px-1 border-r border-slate-200/50 last:border-r-0 w-[90px]",
                                  isCategoryEven ? "bg-slate-50/50" : "bg-white"
                                )}
                              >
                                <span className="inline-block px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60">
                                  {formatCurrency(total)}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className={cn(
                            "text-center font-semibold text-sm text-slate-900 py-2 px-2",
                            isCategoryEven ? "bg-slate-100/50" : "bg-slate-50/30"
                          )}>
                            <span className="inline-block px-2 py-1 rounded-md bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/60">
                              {formatCurrency(getCategoryRowTotal(category.name))}
                            </span>
                          </TableCell>
                        </TableRow>
                        {expandedCategories.has(category.name) && category.subcategories.map((subcategory, subIndex) => {
                          const subcategoryRowIndex = rowIndex++;
                          const isSubcategoryEven = subcategoryRowIndex % 2 === 0;
                          const hasDetails = expandedSubcategories.has(`${category.name}|${typeof subcategory === 'string' ? subcategory : subcategory.name}`);
                          
                          return (
                            <React.Fragment key={`${category.name}-${typeof subcategory === 'string' ? subcategory : subcategory.id}`}>
                              <TableRow 
                                className={cn(
                                  "animate-fade-in hover:bg-slate-50/80 transition-colors duration-150 border-b border-slate-100",
                                  isSubcategoryEven ? "bg-slate-50/60" : "bg-white"
                                )}
                              >
                                <TableCell 
                                  className={cn(
                                    "sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1.5 px-2 w-[150px]",
                                    isSubcategoryEven ? "bg-slate-50/60" : "bg-white"
                                  )}
                                >
                                  <div className="pl-4 text-slate-400 text-xs">└</div>
                                </TableCell>
                                <TableCell 
                                  className={cn(
                                    "sticky left-[150px] z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1.5 px-2 w-[130px]",
                                    isSubcategoryEven ? "bg-slate-50/60" : "bg-white"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleSubcategory(category.name, typeof subcategory === 'string' ? subcategory : subcategory.name)}
                                      className="p-0.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                                    >
                                      {hasDetails ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </button>
                                    <span className="text-slate-700 font-medium text-sm">
                                      {typeof subcategory === 'string' ? subcategory : subcategory.name}
                                    </span>
                                    {category.isAutoPopulated && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1 py-0">
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                {MONTHS.map((_, monthIndex) => {
                                  const month = monthIndex + 1;
                                  const value = getCellValue(category.name, typeof subcategory === 'string' ? subcategory : subcategory.name, month);
                                  const autoValue = category.isAutoPopulated ? getAutoPopulatedValue(typeof subcategory === 'string' ? subcategory : subcategory.name, month) : 0;
                                  
                                  return (
                                    <TableCell 
                                      key={monthIndex} 
                                      className={cn(
                                        "text-center py-1.5 px-1 border-r border-slate-200/50 last:border-r-0 w-[90px]",
                                        isSubcategoryEven ? "bg-slate-50/60" : "bg-white"
                                      )}
                                    >
                                      {category.isAutoPopulated ? (
                                        <div className="text-xs font-medium text-slate-600 px-1.5 py-1 rounded bg-blue-50/50 border border-blue-100/60 inline-block">
                                          {formatCurrency(autoValue)}
                                        </div>
                                      ) : (
                                        <div className="text-xs font-medium text-slate-700 px-1.5 py-1 rounded bg-white/80 border border-slate-200/60 inline-block">
                                          {formatCurrency(value)}
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className={cn(
                                  "text-center font-medium text-sm text-slate-800 py-1.5 px-2",
                                  isSubcategoryEven ? "bg-slate-50/60" : "bg-white"
                                )}>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60">
                                    {formatCurrency(getRowTotal(category.name, typeof subcategory === 'string' ? subcategory : subcategory.name))}
                                  </span>
                                </TableCell>
                              </TableRow>
                              
                              {/* Subcategory Details Row */}
                              {hasDetails && (() => {
                                const detailsRowIndex = rowIndex++;
                                const isDetailsEven = detailsRowIndex % 2 === 0;
                                
                                return (
                                  <TableRow className={cn(
                                    "animate-accordion-down border-b border-slate-100",
                                    isDetailsEven ? "bg-slate-50/40" : "bg-slate-100/30"
                                  )}>
                                    <TableCell 
                                      className={cn(
                                        "sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1 px-2 w-[150px]",
                                        isDetailsEven ? "bg-slate-50/40" : "bg-slate-100/30"
                                      )}
                                    ></TableCell>
                                    <TableCell 
                                      className={cn(
                                        "sticky left-[150px] z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1 px-2 w-[130px]",
                                        isDetailsEven ? "bg-slate-50/40" : "bg-slate-100/30"
                                      )}
                                    >
                                      <div className="text-[10px] text-slate-500 pl-4 font-medium">
                                        Detaylar
                                      </div>
                                    </TableCell>
                                    {MONTHS.map((_, monthIndex) => {
                                      const month = monthIndex + 1;
                                      const value = getCellValue(category.name, typeof subcategory === 'string' ? subcategory : subcategory.name, month);
                                      
                                      return (
                                        <TableCell 
                                          key={monthIndex} 
                                          className={cn(
                                            "text-center py-1 px-1 border-r border-slate-200/50 last:border-r-0 w-[90px]",
                                            isDetailsEven ? "bg-slate-50/40" : "bg-slate-100/30"
                                          )}
                                        >
                                          <div className="text-[10px] space-y-0.5">
                                            <div className="font-medium text-slate-700">
                                              {formatCurrency(value)}
                                            </div>
                                            <div className="text-slate-500 text-[9px]">
                                              {value > 0 ? `${month}/${selectedYear}` : 'Boş'}
                                            </div>
                                          </div>
                                        </TableCell>
                                      );
                                    })}
                                    <TableCell className={cn(
                                      "text-center py-1 px-2",
                                      isDetailsEven ? "bg-slate-50/40" : "bg-slate-100/30"
                                    )}>
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        Yıllık Toplam
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })()}
                            </React.Fragment>
                          );
                        })}
                      </>
                    );
                  });
                })()}
                
                 {/* Total Row - Always visible */}
                <TableRow className="bg-gradient-to-r from-blue-600 to-blue-700 font-bold border-t-2 border-blue-800 shadow-lg">
                  <TableCell className="sticky left-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 text-white border-r border-blue-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-2 px-2 text-sm w-[150px]">
                    TOPLAM
                  </TableCell>
                  <TableCell className="sticky left-[150px] bg-gradient-to-r from-blue-600 to-blue-700 z-10 text-white border-r border-blue-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-2 w-[130px]"></TableCell>
                  {MONTHS.map((_, monthIndex) => (
                    <TableCell key={monthIndex} className="text-center text-white py-2 px-1 border-r border-blue-500/50 last:border-r-0 w-[90px]">
                      <span className="inline-block px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-semibold">
                        {formatCurrency(getColumnTotal(monthIndex + 1))}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center text-white py-2 px-1.5 bg-blue-800/50 w-[100px]">
                    <span className="inline-block px-2 py-1 rounded-lg bg-white/25 backdrop-blur-sm border-2 border-white/40 font-extrabold text-xs">
                      {formatCurrency(getGrandTotal())}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {(loading || opexLoading) && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-sm text-slate-600 mt-3 font-medium">Yükleniyor...</p>
            </div>
          )}
      </div>
    </>
  );
};

export default OpexMatrix;