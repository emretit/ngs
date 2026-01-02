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
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { AccountTransactionHistory } from "@/components/cashflow/AccountTransactionHistory";

interface FinancialTransaction {
  id: string;
  date: string;
  type: 'tahakkuk' | 'odeme' | 'bonus' | 'kesinti' | 'yardim' | 'avans' | 'prim' | 'ikramiye' | 'masraf';
  description: string;
  amount: number;
  status: 'beklemende' | 'tamamlandi' | 'iptal';
  category?: string;
  notes?: string;
  balance_after?: number;
  payment_method?: string;
  reference_id?: string;
}

interface EmployeeTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  category?: string;
  reference?: string;
  balanceAfter?: number;
  isExpenseEntry?: boolean;
  expenseId?: string;
}

interface EmployeeFinancialStatementProps {
  employeeId: string;
  onEdit?: (salaryData: any) => void;
  refreshTrigger?: number;
}

export const EmployeeFinancialStatement = ({ employeeId, onEdit, refreshTrigger }: EmployeeFinancialStatementProps) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [currentSalary, setCurrentSalary] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last_6_months");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [showBalances, setShowBalances] = useState(true);
  const [loading, setLoading] = useState(true);
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
      .filter(t => ['kesinti', 'avans', 'masraf'].includes(t.type) && t.status === 'tamamlandi')
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
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
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

      // Fetch employee data (salary info is now in employees table)
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;

      const formattedTransactions: FinancialTransaction[] = [];

      // Add current salary as tahakkuk if it exists
      if (employeeData && employeeData.net_salary && employeeData.effective_date) {
        // Check if the salary is within the selected period
        const salaryDate = new Date(employeeData.effective_date);
        if (salaryDate >= startDate && salaryDate <= endDate) {
          formattedTransactions.push({
            id: `salary_${employeeData.id}`,
            date: employeeData.effective_date,
            type: 'tahakkuk',
            description: `${new Date(employeeData.effective_date).toLocaleDateString('tr-TR')} Maaş Tahakkuku`,
            amount: employeeData.net_salary || 0,
            status: 'tamamlandi',
            category: 'maas',
            notes: employeeData.salary_notes,
            reference_id: employeeData.id
          });
        }
      }

      // Fetch employee expenses from expenses table
      const { data: employeeExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          date,
          description,
          category:cashflow_categories(name),
          is_paid,
          paid_date,
          payment_account_type,
          payment_account_id
        `)
        .eq('employee_id', employeeId)
        .eq('expense_type', 'employee')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      // AccountTransactionHistory için transaction listesi
      const accountTransactions: EmployeeTransaction[] = [];

      if (!expensesError && employeeExpenses) {
        // Ödeme yapılan masrafların transaction'larını çek
        const paidExpenses = employeeExpenses.filter(e => e.is_paid && e.payment_account_type && e.payment_account_id);
        const expenseIds = paidExpenses.map(e => e.id);
        
        // Tüm payment account transaction'larını çek
        const paymentTransactions: any[] = [];
        
        if (expenseIds.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_id')
              .eq('id', user.id)
              .single();
            
            if (profile?.company_id) {
              const referenceValues = expenseIds.map(id => `EXP-${id}`);
              
              // Cash transactions
              const { data: cashTransactions } = await supabase
                .from('cash_transactions')
                .select('*')
                .eq('company_id', profile.company_id)
                .in('reference', referenceValues);
              
              if (cashTransactions) {
                paymentTransactions.push(...cashTransactions.map(t => ({ ...t, account_type: 'cash' })));
              }
              
              // Bank transactions
              const { data: bankTransactions } = await supabase
                .from('bank_transactions')
                .select('*')
                .in('reference', referenceValues);
              
              if (bankTransactions) {
                paymentTransactions.push(...bankTransactions.map(t => ({ ...t, account_type: 'bank' })));
              }
              
              // Credit card transactions
              const { data: cardTransactions } = await supabase
                .from('card_transactions')
                .select('*')
                .in('reference_number', referenceValues);
              
              if (cardTransactions) {
                paymentTransactions.push(...cardTransactions.map(t => ({ ...t, account_type: 'credit_card' })));
              }
              
              // Partner transactions
              const { data: partnerTransactions } = await supabase
                .from('partner_transactions')
                .select('*')
                .in('reference', referenceValues);
              
              if (partnerTransactions) {
                paymentTransactions.push(...partnerTransactions.map(t => ({ ...t, account_type: 'partner' })));
              }
            }
          }
        }
        
        // Her masraf için iki transaction oluştur
        employeeExpenses.forEach((expense: any) => {
          // Eski format için (geriye dönük uyumluluk)
          formattedTransactions.push({
            id: `expense_${expense.id}`,
            date: expense.date,
            type: 'masraf',
            description: expense.description || `Masraf - ${expense.category?.name || 'Genel'}`,
            amount: -Math.abs(expense.amount),
            status: expense.is_paid ? 'tamamlandi' : 'beklemende',
            category: expense.category?.name || 'masraf',
            notes: expense.is_paid && expense.payment_account_type 
              ? `Ödeme: ${expense.payment_account_type === 'cash' ? 'Kasa' : expense.payment_account_type === 'bank' ? 'Banka' : expense.payment_account_type === 'credit_card' ? 'Kredi Kartı' : 'Ortak'}`
              : undefined,
            reference_id: expense.id
          });
          
          // 1. Masraf girişi (borç)
          accountTransactions.push({
            id: `expense_entry_${expense.id}`,
            type: "expense",
            amount: expense.amount,
            description: expense.description || "Masraf",
            transaction_date: expense.date,
            category: expense.category?.name || 'Masraf',
            reference: `EXP-${expense.id}`,
            isExpenseEntry: true,
            expenseId: expense.id
          });
          
          // 2. Ödeme işlemi (alacak) - eğer ödendiyse
          if (expense.is_paid && expense.paid_date) {
            const paymentTransaction = paymentTransactions.find(
              pt => pt.reference === `EXP-${expense.id}`
            );
            
            const accountTypeLabel = expense.payment_account_type === 'cash' 
              ? 'Kasa' 
              : expense.payment_account_type === 'bank' 
              ? 'Banka' 
              : expense.payment_account_type === 'credit_card' 
              ? 'Kredi Kartı' 
              : 'Ortak';
            
            accountTransactions.push({
              id: `expense_payment_${expense.id}`,
              type: "income",
              amount: expense.amount,
              description: `Masraf Ödemesi (${accountTypeLabel})`,
              transaction_date: expense.paid_date,
              category: 'Masraf Ödemesi',
              reference: `EXP-${expense.id}`,
              isExpenseEntry: false,
              expenseId: expense.id
            });
          }
        });
      }
      
      setEmployeeTransactions(accountTransactions);

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
      
      // AccountTransactionHistory component'i kendi bakiye hesaplamasını yapacak
      // Bu yüzden sadece transaction'ları set ediyoruz, balanceAfter hesaplamıyoruz
      setEmployeeTransactions(accountTransactions);

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
      case 'masraf':
        return <Receipt className="h-4 w-4 text-red-600" />;
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
      'Tarih', 'İşlem Tipi', 'Açıklama', 'Tutar', 'Bakiye', 'Kategori'
    ];

    const csvData = employeeTransactions.map(transaction => [
      new Date(transaction.transaction_date).toLocaleDateString('tr-TR'),
      transaction.type === 'income' ? 'Gelir' : 'Gider',
      transaction.description || '',
      transaction.amount.toLocaleString('tr-TR'),
      (transaction.balanceAfter || 0).toLocaleString('tr-TR'),
      transaction.category || ''
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
          <AccountTransactionHistory
            transactions={employeeTransactions.map(t => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              description: t.description || null,
              transaction_date: t.transaction_date,
              category: t.category || null,
              reference: t.reference || null
            }))}
            currency="TRY"
            showBalances={showBalances}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            initialBalance={0}
            emptyStateTitle="Henüz işlem bulunmuyor"
            emptyStateDescription="İlk işleminizi ekleyerek başlayın"
          />
        </CardContent>
      </Card>
    </div>
  );
};