import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Edit, RefreshCw, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PayrollTransaction {
  id: string;
  date: string;
  type: 'tahakkuk' | 'odeme' | 'bonus' | 'kesinti' | 'yardim';
  description: string;
  amount: number;
  status: 'beklemede' | 'tamamlandi' | 'iptal';
  category?: string;
  notes?: string;
  balance_after?: number;
}

interface SalaryStatementProps {
  employeeId: string;
  onEdit?: (salaryData: any) => void;
  refreshTrigger?: number;
}

export const SalaryStatement = ({ employeeId, onEdit, refreshTrigger }: SalaryStatementProps) => {
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [currentSalary, setCurrentSalary] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last_6_months");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalDeductions: 0,
    pendingPayments: 0,
    lastPayment: null as string | null
  });
  const { toast } = useToast();

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
      // Determine date range based on selected period
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

      // Fetch payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('payroll_date', startDate.toISOString().split('T')[0])
        .lte('payroll_date', endDate.toISOString().split('T')[0])
        .order('payroll_date', { ascending: false });

      if (payrollError) throw payrollError;

      // Fetch payment transactions
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .lte('payment_date', endDate.toISOString().split('T')[0])
        .order('payment_date', { ascending: false });

      if (paymentError) throw paymentError;

      // Combine and format transactions
      const formattedTransactions: PayrollTransaction[] = [];

      // Add payroll records (tahakkuk)
      payrollData?.forEach(record => {
        formattedTransactions.push({
          id: `payroll_${record.id}`,
          date: record.payroll_date,
          type: 'tahakkuk',
          description: `${new Date(record.payroll_date).toLocaleDateString('tr-TR')} Maaş Tahakkuku`,
          amount: record.total_cost || 0,
          status: record.status === 'tahakkuk_edildi' ? 'tamamlandi' : 'beklemede',
          category: 'maas',
          notes: record.notes
        });
      });

      // Add payment transactions (ödeme)
      paymentData?.forEach(payment => {
        formattedTransactions.push({
          id: `payment_${payment.id}`,
          date: payment.payment_date,
          type: 'odeme',
          description: `${payment.description || 'Maaş Ödemesi'}`,
          amount: -payment.amount, // Negative for payments (outgoing)
          status: payment.status === 'tamamlandi' ? 'tamamlandi' : 'beklemede',
          category: 'odeme',
          notes: payment.notes
        });
      });

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

      // Calculate stats
      const totalEarned = formattedTransactions
        .filter(t => t.type === 'tahakkuk' && t.status === 'tamamlandi')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalPaid = formattedTransactions
        .filter(t => t.type === 'odeme' && t.status === 'tamamlandi')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pendingPayments = formattedTransactions
        .filter(t => t.type === 'tahakkuk' && t.status === 'beklemede')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const lastPaymentTransaction = formattedTransactions
        .find(t => t.type === 'odeme' && t.status === 'tamamlandi');

      setStats({
        totalEarned,
        totalDeductions: totalEarned - totalPaid,
        pendingPayments,
        lastPayment: lastPaymentTransaction?.date || null
      });

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
        return '📈';
      case 'odeme':
        return '💰';
      case 'bonus':
        return '🎁';
      case 'kesinti':
        return '📉';
      case 'yardim':
        return '🤝';
      default:
        return '💼';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tamamlandi':
        return <Badge className="bg-green-100 text-green-800">Tamamlandı</Badge>;
      case 'beklemede':
        return <Badge className="bg-orange-100 text-orange-800">Beklemede</Badge>;
      case 'iptal':
        return <Badge className="bg-red-100 text-red-800">İptal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportStatement = () => {
    const headers = [
      'Tarih',
      'İşlem Tipi',
      'Açıklama',
      'Tutar',
      'Durum',
      'Bakiye',
      'Notlar'
    ];

    const csvData = transactions.map(transaction => [
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
    link.setAttribute('download', `maas-ekstresi-${employeeId}-${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="text-muted-foreground">Maaş ekstresi yükleniyor...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Current Salary Info */}
      {currentSalary && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                💳 Güncel Maaş Bilgileri
              </CardTitle>
              {onEdit && (
                <Button
                  onClick={() => onEdit(currentSalary)}
                  variant="outline"
                  size="sm"
                  className="border-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  ₺{currentSalary.net_salary.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-blue-600">Net Maaş</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  ₺{(currentSalary.manual_employer_sgk_cost || 0).toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-green-600">SGK İşveren</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700">
                  ₺{(currentSalary.meal_allowance + currentSalary.transport_allowance).toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-orange-600">Yardımlar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">
                  ₺{currentSalary.total_employer_cost.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-purple-600">Toplam Maliyet</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Toplam Tahakkuk</div>
                <div className="text-xl font-bold text-green-700">
                  ₺{stats.totalEarned.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Bekleyen Ödemeler</div>
                <div className="text-xl font-bold text-orange-700">
                  ₺{stats.pendingPayments.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-sm text-gray-600">Ödenmemiş</div>
                <div className="text-xl font-bold text-red-700">
                  ₺{stats.totalDeductions.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Son Ödeme</div>
                <div className="text-sm font-medium text-purple-700">
                  {stats.lastPayment
                    ? new Date(stats.lastPayment).toLocaleDateString('tr-TR')
                    : 'Henüz ödeme yok'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statement Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            📋 Maaş Ekstresi
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
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
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📭</div>
              <div className="text-gray-600">Seçilen dönemde işlem bulunamadı</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}₺{Math.abs(transaction.amount).toLocaleString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Bakiye: ₺{(transaction.balance_after || 0).toLocaleString('tr-TR')}
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
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