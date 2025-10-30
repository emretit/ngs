import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Wallet, FileText, Search, Filter, User, Tag } from "lucide-react";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ExpenseItem {
  id: string;
  amount: number;
  category: { name: string };
  subcategory?: string;
  date: string;
  description: string;
  created_at: string;
  expense_type: 'company' | 'employee';
  employee_id?: string;
  employee?: { first_name: string; last_name: string; department: string };
  is_paid?: boolean;
  paid_date?: string | null;
  is_recurring?: boolean;
  payment_account_type?: 'cash' | 'bank' | 'credit_card' | 'partner' | null;
  payment_account_id?: string | null;
}

const EXPENSE_CATEGORIES = [
  "Personel Masrafları",
  "Operasyonel Masraflar", 
  "Ofis Masrafları",
  "Pazarlama & Satış",
  "Finansman Masrafları",
  "Genel Masraflar",
  "Seyahat Masrafları"
];

const ExpensesManager = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryOption, setSelectedCategoryOption] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [expenseType, setExpenseType] = useState<'company' | 'employee'>('company');
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paidDate, setPaidDate] = useState<Date | null>(null);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [paymentAccountType, setPaymentAccountType] = useState<'cash' | 'bank' | 'credit_card' | 'partner' | ''>('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [cashAccounts, setCashAccounts] = useState<Array<{id: string, label: string}>>([]);
  const [bankAccounts, setBankAccounts] = useState<Array<{id: string, label: string}>>([]);
  const [creditCards, setCreditCards] = useState<Array<{id: string, label: string}>>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<Array<{id: string, label: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, first_name: string, last_name: string, department: string}>>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vatRate, setVatRate] = useState<string>('0');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'employee'>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Array<{id: string, name: string, category_id: string}>>([]);
  const { toast } = useToast();

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
      // Şirket bilgisini al (RLS için company_id zorunlu)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch categories data
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name')
        .eq('type', 'expense')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch all subcategories to show under categories
  const fetchSubcategoriesAll = async () => {
    try {
      const { data, error } = await supabase
        .from('cashflow_subcategories')
        .select('id, name, category_id')
        .order('name');
      if (error) throw error;
      setSubcategoriesList((data as any) || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // Ödeme hesaplarını yükle
  const fetchPaymentAccounts = async () => {
    try {
      const [cashRes, bankRes, cardRes, partnerRes] = await Promise.all([
        supabase.from('cash_accounts').select('id, name'),
        supabase.from('bank_accounts').select('id, account_name'),
        supabase.from('credit_cards').select('id, card_name'),
        supabase.from('partner_accounts').select('id, partner_name')
      ]);

      if (!cashRes.error && cashRes.data) setCashAccounts(cashRes.data.map((a: any) => ({ id: a.id, label: a.name })));
      if (!bankRes.error && bankRes.data) setBankAccounts(bankRes.data.map((a: any) => ({ id: a.id, label: a.account_name })));
      if (!cardRes.error && cardRes.data) setCreditCards(cardRes.data.map((a: any) => ({ id: a.id, label: a.card_name })));
      if (!partnerRes.error && partnerRes.data) setPartnerAccounts(partnerRes.data.map((a: any) => ({ id: a.id, label: a.partner_name })));
    } catch (e) {
      console.error('Hesaplar yüklenirken hata:', e);
    }
  };

  // Fetch expenses data
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:cashflow_categories(name),
          employee:employees(first_name, last_name, department)
        `)
        .eq('type', 'expense')
        .not('company_id', 'is', null)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Hata",
        description: "Masraflar yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryOptionChange = (option: string) => {
    setSelectedCategoryOption(option);
    if (option.startsWith('cat:')) {
      const catId = option.slice(4);
      setSelectedCategory(catId);
      setSubcategory("");
      return;
    }
    if (option.startsWith('sub:')) {
      const subId = option.slice(4);
      const sub = subcategoriesList.find(s => s.id === subId);
      if (sub) {
        setSelectedCategory(sub.category_id);
        setSubcategory(sub.name);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    fetchSubcategoriesAll();
    fetchPaymentAccounts();
    fetchExpenses();
  }, [startDate, endDate]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !amount || !date) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm gerekli alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    if (expenseType === 'employee' && !selectedEmployee) {
      toast({
        title: "Eksik Bilgi",
        description: "Çalışan masrafı için çalışan seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      const { error } = await supabase
        .from('expenses')
        .insert({
          type: 'expense',
          amount: parseFloat(amount),
          vat_rate: parseFloat(vatRate),
          category_id: selectedCategory,
          subcategory: subcategory || null,
          description: description,
          date: format(date, 'yyyy-MM-dd'),
          expense_type: expenseType,
          employee_id: expenseType === 'employee' ? selectedEmployee : null,
          is_paid: isPaid,
          paid_date: isPaid && paidDate ? format(paidDate, 'yyyy-MM-dd') : null,
          is_recurring: isRecurring,
          payment_account_type: isPaid && paymentAccountType ? paymentAccountType : null,
          payment_account_id: isPaid && paymentAccountId ? paymentAccountId : null,
          payment_amount: isPaid ? parseFloat(amount) : null,
          company_id: profile.company_id
        });

      if (error) throw error;

      // Eğer masraf ödendiyse ilgili hesap hareketini ve bakiyesini güncelle
      if (isPaid && paymentAccountType && paymentAccountId) {
        try {
          const isoDate = new Date(date).toISOString();
          if (paymentAccountType === 'cash') {
            const { error: trErr } = await supabase
              .from('cash_transactions')
              .insert({
                account_id: paymentAccountId,
                amount: parseFloat(amount),
                type: 'expense',
                description: description || 'Masraf ödemesi',
                category: null,
                reference: null,
                transaction_date: isoDate,
                company_id: profile.company_id
              });
            if (trErr) throw trErr;
            const { error: balErr } = await supabase.rpc('update_cash_account_balance', {
              p_account_id: paymentAccountId,
              p_amount: parseFloat(amount),
              p_type: 'expense'
            });
            if (balErr) throw balErr;
          } else if (paymentAccountType === 'bank') {
            const { error: trErr } = await supabase
              .from('bank_transactions')
              .insert({
                account_id: paymentAccountId,
                amount: parseFloat(amount),
                type: 'expense',
                description: description || 'Masraf ödemesi',
                category: 'Genel',
                reference: null,
                transaction_date: isoDate,
                company_id: profile.company_id
              });
            if (trErr) throw trErr;
            const { error: balErr } = await supabase.rpc('update_bank_account_balance', {
              account_id: paymentAccountId,
              amount: parseFloat(amount),
              transaction_type: 'expense'
            });
            if (balErr) throw balErr;
          } else if (paymentAccountType === 'partner') {
            const { error: trErr } = await supabase
              .from('partner_transactions')
              .insert({
                partner_id: paymentAccountId,
                amount: parseFloat(amount),
                type: 'expense',
                description: description || 'Masraf ödemesi',
                category: 'Genel',
                reference: null,
                transaction_date: isoDate,
                company_id: profile.company_id
              });
            if (trErr) throw trErr;
            const { error: balErr } = await supabase.rpc('update_partner_account_balance', {
              account_id: paymentAccountId,
              amount: parseFloat(amount),
              transaction_type: 'expense'
            });
            if (balErr) throw balErr;
          } else if (paymentAccountType === 'credit_card') {
            // Kredi kartı hareketi ve bakiye güncelleme
            const { error: trErr } = await supabase
              .from('credit_card_transactions')
              .insert({
                card_id: paymentAccountId,
                amount: parseFloat(amount),
                type: 'expense',
                description: description || 'Masraf ödemesi',
                category: 'Genel',
                reference: null,
                transaction_date: isoDate,
                company_id: profile.company_id
              });
            if (trErr) throw trErr;
            const { error: balErr } = await supabase.rpc('update_credit_card_balance', {
              card_id: paymentAccountId,
              amount: parseFloat(amount),
              transaction_type: 'expense'
            });
            if (balErr) throw balErr;
          }
        } catch (txErr) {
          console.error('Paid transaction add/update error:', txErr);
          // Devam edelim; ana masraf kaydı başarıyla eklendi
        }
      }

      toast({
        title: "Başarılı",
        description: "Masraf başarıyla eklendi"
      });

      setIsAddDialogOpen(false);
      setSelectedCategory("");
      setSubcategory("");
      setAmount("");
      setDescription("");
      setDate(new Date());
      setExpenseType('company');
      setSelectedEmployee("");
      setIsPaid(false);
      setPaidDate(null);
      setIsRecurring(false);
      setPaymentAccountType('');
      setPaymentAccountId("");
      setVatRate('0');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Hata",
        description: "Masraf eklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (expense: ExpenseItem) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Masraf başarıyla silindi"
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Hata",
        description: "Masraf silinirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  // Filter expenses based on selected filters
  const filteredExpenses = expenses.filter(expense => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.employee && 
        `${expense.employee.first_name} ${expense.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by type
    if (filterType !== 'all' && expense.expense_type !== filterType) {
      return false;
    }
    
    // Filter by employee
    if (filterEmployee !== 'all' && expense.employee_id !== filterEmployee) {
      return false;
    }
    
    // Filter by category
    if (filterCategory !== 'all' && (expense.category as any)?.id !== filterCategory) {
      return false;
    }
    
    return matchesSearch;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Hesap adını bulmak için fonksiyon
  const getAccountName = (accountType: string, accountId: string) => {
    if (!accountType || !accountId) return '-';
    
    switch (accountType) {
      case 'cash':
        const cashAccount = cashAccounts.find(acc => acc.id === accountId);
        return cashAccount ? cashAccount.label : '-';
      case 'bank':
        const bankAccount = bankAccounts.find(acc => acc.id === accountId);
        return bankAccount ? bankAccount.label : '-';
      case 'credit_card':
        const creditCard = creditCards.find(acc => acc.id === accountId);
        return creditCard ? creditCard.label : '-';
      case 'partner':
        const partnerAccount = partnerAccounts.find(acc => acc.id === accountId);
        return partnerAccount ? partnerAccount.label : '-';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-700 font-medium">
              {format(startDate, 'dd MMM', { locale: tr })} - {format(endDate, 'dd MMM yyyy', { locale: tr })}
            </div>
            <div className="w-px h-4 bg-green-300"></div>
            <div className="text-lg font-bold text-green-800">
              ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/cashflow/categories')}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Tag className="mr-2 h-4 w-4" />
            Gelir-Masraf Kategorileri
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Masraf
          </Button>
          
        </div>
      </div>

      {/* Filters - Teklifler sayfası gibi tek satırda */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        {/* Arama */}
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Açıklama, kategori veya çalışan adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        {/* Masraf Türü */}
        <Select value={filterType} onValueChange={(value: 'all' | 'company' | 'employee') => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tür" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="company">Şirket</SelectItem>
            <SelectItem value="employee">Çalışan</SelectItem>
          </SelectContent>
        </Select>

        {/* Çalışan */}
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="w-[200px]">
            <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Çalışan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Çalışanlar</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Kategori */}
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <Tag className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tarih Filtreleri */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <EnhancedDatePicker
            date={startDate}
            onSelect={(newDate) => newDate && setStartDate(newDate)}
            placeholder="Başlangıç"
            className="w-32 text-xs"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <EnhancedDatePicker
            date={endDate}
            onSelect={(newDate) => newDate && setEndDate(newDate)}
            placeholder="Bitiş"
            className="w-32 text-xs"
          />
        </div>

      </div>

      {/* Simple Table */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Masraflar yükleniyor...</p>
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bu dönem için masraf kaydı bulunamadı</h3>
            <p className="text-gray-600">Yeni masraf eklemek için yukarıdaki butonu kullanın</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Çalışan</TableHead>
                <TableHead>Kategori / Alt Kategori</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead>Ödeme Hesabı</TableHead>
                <TableHead>Tekrarlı</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {format(new Date(expense.date), 'dd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.expense_type === 'company' ? 'default' : 'secondary'}>
                      {expense.expense_type === 'company' ? 'Şirket' : 'Çalışan'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.employee ? 
                      `${expense.employee.first_name} ${expense.employee.last_name}` : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {expense.category?.name || 'Bilinmeyen'}
                      </Badge>
                      {expense.subcategory && expense.subcategory.trim() !== '' && (
                        <>
                          <span className="text-gray-400">/</span>
                          <span className="text-xs text-gray-600 font-normal">
                            {expense.subcategory}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                    <TableCell>
                      {expense.is_paid ? (
                        <Badge className="bg-green-600 text-white">Ödendi{expense.paid_date ? ` · ${format(new Date(expense.paid_date), 'dd MMM yyyy', { locale: tr })}` : ''}</Badge>
                      ) : (
                        <Badge variant="secondary">Ödenmedi</Badge>
                      )}
                    </TableCell>
                  <TableCell>
                    {expense.payment_account_type && expense.payment_account_id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {expense.payment_account_type === 'cash' ? 'Kasa' :
                           expense.payment_account_type === 'bank' ? 'Banka' :
                           expense.payment_account_type === 'credit_card' ? 'Kredi Kartı' :
                           expense.payment_account_type === 'partner' ? 'Ortak' : expense.payment_account_type}
                        </Badge>
                        <span className="text-gray-400">/</span>
                        <span className="text-xs text-gray-600 font-normal">
                          {getAccountName(expense.payment_account_type, expense.payment_account_id)}
                        </span>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.is_recurring ? (
                      <Badge variant="default">Tekrarlı</Badge>
                    ) : (
                      <Badge variant="outline">Tekrarlı değil</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(expense)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Masrafı Sil"
        description={`"${expenseToDelete?.description || 'Bu masraf'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
  <UnifiedDialog
    isOpen={isAddDialogOpen}
    onClose={() => setIsAddDialogOpen(false)}
    title="Yeni Masraf Ekle"
    maxWidth="md"
    headerColor="red"
  >
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleAddExpense(); }
        if (e.key === 'Escape') { e.preventDefault(); setIsAddDialogOpen(false); }
      }}
    >
      {/* Sol sütun: tarih üstte, ardından tür ve çalışan */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="date">Tarih <span className="text-red-500">*</span></Label>
          <EnhancedDatePicker
            date={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            placeholder="Tarih seçin"
          />
        </div>

        <div>
          <Label htmlFor="expenseType">Masraf Türü</Label>
          <Select value={expenseType} onValueChange={(value: 'company' | 'employee') => setExpenseType(value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Şirket Masrafı</SelectItem>
              <SelectItem value="employee">Çalışan Masrafı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {expenseType === 'employee' && (
          <div>
            <EmployeeSelector
              value={selectedEmployee}
              onChange={(value) => setSelectedEmployee(value)}
              error=""
              label="Çalışan"
              placeholder="Çalışan seçin..."
              searchPlaceholder="Çalışan ara..."
              loadingText="Çalışanlar yükleniyor..."
              noResultsText="Çalışan bulunamadı"
            />
          </div>
        )}
      </div>

      {/* Sağ sütun: tutar+KDV üstte, ardından kategori */}
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="amount">Tutar (KDV dahil, ₺) <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-32 h-8"
              step="0.01"
              min="0"
              autoFocus
            />
            <Select value={vatRate} onValueChange={setVatRate}>
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue placeholder="KDV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">%0</SelectItem>
                <SelectItem value="1">%1</SelectItem>
                <SelectItem value="10">%10</SelectItem>
                <SelectItem value="20">%20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Girdiğin tutar KDV dahil kabul edilir. KDV oranını yan taraftan seç.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
          <Select value={selectedCategoryOption} onValueChange={handleCategoryOptionChange}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Kategori veya alt kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectGroup key={cat.id}>
                  <SelectItem value={`cat:${cat.id}`}>{cat.name}</SelectItem>
                  {subcategoriesList
                    .filter(sc => sc.category_id === cat.id)
                    .map(sc => (
                      <SelectItem key={sc.id} value={`sub:${sc.id}`}>
                        {sc.name} ({cat.name})
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ödeme alanları: yalnızca ödendi ise göster */}
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Ödendi mi?</Label>
          </div>
          <Switch checked={isPaid} onCheckedChange={(v) => setIsPaid(!!v)} />
        </div>
        {isPaid && (
          <div className="space-y-1">
            <Label>Ödeme Tarihi</Label>
            <EnhancedDatePicker
              date={paidDate || undefined}
              onSelect={(d) => setPaidDate(d || null)}
              placeholder="Tarih seçin"
            />
          </div>
        )}
        {isPaid && (
          <div className="space-y-1">
            <Label>Hesap Türü</Label>
            <Select value={paymentAccountType} onValueChange={(val: any) => { setPaymentAccountType(val); setPaymentAccountId(''); }}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Hesap türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Kasa</SelectItem>
                <SelectItem value="bank">Banka</SelectItem>
                <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                <SelectItem value="partner">Ortak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {isPaid && (
          <div className="space-y-1">
            <Label>Hesap</Label>
            <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Hesap seçin" />
              </SelectTrigger>
              <SelectContent>
                {paymentAccountType === 'cash' && cashAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                ))}
                {paymentAccountType === 'bank' && bankAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                ))}
                {paymentAccountType === 'credit_card' && creditCards.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                ))}
                {paymentAccountType === 'partner' && partnerAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Açıklama en altta tam genişlik */}
      <div className="sm:col-span-2">
        <div className="space-y-1">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Masraf açıklaması"
            rows={2}
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={() => setIsAddDialogOpen(false)} />
          <UnifiedDialogActionButton onClick={handleAddExpense}>Kaydet</UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </div>
    </div>
  </UnifiedDialog>
    </div>
  );
};

export default ExpensesManager;