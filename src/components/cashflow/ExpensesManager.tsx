import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit, Trash2, Wallet, FileText, Search, Filter, User, Tag, ChevronUp, ChevronDown } from "lucide-react";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import CategorySelector from "@/components/cashflow/CategorySelector";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { generateRecurringExpenses, createNextExpenseInstance } from "@/utils/recurringExpenseScheduler";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import ExpensesHeader from "./ExpensesHeader";
import ExpensesFilterBar from "./ExpensesFilterBar";
import ExpensesBulkActions from "./ExpensesBulkActions";

export interface ExpenseItem {
  id: string;
  amount: number;
  category: { name: string; id?: string };
  category_id?: string;
  subcategory?: string;
  date: string;
  description: string;
  created_at: string;
  expense_type: 'company' | 'employee';
  type?: 'income' | 'expense';
  employee_id?: string;
  employee?: { first_name: string; last_name: string; department: string };
  is_paid?: boolean;
  paid_date?: string | null;
  is_recurring?: boolean;
  is_recurring_instance?: boolean;
  parent_expense_id?: string | null;
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

interface ExpensesManagerProps {
  triggerAddDialog?: number;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onTotalAmountChange?: (amount: number) => void;
}

const ExpensesManager = memo(({ triggerAddDialog, startDate, endDate, onStartDateChange, onEndDateChange, onTotalAmountChange }: ExpensesManagerProps) => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | ''>('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(1);
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
  
  // Edit states
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDescription, setEditDescription] = useState("");
  const [editExpenseType, setEditExpenseType] = useState<'company' | 'employee'>('company');
  const [editSelectedEmployee, setEditSelectedEmployee] = useState("");
  const [editIsPaid, setEditIsPaid] = useState<boolean>(false);
  const [editPaidDate, setEditPaidDate] = useState<Date | null>(null);
  const [editPaymentAccountType, setEditPaymentAccountType] = useState<'cash' | 'bank' | 'credit_card' | 'partner' | ''>('');
  const [editPaymentAccountId, setEditPaymentAccountId] = useState<string>("");
  const [editSelectedCategoryOption, setEditSelectedCategoryOption] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editVatRate, setEditVatRate] = useState<string>('0');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'employee'>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  
  // Selection states
  const [selectedExpenses, setSelectedExpenses] = useState<ExpenseItem[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [subcategoriesList, setSubcategoriesList] = useState<Array<{id: string, name: string, category_id: string}>>([]);
  const { toast } = useToast();

  // Memoized fetch functions
  const fetchEmployees = useCallback(async () => {
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
  }, []);

  // Fetch categories data
  const fetchCategories = useCallback(async () => {
    try {
      // Kullanıcının şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name')
        .eq('type', 'expense')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch all subcategories to show under categories
  const fetchSubcategoriesAll = useCallback(async () => {
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
  }, []);

  // Ödeme hesaplarını yükle
  const fetchPaymentAccounts = useCallback(async () => {
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
  }, []);

  // Fetch expenses data
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:cashflow_categories(id, name),
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
  }, [startDate, endDate, toast]);

  const handleCategoryOptionChange = useCallback((option: string) => {
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
  }, [subcategoriesList]);

  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    fetchSubcategoriesAll();
    fetchPaymentAccounts();
    fetchExpenses();
  }, [startDate, endDate]);

  // Dışarıdan dialog açılması için effect
  useEffect(() => {
    if (triggerAddDialog !== undefined && triggerAddDialog > 0) {
      setIsAddDialogOpen(true);
    }
  }, [triggerAddDialog]);

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
      // Eğer tekrarlanan masraf ise, önce toplam sayıyı hesapla
      let totalRecurringCount = 1; // Default: sadece ana kayıt
      if (isRecurring && recurrenceType) {
        const tempInstances = generateRecurringExpenses(
          date,
          {
            recurrence_type: recurrenceType,
            recurrence_end_date: recurrenceEndDate ? recurrenceEndDate : undefined,
            recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : undefined,
            recurrence_day_of_month: recurrenceType === 'monthly' ? recurrenceDayOfMonth : undefined,
          }
        );
        totalRecurringCount = tempInstances.length;
      }

      const { data: insertedExpense, error } = await supabase
        .from('expenses')
        .insert({
          type: 'expense',
          amount: parseFloat(amount),
          vat_rate: parseFloat(vatRate),
          category_id: selectedCategory,
          subcategory: subcategory || null,
          description: isRecurring && totalRecurringCount > 1
            ? (description ? `${description} (1/${totalRecurringCount})` : `(1/${totalRecurringCount})`)
            : description || null,
          date: format(date, 'yyyy-MM-dd'),
          expense_type: expenseType,
          employee_id: expenseType === 'employee' ? selectedEmployee : null,
          is_paid: isPaid,
          paid_date: isPaid && paidDate ? format(paidDate, 'yyyy-MM-dd') : null,
          is_recurring: isRecurring,
          recurrence_type: isRecurring && recurrenceType ? recurrenceType : null,
          recurrence_interval: isRecurring && recurrenceType ? 1 : null,
          recurrence_end_date: isRecurring && recurrenceEndDate ? format(recurrenceEndDate, 'yyyy-MM-dd') : null,
          recurrence_days: isRecurring && recurrenceType === 'weekly' ? recurrenceDays : null,
          recurrence_day_of_month: isRecurring && recurrenceType === 'monthly' ? recurrenceDayOfMonth : null,
          payment_account_type: isPaid && paymentAccountType ? paymentAccountType : null,
          payment_account_id: isPaid && paymentAccountId ? paymentAccountId : null,
          payment_amount: isPaid ? parseFloat(amount) : null,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;

      // Eğer tekrarlanan masraf ise, gelecek örnekleri oluştur
      if (isRecurring && recurrenceType && insertedExpense && totalRecurringCount > 1) {
        try {
          const instances = generateRecurringExpenses(
            date,
            {
              recurrence_type: recurrenceType,
              recurrence_end_date: recurrenceEndDate ? recurrenceEndDate : undefined,
              recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : undefined,
              recurrence_day_of_month: recurrenceType === 'monthly' ? recurrenceDayOfMonth : undefined,
            }
          );

          // Skip the first instance (already created)
          const futureInstances = instances.slice(1);

          if (futureInstances.length > 0) {
            const totalCount = instances.length; // Ana + tekrarlananlar
            const expensesToInsert = futureInstances.map((instance, index) => ({
              type: 'expense',
              amount: parseFloat(amount),
              vat_rate: parseFloat(vatRate),
              category_id: selectedCategory,
              subcategory: subcategory || null,
              description: description ? `${description} (${index + 2}/${totalCount})` : `(${index + 2}/${totalCount})`,
              date: format(instance.date, 'yyyy-MM-dd'),
              expense_type: expenseType,
              employee_id: expenseType === 'employee' ? selectedEmployee : null,
              is_paid: false, // Future expenses are not paid yet
              paid_date: null,
              is_recurring: false, // These are instances, not recurring templates
              is_recurring_instance: true,
              parent_expense_id: insertedExpense.id,
              recurrence_type: null,
              recurrence_interval: null,
              recurrence_end_date: null,
              recurrence_days: null,
              recurrence_day_of_month: null,
              payment_account_type: null,
              payment_account_id: null,
              payment_amount: null,
              company_id: profile.company_id
            }));

            const { error: batchError } = await supabase
              .from('expenses')
              .insert(expensesToInsert);

            if (batchError) {
              console.error('Error creating recurring expense instances:', batchError);
              toast({
                title: "Uyarı",
                description: "Ana masraf eklendi ama tekrarlayan kayıtlar oluşturulamadı",
                variant: "destructive"
              });
            }
          }
        } catch (recurringError) {
          console.error('Error generating recurring expenses:', recurringError);
          // Continue anyway, the main expense was created
        }
      }

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
      setRecurrenceType('');
      setRecurrenceEndDate(null);
      setRecurrenceDays([]);
      setRecurrenceDayOfMonth(1);
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

  const handleEditClick = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditDate(new Date(expense.date));
    setEditDescription(expense.description || "");
    setEditExpenseType(expense.expense_type);
    setEditSelectedEmployee(expense.employee_id || "");
    setEditIsPaid(expense.is_paid || false);
    setEditPaidDate(expense.paid_date ? new Date(expense.paid_date) : null);
    setEditPaymentAccountType(expense.payment_account_type || '');
    setEditPaymentAccountId(expense.payment_account_id || "");
    // Category ID'yi de sakla
    if (expense.category_id) {
      // Category ID varsa, CategorySelector için formatla
      setEditSelectedCategoryOption(`cat:${expense.category_id}`);
    } else if (expense.category?.id) {
      setEditSelectedCategoryOption(`cat:${expense.category.id}`);
    } else if (expense.category?.name) {
      setEditSelectedCategoryOption(expense.category.name);
    } else {
      setEditSelectedCategoryOption("");
    }
    setEditSubcategory(expense.subcategory || "");
    setEditVatRate('0'); // Vat rate bilgisi expense'te yok, varsayılan olarak 0
    setIsEditSheetOpen(true);
  };

  const handleEditCategoryOptionChange = (option: string) => {
    setEditSelectedCategoryOption(option);
    if (option.startsWith('cat:')) {
      const catId = option.slice(4);
      // Category ID'yi saklamak için state ekleyebiliriz veya doğrudan kullanabiliriz
      setEditSubcategory("");
      return;
    }
    if (option.startsWith('sub:')) {
      const subId = option.slice(4);
      const sub = subcategoriesList.find(s => s.id === subId);
      if (sub) {
        setEditSubcategory(sub.name);
      }
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    if (!editAmount || parseFloat(editAmount) <= 0) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir tutar girin",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      const isoDate = format(editDate, 'yyyy-MM-dd');
      let categoryId = editingExpense.category_id;
      
      // Category seçiminden ID'yi al
      if (editSelectedCategoryOption.startsWith('cat:')) {
        categoryId = editSelectedCategoryOption.slice(4);
      } else if (editSelectedCategoryOption.startsWith('sub:')) {
        const subId = editSelectedCategoryOption.slice(4);
        const sub = subcategoriesList.find(s => s.id === subId);
        if (sub) {
          categoryId = sub.category_id;
        }
      } else if (editSelectedCategoryOption) {
        // Eğer sadece kategori adı varsa ID'yi bul
        const foundCategory = categories.find(c => c.name === editSelectedCategoryOption);
        if (foundCategory) {
          categoryId = foundCategory.id;
        }
      }

      const updateData: any = {
        amount: parseFloat(editAmount),
        date: isoDate,
        description: editDescription,
        expense_type: editExpenseType,
        employee_id: editExpenseType === 'employee' ? editSelectedEmployee : null,
        is_paid: editIsPaid,
        paid_date: editIsPaid && editPaidDate ? format(editPaidDate, 'yyyy-MM-dd') : null,
        payment_account_type: editIsPaid ? editPaymentAccountType : null,
        payment_account_id: editIsPaid ? editPaymentAccountId : null,
        category_id: categoryId,
        subcategory: editSubcategory || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Masraf başarıyla güncellendi"
      });

      setIsEditSheetOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Hata",
        description: "Masraf güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
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

  // Memoized filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
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
  }, [expenses, searchQuery, filterType, filterEmployee, filterCategory]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // Toplam tutarı parent component'e gönder
  useEffect(() => {
    if (onTotalAmountChange) {
      onTotalAmountChange(totalAmount);
    }
  }, [totalAmount, onTotalAmountChange]);

  // Memoized selection handlers
  const handleSelectExpense = useCallback((expense: ExpenseItem) => {
    setSelectedExpenses(prev => {
      const isSelected = prev.some(e => e.id === expense.id);
      if (isSelected) {
        return prev.filter(e => e.id !== expense.id);
      } else {
        return [...prev, expense];
      }
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedExpenses(filteredExpenses);
      setIsAllSelected(true);
    } else {
      setSelectedExpenses([]);
      setIsAllSelected(false);
    }
  }, [filteredExpenses]);

  const handleClearSelection = useCallback(() => {
    setSelectedExpenses([]);
    setIsAllSelected(false);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedExpenses.length === 0) return;

    switch (action) {
      case 'delete':
        // Bulk delete işlemi
        try {
          const ids = selectedExpenses.map(e => e.id);
          const { error } = await supabase
            .from('expenses')
            .delete()
            .in('id', ids);

          if (error) throw error;

          toast({
            title: "Başarılı",
            description: `${selectedExpenses.length} işlem başarıyla silindi`
          });

          setSelectedExpenses([]);
          setIsAllSelected(false);
          fetchExpenses();
        } catch (error: any) {
          toast({
            title: "Hata",
            description: "İşlemler silinirken bir hata oluştu",
            variant: "destructive"
          });
        }
        break;
      case 'export':
        // Excel export işlemi
        toast({
          title: "Bilgi",
          description: "Excel export özelliği yakında eklenecek"
        });
        break;
      default:
        break;
    }
  }, [selectedExpenses, filteredExpenses, toast, fetchExpenses]);

  // Update isAllSelected when filteredExpenses change
  useEffect(() => {
    if (filteredExpenses.length > 0) {
      setIsAllSelected(selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedExpenses, filteredExpenses]);

  // Memoized account name getter
  const getAccountName = useCallback((accountType: string, accountId: string) => {
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
  }, [cashAccounts, bankAccounts, creditCards, partnerAccounts]);

  const getSortIcon = useCallback((field: string) => {
    // Sort functionality için placeholder
    return null;
  }, []);

  return (
    <div className="space-y-2">
      {/* Header */}
      <ExpensesHeader
        expenses={filteredExpenses}
        onAddClick={() => setIsAddDialogOpen(true)}
        onCategoriesClick={() => {
          navigate('/cashflow/categories');
        }}
        totalAmount={totalAmount}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Filter Bar */}
      <ExpensesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterEmployee={filterEmployee}
        setFilterEmployee={setFilterEmployee}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        employees={employees}
        categories={categories}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />

      {/* Bulk Actions */}
      <ExpensesBulkActions
        selectedExpenses={selectedExpenses}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
              <TableRow className="bg-slate-100 border-b border-slate-200">
                <TableHead className="w-[40px] py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">📅</span>
                    <span>Tarih</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">🏢</span>
                    <span>Tür</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">👤</span>
                    <span>Çalışan</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">🏷️</span>
                    <span>Kategori</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">💳</span>
                    <span>Ödeme</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">🏦</span>
                    <span>Hesap</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-lg mr-2">📝</span>
                    <span>Açıklama</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-lg mr-2">💰</span>
                    <span>Tutar</span>
                  </div>
                </TableHead>
                <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg mr-2">⚙️</span>
                    <span>İşlemler</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const isSelected = selectedExpenses.some(e => e.id === expense.id);
                return (
                  <TableRow
                    key={expense.id}
                    onClick={() => handleEditClick(expense)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectExpense(expense)}
                      />
                    </TableCell>
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
                    <TableCell className="max-w-xs truncate">
                      {expense.description || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Düzenle"
                          onClick={(e) => { e.stopPropagation(); handleEditClick(expense); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(expense); }}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    onClose={(isOpen) => !isOpen && setIsAddDialogOpen(false)}
    title="Yeni Masraf Ekle"
    maxWidth="xl"
    headerColor="red"
  >
  <div 
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleAddExpense(); }
        if (e.key === 'Escape') { e.preventDefault(); setIsAddDialogOpen(false); }
      }}
    >
      {/* Temel Bilgiler: iki sütunu kapla ve içeride iki kolon kullan */}
      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="date">Tarih <span className="text-red-500">*</span></Label>
            <EnhancedDatePicker
              date={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              placeholder="Tarih seçin"
              className="w-full h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="amount">Tutar (₺) <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 flex-1"
                step="0.01"
                min="0"
                autoFocus
              />
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="w-[110px] h-9">
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
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Label>Çalışan</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="company-expense"
                  checked={expenseType === 'company'}
                  onCheckedChange={(checked) => setExpenseType(checked ? 'company' : 'employee')}
                />
                <Label htmlFor="company-expense" className="text-sm font-normal cursor-pointer">
                  Şirket
                </Label>
              </div>
            </div>
            <EmployeeSelector
              value={selectedEmployee}
              onChange={(value) => setSelectedEmployee(value)}
              error=""
              label=""
              placeholder={expenseType === 'company' ? "Şirket masrafı" : "Çalışan seçin..."}
              searchPlaceholder="Çalışan ara..."
              loadingText="Çalışanlar yükleniyor..."
              noResultsText="Çalışan bulunamadı"
              triggerClassName="h-9"
              disabled={expenseType === 'company'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
            <CategorySelector
              value={selectedCategoryOption}
              onChange={handleCategoryOptionChange}
              categories={categories}
              subcategories={subcategoriesList}
              showLabel={false}
              placeholder="Kategori seçin"
              triggerClassName="h-9"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Sol sütun: Ödeme Bilgileri */}
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-semibold text-gray-700">Ödeme Durumu</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-paid"
                checked={isPaid}
                onCheckedChange={(v) => setIsPaid(!!v)}
              />
              <Label htmlFor="is-paid" className="text-sm font-normal cursor-pointer">
                Ödendi
              </Label>
            </div>
          </div>
          {isPaid && (
            <>
              <div className="space-y-1">
                <Label>Ödeme Tarihi</Label>
                <EnhancedDatePicker
                  date={paidDate || undefined}
                  onSelect={(d) => setPaidDate(d || null)}
                  placeholder="Tarih seçin"
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label>Hesap Türü</Label>
                <Select value={paymentAccountType} onValueChange={(val: any) => { setPaymentAccountType(val); setPaymentAccountId(''); }}>
                  <SelectTrigger className="h-9 w-full">
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
              <div className="space-y-1">
                <Label>Hesap</Label>
                <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                  <SelectTrigger className="h-9 w-full">
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
            </>
          )}
        </div>
      </div>

      {/* Sağ sütun: Tekrarlama Bilgileri */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-semibold text-gray-700">Tekrarlanan Masraf</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={(v) => {
                setIsRecurring(!!v);
                // Tekrarlama aktifleştirildiğinde, bitiş tarihini otomatik olarak bir yıl sonraya ayarla
                if (v) {
                  const oneYearLater = new Date(date);
                  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                  setRecurrenceEndDate(oneYearLater);
                }
              }}
            />
            <Label htmlFor="is-recurring" className="text-sm font-normal cursor-pointer">
              Aktif
            </Label>
          </div>
        </div>

        {isRecurring && (
          <>
            <div className="space-y-1">
              <Label>Tekrarlama Sıklığı</Label>
              <Select value={recurrenceType} onValueChange={(val: any) => setRecurrenceType(val)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Sıklık seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Her Gün</SelectItem>
                  <SelectItem value="weekly">Her Hafta</SelectItem>
                  <SelectItem value="monthly">Her Ay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="space-y-1">
                <Label>Günler</Label>
                <div className="grid grid-cols-7 gap-1">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      size="sm"
                      variant={recurrenceDays[0] === String(idx + 1) ? "default" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => {
                        const dayStr = String(idx + 1);
                        // Tek seçim: aynı günse temizle, değilse yalnızca bu gün
                        setRecurrenceDays((prev) => (prev[0] === dayStr ? [] : [dayStr]));
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {recurrenceType === 'monthly' && (
              <div className="space-y-1">
                <Label>Ayın Günü</Label>
                <Input
                  type="number"
                  value={recurrenceDayOfMonth}
                  onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                  min="1"
                  max="31"
                  className="w-20 h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label>Bitiş Tarihi</Label>
              <EnhancedDatePicker
                date={recurrenceEndDate || undefined}
                onSelect={(d) => setRecurrenceEndDate(d || null)}
                placeholder="Seçmezseniz süresiz"
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Açıklama en altta tam genişlik */}
      <div className="lg:col-span-2">
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

      <div className="lg:col-span-2">
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={() => setIsAddDialogOpen(false)} />
          <UnifiedDialogActionButton onClick={handleAddExpense}>Kaydet</UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </div>
    </div>
  </UnifiedDialog>

      {/* Edit Sheet - Sağ Panel */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-red-600">Masraf Düzenle</SheetTitle>
            <SheetDescription>
              Masraf bilgilerini düzenleyin ve kaydedin
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Temel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-date">Tarih <span className="text-red-500">*</span></Label>
                  <EnhancedDatePicker
                    date={editDate}
                    onSelect={(newDate) => newDate && setEditDate(newDate)}
                    placeholder="Tarih seçin"
                    className="w-full h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-amount">Tutar (₺) <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-amount"
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-9 flex-1"
                      step="0.01"
                      min="0"
                    />
                    <Select value={editVatRate} onValueChange={setEditVatRate}>
                      <SelectTrigger className="w-[110px] h-9">
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
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Label>Çalışan</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-company-expense"
                        checked={editExpenseType === 'company'}
                        onCheckedChange={(checked) => setEditExpenseType(checked ? 'company' : 'employee')}
                      />
                      <Label htmlFor="edit-company-expense" className="text-sm font-normal cursor-pointer">
                        Şirket
                      </Label>
                    </div>
                  </div>
                  <EmployeeSelector
                    value={editSelectedEmployee}
                    onChange={(value) => setEditSelectedEmployee(value)}
                    error=""
                    label=""
                    placeholder={editExpenseType === 'company' ? "Şirket masrafı" : "Çalışan seçin..."}
                    searchPlaceholder="Çalışan ara..."
                    loadingText="Çalışanlar yükleniyor..."
                    noResultsText="Çalışan bulunamadı"
                    triggerClassName="h-9"
                    disabled={editExpenseType === 'company'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategori <span className="text-red-500">*</span></Label>
                  <CategorySelector
                    value={editSelectedCategoryOption}
                    onChange={handleEditCategoryOptionChange}
                    categories={categories}
                    subcategories={subcategoriesList}
                    showLabel={false}
                    placeholder="Kategori seçin"
                    triggerClassName="h-9"
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Masraf açıklaması..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Ödeme Durumu */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-700">Ödeme Durumu</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is-paid"
                    checked={editIsPaid}
                    onCheckedChange={(v) => setEditIsPaid(!!v)}
                  />
                  <Label htmlFor="edit-is-paid" className="text-sm font-normal cursor-pointer">
                    Ödendi
                  </Label>
                </div>
              </div>
              {editIsPaid && (
                <>
                  <div className="space-y-1">
                    <Label>Ödeme Tarihi</Label>
                    <EnhancedDatePicker
                      date={editPaidDate || undefined}
                      onSelect={(d) => setEditPaidDate(d || null)}
                      placeholder="Tarih seçin"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Hesap Türü</Label>
                    <Select value={editPaymentAccountType} onValueChange={(val: any) => { setEditPaymentAccountType(val); setEditPaymentAccountId(''); }}>
                      <SelectTrigger className="h-9 w-full">
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
                  <div className="space-y-1">
                    <Label>Hesap</Label>
                    <Select value={editPaymentAccountId} onValueChange={setEditPaymentAccountId}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Hesap seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {editPaymentAccountType === 'cash' && cashAccounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                        ))}
                        {editPaymentAccountType === 'bank' && bankAccounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                        ))}
                        {editPaymentAccountType === 'credit_card' && creditCards.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                        ))}
                        {editPaymentAccountType === 'partner' && partnerAccounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditSheetOpen(false)}
              disabled={isUpdating}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateExpense}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Güncelleniyor...' : 'Kaydet'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
});

ExpensesManager.displayName = 'ExpensesManager';

export default ExpensesManager;