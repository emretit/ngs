import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  Edit,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Minus,
  Building,
  Receipt,
  Activity,
  Target,
  Award,
  CreditCard,
  CalendarDays,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  HandCoins
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface FinancialTransaction {
  id: string;
  date: string;
  type: 'tahakkuk' | 'odeme' | 'bonus' | 'kesinti' | 'yardim' | 'avans' | 'prim' | 'ikramiye';
  description: string;
  amount: number;
  status: 'beklemende' | 'tamamlandi' | 'iptal';
  category?: string;
  notes?: string;
  balance_after?: number;
  payment_method?: string;
  reference_id?: string;
}

interface EmployeeFinancialStatementProps {
  employeeId: string;
  onEdit?: (salaryData: any) => void;
  refreshTrigger?: number;
}

export const EmployeeFinancialStatement = ({ employeeId, onEdit, refreshTrigger }: EmployeeFinancialStatementProps) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [currentSalary, setCurrentSalary] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last_6_months");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [showBalances, setShowBalances] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Stats calculated from transactions
  const stats = useMemo(() => {
    const totalEarned = transactions
      .filter(t => ['tahakkuk', 'bonus', 'prim', 'ikramiye'].includes(t.type) && t.status === 'tamamlandi')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPaid = transactions
      .filter(t => t.type === 'odeme' && t.status === 'tamamlandi')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingPayments = transactions
      .filter(t => ['tahakkuk', 'bonus'].includes(t.type) && t.status === 'beklemende')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalDeductions = transactions
      .filter(t => ['kesinti', 'avans'].includes(t.type) && t.status === 'tamamlandi')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const lastPayment = transactions
      .find(t => t.type === 'odeme' && t.status === 'tamamlandi');

    const currentBalance = pendingPayments - totalDeductions;

    return {
      totalEarned,
      totalPaid,
      pendingPayments,
      totalDeductions,
      lastPayment: lastPayment?.date || null,
      currentBalance,
      netBalance: totalEarned - totalPaid - totalDeductions
    };
  }, [transactions]);

  // Filtered transactions based on search and filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by type
      if (filterType === "income" && !['tahakkuk', 'bonus', 'prim', 'ikramiye', 'yardim'].includes(transaction.type)) {
        return false;
      }
      if (filterType === "expense" && !['kesinti', 'avans'].includes(transaction.type)) {
        return false;
      }
      if (filterType === "expense" && transaction.type === 'odeme') {
        return false; // Ödemeler expense'a dahil değil
      }

      // Filter by search term
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [transactions, filterType, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [employeeId, refreshTrigger, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCurrentSalary(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSalary = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSalary(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Maaş bilgileri yüklenirken hata oluştu",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (selectedPeriod) {
        case "last_month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "last_3_months":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "last_6_months":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "last_year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }

      // Fetch all related transactions
      const [payrollData, paymentData, bonusData] = await Promise.all([
        // Payroll records (tahakkuk)
        supabase
          .from('payroll_records')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('payroll_date', startDate.toISOString().split('T')[0])
          .lte('payroll_date', endDate.toISOString().split('T')[0])
          .order('payroll_date', { ascending: false }),

        // Payment transactions (ödeme)
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('payment_date', startDate.toISOString().split('T')[0])
          .lte('payment_date', endDate.toISOString().split('T')[0])
          .order('payment_date', { ascending: false }),

        // Employee expenses/bonuses
        supabase
          .from('employee_expenses')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('expense_date', startDate.toISOString().split('T')[0])
          .lte('expense_date', endDate.toISOString().split('T')[0])
          .order('expense_date', { ascending: false })
      ]);

      if (payrollData.error) throw payrollData.error;
      if (paymentData.error) throw paymentData.error;
      if (bonusData.error && bonusData.error.code !== 'PGRST116') console.warn('Employee expenses table not found');

      const formattedTransactions: FinancialTransaction[] = [];

      // Add payroll records (tahakkuk)
      payrollData.data?.forEach(record => {
        formattedTransactions.push({
          id: `payroll_${record.id}`,
          date: record.payroll_date,
          type: 'tahakkuk',
          description: `${new Date(record.payroll_date).toLocaleDateString('tr-TR')} Maaş Tahakkuku`,
          amount: record.total_cost || record.net_salary || 0,
          status: record.status === 'tahakkuk_edildi' ? 'tamamlandi' : 'beklemende',
          category: 'maas',
          notes: record.notes,
          reference_id: record.id
        });
      });

      // Add payment transactions (ödeme)
      paymentData.data?.forEach(payment => {
        formattedTransactions.push({
          id: `payment_${payment.id}`,
          date: payment.payment_date,
          type: 'odeme',
          description: payment.description || 'Maaş Ödemesi',
          amount: -Math.abs(payment.amount), // Negative for outgoing payments
          status: payment.status === 'tamamlandi' ? 'tamamlandi' : 'beklemende',
          category: 'odeme',
          notes: payment.notes,
          payment_method: payment.payment_method,
          reference_id: payment.id
        });
      });

      // Add employee expenses/bonuses if table exists
      if (bonusData.data) {
        bonusData.data.forEach(expense => {
          const type = expense.expense_type || 'yardim';
          formattedTransactions.push({
            id: `expense_${expense.id}`,
            date: expense.expense_date,
            type: expense.amount > 0 ? (type as any) : 'kesinti',
            description: expense.description || 'Personel Gideri',
            amount: expense.amount,
            status: expense.status || 'tamamlandi',
            category: expense.category || 'diger',
            notes: expense.notes,
            reference_id: expense.id
          });
        });
      }

      // Sort by date (newest first)
      formattedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      formattedTransactions.reverse().forEach(transaction => {
        runningBalance += transaction.amount;
        transaction.balance_after = runningBalance;
      });
      formattedTransactions.reverse();

      setTransactions(formattedTransactions);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlem geçmişi yüklenirken hata oluştu",
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tahakkuk':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'odeme':
        return <ArrowDownRight className="h-4 w-4 text-blue-600" />;
      case 'bonus':
      case 'prim':
      case 'ikramiye':
        return <Award className="h-4 w-4 text-yellow-600" />;
      case 'kesinti':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'yardim':
        return <Plus className="h-4 w-4 text-purple-600" />;
      case 'avans':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'odeme') return 'text-blue-600';
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tamamlandi':
        return <Badge className="bg-green-100 text-green-800 text-xs">Tamamlandı</Badge>;
      case 'beklemende':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Beklemede</Badge>;
      case 'iptal':
        return <Badge className="bg-red-100 text-red-800 text-xs">İptal</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const exportStatement = () => {
    const headers = [
      'Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar', 'Durum', 'Bakiye', 'Notlar'
    ];

    const csvData = filteredTransactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('tr-TR'),
      transaction.type,
      transaction.description,
      transaction.amount.toLocaleString('tr-TR'),
      transaction.status,
      (transaction.balance_after || 0).toLocaleString('tr-TR'),
      transaction.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calisan-finansal-ekstre-${employeeId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground">Finansal ekstre yükleniyor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            // Masraf ekleme fonksiyonu buraya eklenecek
            console.log("Masraf ekle");
          }}
          className="gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <Wallet className="h-4 w-4" />
          <span>Masraf Ekle</span>
        </Button>
        
        <Button
          onClick={() => {
            // Ödeme yapma fonksiyonu buraya eklenecek
            console.log("Ödeme yap");
          }}
          className="gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-600/90 hover:from-green-600/90 hover:to-green-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <HandCoins className="h-4 w-4" />
          <span>Ödeme Yap</span>
        </Button>
        
        <Button
          onClick={() => {
            // Maaş ekleme fonksiyonu buraya eklenecek
            console.log("Maaş ekle");
          }}
          className="gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-600/90 hover:from-blue-600/90 hover:to-blue-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <DollarSign className="h-4 w-4" />
          <span>Maaş Ekle</span>
        </Button>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Receipt className="h-6 w-6 text-gray-600" />
              İşlem Geçmişi
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="search" className="text-sm">Ara:</Label>
                <Input
                  id="search"
                  placeholder="İşlem ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-40"
                />
              </div>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">Son 1 Ay</SelectItem>
                  <SelectItem value="last_3_months">Son 3 Ay</SelectItem>
                  <SelectItem value="last_6_months">Son 6 Ay</SelectItem>
                  <SelectItem value="last_year">Son 1 Yıl</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>

              <Button onClick={exportStatement} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="text-lg text-gray-600 mb-2">İşlem bulunamadı</div>
              <div className="text-sm text-gray-500">Seçilen kriterlere uygun işlem bulunmuyor</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {filteredTransactions.map((transaction, index) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('tr-TR', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {transaction.category && (
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                              {transaction.category}
                            </span>
                          )}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                        {transaction.amount >= 0 ? '+' : ''}
                        {showBalances ? formatCurrency(Math.abs(transaction.amount), 'TRY') : "••••••"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Bakiye: {showBalances ? formatCurrency(transaction.balance_after || 0, 'TRY') : "••••••"}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(transaction.status)}
                        {transaction.payment_method && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {transaction.payment_method}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};