import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import CategorySelector from "@/components/cashflow/CategorySelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { generateRecurringExpenses } from "@/utils/recurringExpenseScheduler";
import { useExpenses } from "@/hooks/useExpenses";
import ExpensesFilterBar from "./ExpensesFilterBar";
import ExpensesBulkActions from "./ExpensesBulkActions";
import ExpensesListView from "./expenses/ExpensesListView";
import ExpensesPageHeader from "./ExpensesPageHeader";

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
  company_id?: string;
}

interface ExpensesManagerProps {
  triggerAddDialog?: number;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onTotalAmountChange?: (amount: number) => void;
}

const ExpensesManager = memo(({ triggerAddDialog, startDate, endDate, onStartDateChange, onEndDateChange, onTotalAmountChange }: ExpensesManagerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // React Query ile expenses verilerini al
  const { data: expenses = [], isLoading: loading, error: expensesError } = useExpenses({ startDate, endDate });
  
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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  
  // Selection states
  const [selectedExpenses, setSelectedExpenses] = useState<ExpenseItem[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [subcategoriesList, setSubcategoriesList] = useState<Array<{id: string, name: string, category_id: string}>>([]);
  
  // View state - sadece liste görünümü kullanılıyor
  

  // Fetch functions
  const fetchEmployees = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;
      const { data, error } = await supabase.from('employees').select('id, first_name, last_name, department').order('first_name');
      if (!error) setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) return;
      const { data, error } = await supabase.from('cashflow_categories').select('id, name').eq('type', 'expense').eq('company_id', profile.company_id).order('name');
      if (!error) setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchSubcategoriesAll = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('cashflow_subcategories').select('id, name, category_id').order('name');
      if (!error) setSubcategoriesList((data as any) || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  }, []);

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

  // Expenses hatası varsa göster
  useEffect(() => {
    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      toast.error("Masraflar yüklenirken bir hata oluştu");
    }
  }, [expensesError]);

  const handleCategoryOptionChange = useCallback((option: string) => {
    setSelectedCategoryOption(option);
    if (option.startsWith('cat:')) {
      setSelectedCategory(option.slice(4));
      setSubcategory("");
      return;
    }
    if (option.startsWith('sub:')) {
      const sub = subcategoriesList.find(s => s.id === option.slice(4));
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
    // fetchExpenses artık React Query ile otomatik yönetiliyor
  }, [startDate, endDate]);

  useEffect(() => {
    if (triggerAddDialog !== undefined && triggerAddDialog > 0) {
      setIsAddDialogOpen(true);
    }
  }, [triggerAddDialog]);

  const handleAddExpense = async () => {
    if (!selectedCategory || !amount || !date) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }
    if (expenseType === 'employee' && !selectedEmployee) {
      toast.error("Çalışan masrafı için çalışan seçimi zorunludur");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');

      let totalRecurringCount = 1;
      if (isRecurring && recurrenceType) {
        const tempInstances = generateRecurringExpenses(date, {
          recurrence_type: recurrenceType,
          recurrence_end_date: recurrenceEndDate ? recurrenceEndDate : undefined,
          recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : undefined,
          recurrence_day_of_month: recurrenceType === 'monthly' ? recurrenceDayOfMonth : undefined,
        });
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

      // Eğer ödeme yapıldıysa ve ödeme hesabı seçildiyse, ilgili transaction tablosuna işlem ekle
      if (isPaid && paymentAccountType && paymentAccountId && insertedExpense) {
        const expenseAmount = parseFloat(amount);
        const transactionDate = isPaid && paidDate ? format(paidDate, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');
        // Masraf açıklaması boşsa sadece "Masraf" göster, ID gösterme
        const transactionDescription = description || "Masraf";
        
        let transactionError = null;
        
        switch (paymentAccountType) {
          case 'cash':
            const { error: cashError } = await supabase
              .from('cash_transactions')
              .insert({
                account_id: paymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === selectedCategory)?.name || 'Genel',
                reference: `EXP-${insertedExpense.id}`,
                transaction_date: transactionDate,
                company_id: profile.company_id
              });
            transactionError = cashError;
            if (!cashError) {
              await supabase.rpc('update_cash_account_balance', {
                p_account_id: paymentAccountId,
                p_amount: expenseAmount,
                p_type: 'expense'
              });
            }
            break;
            
          case 'bank':
            const { error: bankError } = await supabase
              .from('bank_transactions')
              .insert({
                account_id: paymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === selectedCategory)?.name || 'Genel',
                reference: `EXP-${insertedExpense.id}`,
                transaction_date: transactionDate,
                company_id: profile.company_id
              });
            transactionError = bankError;
            if (!bankError) {
              await supabase.rpc('update_bank_account_balance', {
                account_id: paymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
            
          case 'credit_card':
            const { error: cardError } = await supabase
              .from('card_transactions')
              .insert({
                card_id: paymentAccountId,
                amount: expenseAmount,
                transaction_type: 'purchase',
                description: transactionDescription,
                merchant_category: categories.find(c => c.id === selectedCategory)?.name || 'Genel',
                reference_number: `EXP-${insertedExpense.id}`,
                transaction_date: transactionDate,
                currency: 'TRY',
                company_id: profile.company_id
              });
            transactionError = cardError;
            if (!cardError) {
              await supabase.rpc('update_credit_card_balance', {
                card_id: paymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
            
          case 'partner':
            const { error: partnerError } = await supabase
              .from('partner_transactions')
              .insert({
                partner_id: paymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === selectedCategory)?.name || 'Genel',
                reference: `EXP-${insertedExpense.id}`,
                transaction_date: transactionDate,
                company_id: profile.company_id
              });
            transactionError = partnerError;
            if (!partnerError) {
              await supabase.rpc('update_partner_account_balance', {
                account_id: paymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
        }
        
        if (transactionError) {
          console.error('Error adding transaction to payment account:', transactionError);
          // Transaction hatası olsa bile masraf kaydedildi, sadece uyarı ver
          toast.error("Masraf kaydedildi ancak ödeme hesabına işlem eklenirken hata oluştu");
        }
      }

      // Create recurring instances if needed
      if (isRecurring && recurrenceType && insertedExpense && totalRecurringCount > 1) {
        const instances = generateRecurringExpenses(date, {
          recurrence_type: recurrenceType,
          recurrence_end_date: recurrenceEndDate ? recurrenceEndDate : undefined,
          recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : undefined,
          recurrence_day_of_month: recurrenceType === 'monthly' ? recurrenceDayOfMonth : undefined,
        });
        const futureInstances = instances.slice(1);
        if (futureInstances.length > 0) {
          const expensesToInsert = futureInstances.map((instance, index) => ({
            type: 'expense',
            amount: parseFloat(amount),
            vat_rate: parseFloat(vatRate),
            category_id: selectedCategory,
            subcategory: subcategory || null,
            description: description ? `${description} (${index + 2}/${instances.length})` : `(${index + 2}/${instances.length})`,
            date: format(instance.date, 'yyyy-MM-dd'),
            expense_type: expenseType,
            employee_id: expenseType === 'employee' ? selectedEmployee : null,
            is_paid: false,
            paid_date: null,
            is_recurring: false,
            is_recurring_instance: true,
            parent_expense_id: insertedExpense.id,
            company_id: profile.company_id
          }));
          await supabase.from('expenses').insert(expensesToInsert);
        }
      }

      toast.success("Masraf başarıyla eklendi");
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error("Masraf eklenirken bir hata oluştu");
    }
  };

  const resetForm = () => {
    setSelectedCategory("");
    setSelectedCategoryOption("");
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
  };

  const handleDeleteClick = (expense: ExpenseItem) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = useCallback((expense: ExpenseItem) => {
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
    if (expense.category_id) {
      setEditSelectedCategoryOption(`cat:${expense.category_id}`);
    } else if (expense.category?.id) {
      setEditSelectedCategoryOption(`cat:${expense.category.id}`);
    } else {
      setEditSelectedCategoryOption("");
    }
    setEditSubcategory(expense.subcategory || "");
    setEditVatRate('0');
    setIsEditSheetOpen(true);
  }, []);

  // Query parametresinden expenseId'yi oku ve ilgili masrafı seç
  useEffect(() => {
    const expenseId = searchParams.get('expenseId');
    if (expenseId && expenses.length > 0) {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        handleEditClick(expense);
        // Query parametresini temizle
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, expenses, handleEditClick, setSearchParams]);

  const handleEditCategoryOptionChange = (option: string) => {
    setEditSelectedCategoryOption(option);
    if (option.startsWith('sub:')) {
      const sub = subcategoriesList.find(s => s.id === option.slice(4));
      if (sub) setEditSubcategory(sub.name);
    } else {
      setEditSubcategory("");
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !editAmount || parseFloat(editAmount) <= 0) {
      toast.error("Lütfen geçerli bir tutar girin");
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');

      let categoryId = editingExpense.category_id;
      if (editSelectedCategoryOption.startsWith('cat:')) {
        categoryId = editSelectedCategoryOption.slice(4);
      } else if (editSelectedCategoryOption.startsWith('sub:')) {
        const sub = subcategoriesList.find(s => s.id === editSelectedCategoryOption.slice(4));
        if (sub) categoryId = sub.category_id;
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(editAmount),
          date: format(editDate, 'yyyy-MM-dd'),
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
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      // Eğer ödeme durumu değiştiyse ve ödeme yapıldıysa, ödeme hesabına işlem ekle
      const wasPaidBefore = editingExpense.is_paid;
      if (editIsPaid && !wasPaidBefore && editPaymentAccountType && editPaymentAccountId) {
        const expenseAmount = parseFloat(editAmount);
        const transactionDate = editIsPaid && editPaidDate ? format(editPaidDate, 'yyyy-MM-dd') : format(editDate, 'yyyy-MM-dd');
        // Masraf açıklaması boşsa sadece "Masraf" göster, ID gösterme
        const transactionDescription = editDescription || "Masraf";
        
        let transactionError = null;
        
        switch (editPaymentAccountType) {
          case 'cash':
            const { error: cashError } = await supabase
              .from('cash_transactions')
              .insert({
                account_id: editPaymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === categoryId)?.name || 'Genel',
                reference: `EXP-${editingExpense.id}`,
                transaction_date: transactionDate,
                company_id: editingExpense.company_id || profile?.company_id
              });
            transactionError = cashError;
            if (!cashError) {
              await supabase.rpc('update_cash_account_balance', {
                p_account_id: editPaymentAccountId,
                p_amount: expenseAmount,
                p_type: 'expense'
              });
            }
            break;
            
          case 'bank':
            const { error: bankError } = await supabase
              .from('bank_transactions')
              .insert({
                account_id: editPaymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === categoryId)?.name || 'Genel',
                reference: `EXP-${editingExpense.id}`,
                transaction_date: transactionDate,
                company_id: editingExpense.company_id || profile?.company_id
              });
            transactionError = bankError;
            if (!bankError) {
              await supabase.rpc('update_bank_account_balance', {
                account_id: editPaymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
            
          case 'credit_card':
            const { error: cardError } = await supabase
              .from('card_transactions')
              .insert({
                card_id: editPaymentAccountId,
                amount: expenseAmount,
                transaction_type: 'purchase',
                description: transactionDescription,
                merchant_category: categories.find(c => c.id === categoryId)?.name || 'Genel',
                reference_number: `EXP-${editingExpense.id}`,
                transaction_date: transactionDate,
                currency: 'TRY',
                company_id: editingExpense.company_id || profile?.company_id
              });
            transactionError = cardError;
            if (!cardError) {
              await supabase.rpc('update_credit_card_balance', {
                card_id: editPaymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
            
          case 'partner':
            const { error: partnerError } = await supabase
              .from('partner_transactions')
              .insert({
                partner_id: editPaymentAccountId,
                amount: expenseAmount,
                type: 'expense',
                description: transactionDescription,
                category: categories.find(c => c.id === categoryId)?.name || 'Genel',
                reference: `EXP-${editingExpense.id}`,
                transaction_date: transactionDate,
                company_id: editingExpense.company_id || profile?.company_id
              });
            transactionError = partnerError;
            if (!partnerError) {
              await supabase.rpc('update_partner_account_balance', {
                account_id: editPaymentAccountId,
                amount: expenseAmount,
                transaction_type: 'expense'
              });
            }
            break;
        }
        
        if (transactionError) {
          console.error('Error adding transaction to payment account:', transactionError);
          toast.error("Masraf güncellendi ancak ödeme hesabına işlem eklenirken hata oluştu");
        }
      }

      toast.success("Masraf başarıyla güncellendi");
      setIsEditSheetOpen(false);
      setEditingExpense(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error("Masraf güncellenirken bir hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseToDelete.id);
      if (error) throw error;
      toast.success("Masraf başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error("Masraf silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expenses.filter(expense => {
      const matchesSearch = searchQuery === '' || 
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.employee && `${expense.employee.first_name} ${expense.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));
      if (filterType !== 'all' && expense.expense_type !== filterType) return false;
      if (filterEmployee !== 'all' && expense.employee_id !== filterEmployee) return false;
      if (filterCategory !== 'all' && (expense.category as any)?.id !== filterCategory) return false;
      
      // Payment status filter
      if (paymentStatusFilter !== 'all') {
        if (paymentStatusFilter === 'paid') {
          if (!expense.is_paid) return false;
        } else {
          if (expense.is_paid) return false;
          const expenseDate = new Date(expense.date);
          expenseDate.setHours(0, 0, 0, 0);
          if (paymentStatusFilter === 'overdue' && expenseDate >= today) return false;
          if (paymentStatusFilter === 'pending' && expenseDate < today) return false;
        }
      }
      
      return matchesSearch;
    });
  }, [expenses, searchQuery, filterType, filterEmployee, filterCategory, paymentStatusFilter]);

  const totalAmount = useMemo(() => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [filteredExpenses]);

  useEffect(() => {
    if (onTotalAmountChange) onTotalAmountChange(totalAmount);
  }, [totalAmount, onTotalAmountChange]);

  // Selection handlers
  const handleSelectExpense = useCallback((expense: ExpenseItem) => {
    setSelectedExpenses(prev => {
      const isSelected = prev.some(e => e.id === expense.id);
      return isSelected ? prev.filter(e => e.id !== expense.id) : [...prev, expense];
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedExpenses(checked ? filteredExpenses : []);
    setIsAllSelected(checked);
  }, [filteredExpenses]);

  const handleClearSelection = useCallback(() => {
    setSelectedExpenses([]);
    setIsAllSelected(false);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedExpenses.length === 0) return;
    if (action === 'delete') {
      try {
        const { error } = await supabase.from('expenses').delete().in('id', selectedExpenses.map(e => e.id));
        if (error) throw error;
        toast.success(`${selectedExpenses.length} işlem başarıyla silindi`);
        setSelectedExpenses([]);
        setIsAllSelected(false);
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      } catch (error) {
        toast.error("İşlemler silinirken bir hata oluştu");
      }
    }
  }, [selectedExpenses, toast, queryClient]);

  useEffect(() => {
    setIsAllSelected(filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length);
  }, [selectedExpenses, filteredExpenses]);

  const getAccountName = useCallback((accountType: string, accountId: string) => {
    if (!accountType || !accountId) return '-';
    switch (accountType) {
      case 'cash': return cashAccounts.find(acc => acc.id === accountId)?.label || '-';
      case 'bank': return bankAccounts.find(acc => acc.id === accountId)?.label || '-';
      case 'credit_card': return creditCards.find(acc => acc.id === accountId)?.label || '-';
      case 'partner': return partnerAccounts.find(acc => acc.id === accountId)?.label || '-';
      default: return '-';
    }
  }, [cashAccounts, bankAccounts, creditCards, partnerAccounts]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <ExpensesPageHeader
        expenses={filteredExpenses}
        startDate={startDate}
        endDate={endDate}
        onCreateExpense={() => setIsAddDialogOpen(true)}
        onNavigateCategories={() => navigate('/budget/categories')}
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

      {/* Bulk Actions & Summary */}
      <ExpensesBulkActions
        selectedExpenses={selectedExpenses}
        allExpenses={expenses}
        totalAmount={totalAmount}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        activeTab={paymentStatusFilter}
        onTabChange={setPaymentStatusFilter}
      />

      {/* Content View - Sadece Liste Görünümü */}
      <ExpensesListView
        expenses={filteredExpenses}
        loading={loading}
        selectedExpenses={selectedExpenses}
        onSelectExpense={handleSelectExpense}
        onSelectAll={() => handleSelectAll(!isAllSelected)}
        isAllSelected={isAllSelected}
        onEditExpense={handleEditClick}
          onDeleteExpense={handleDeleteClick}
          getAccountName={getAccountName}
        />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Masrafı Sil"
        description={`"${expenseToDelete?.description || 'Bu masraf'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setIsDeleteDialogOpen(false); setExpenseToDelete(null); }}
        isLoading={isDeleting}
      />

      {/* Add Dialog */}
      <UnifiedDialog
        isOpen={isAddDialogOpen}
        onClose={(isOpen) => !isOpen && setIsAddDialogOpen(false)}
        title="Yeni Masraf Ekle"
        maxWidth="xl"
        headerColor="red"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tarih <span className="text-red-500">*</span></Label>
                <EnhancedDatePicker date={date} onSelect={(d) => d && setDate(d)} placeholder="Tarih seçin" className="w-full h-9" />
              </div>
              <div className="space-y-1">
                <Label>Tutar (₺) <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-9 flex-1" step="0.01" min="0" autoFocus />
                  <Select value={vatRate} onValueChange={setVatRate}>
                    <SelectTrigger className="w-[110px] h-9"><SelectValue placeholder="KDV" /></SelectTrigger>
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
                    <Switch checked={expenseType === 'company'} onCheckedChange={(checked) => setExpenseType(checked ? 'company' : 'employee')} />
                    <Label className="text-sm font-normal cursor-pointer">Şirket</Label>
                  </div>
                </div>
                <EmployeeSelector value={selectedEmployee} onChange={setSelectedEmployee} error="" label="" placeholder={expenseType === 'company' ? "Şirket masrafı" : "Çalışan seçin..."} triggerClassName="h-9" disabled={expenseType === 'company'} />
              </div>
              <div className="space-y-2">
                <Label>Kategori <span className="text-red-500">*</span></Label>
                <CategorySelector value={selectedCategoryOption} onChange={handleCategoryOptionChange} categories={categories} subcategories={subcategoriesList} showLabel={false} placeholder="Kategori seçin" triggerClassName="h-9" className="mt-2" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-700">Ödeme Durumu</h3>
                <div className="flex items-center space-x-2">
                  <Switch checked={isPaid} onCheckedChange={(v) => setIsPaid(!!v)} />
                  <Label className="text-sm font-normal cursor-pointer">Ödendi</Label>
                </div>
              </div>
              {isPaid && (
                <>
                  <div className="space-y-1">
                    <Label>Ödeme Tarihi</Label>
                    <EnhancedDatePicker date={paidDate || undefined} onSelect={(d) => setPaidDate(d || null)} placeholder="Tarih seçin" className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <Label>Hesap Türü</Label>
                    <Select value={paymentAccountType} onValueChange={(val: any) => { setPaymentAccountType(val); setPaymentAccountId(''); }}>
                      <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Hesap türü seçin" /></SelectTrigger>
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
                      <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Hesap seçin" /></SelectTrigger>
                      <SelectContent>
                        {paymentAccountType === 'cash' && cashAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {paymentAccountType === 'bank' && bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {paymentAccountType === 'credit_card' && creditCards.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {paymentAccountType === 'partner' && partnerAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-gray-700">Tekrarlanan Masraf</h3>
              <div className="flex items-center space-x-2">
                <Switch checked={isRecurring} onCheckedChange={(v) => {
                  setIsRecurring(!!v);
                  if (v) {
                    const oneYearLater = new Date(date);
                    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                    setRecurrenceEndDate(oneYearLater);
                  }
                }} />
                <Label className="text-sm font-normal cursor-pointer">Aktif</Label>
              </div>
            </div>
            {isRecurring && (
              <>
                <div className="space-y-1">
                  <Label>Tekrarlama Sıklığı</Label>
                  <Select value={recurrenceType} onValueChange={(val: any) => setRecurrenceType(val)}>
                    <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Sıklık seçin" /></SelectTrigger>
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
                        <Button key={idx} type="button" size="sm" variant={recurrenceDays[0] === String(idx + 1) ? "default" : "outline"} className="h-8 text-xs" onClick={() => setRecurrenceDays(prev => prev[0] === String(idx + 1) ? [] : [String(idx + 1)])}>{day}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {recurrenceType === 'monthly' && (
                  <div className="space-y-1">
                    <Label>Ayın Günü</Label>
                    <Input type="number" value={recurrenceDayOfMonth} onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)} min="1" max="31" className="w-20 h-9" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Bitiş Tarihi</Label>
                  <EnhancedDatePicker date={recurrenceEndDate || undefined} onSelect={(d) => setRecurrenceEndDate(d || null)} placeholder="Seçmezseniz süresiz" className="w-full" />
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masraf açıklaması" rows={2} />
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

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-red-600">Masraf Düzenle</SheetTitle>
            <SheetDescription>Masraf bilgilerini düzenleyin ve kaydedin</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Tarih <span className="text-red-500">*</span></Label>
                  <EnhancedDatePicker date={editDate} onSelect={(d) => d && setEditDate(d)} placeholder="Tarih seçin" className="w-full h-9" />
                </div>
                <div className="space-y-1">
                  <Label>Tutar (₺) <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="0.00" className="h-9 flex-1" step="0.01" min="0" />
                    <Select value={editVatRate} onValueChange={setEditVatRate}>
                      <SelectTrigger className="w-[110px] h-9"><SelectValue placeholder="KDV" /></SelectTrigger>
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
                      <Switch checked={editExpenseType === 'company'} onCheckedChange={(checked) => setEditExpenseType(checked ? 'company' : 'employee')} />
                      <Label className="text-sm font-normal cursor-pointer">Şirket</Label>
                    </div>
                  </div>
                  <EmployeeSelector value={editSelectedEmployee} onChange={setEditSelectedEmployee} error="" label="" placeholder={editExpenseType === 'company' ? "Şirket masrafı" : "Çalışan seçin..."} triggerClassName="h-9" disabled={editExpenseType === 'company'} />
                </div>
                <div className="space-y-2">
                  <Label>Kategori <span className="text-red-500">*</span></Label>
                  <CategorySelector value={editSelectedCategoryOption} onChange={handleEditCategoryOptionChange} categories={categories} subcategories={subcategoriesList} showLabel={false} placeholder="Kategori seçin" triggerClassName="h-9" className="mt-2" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Açıklama</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Masraf açıklaması..." className="min-h-[80px]" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-700">Ödeme Durumu</h3>
                <div className="flex items-center space-x-2">
                  <Switch checked={editIsPaid} onCheckedChange={(v) => setEditIsPaid(!!v)} />
                  <Label className="text-sm font-normal cursor-pointer">Ödendi</Label>
                </div>
              </div>
              {editIsPaid && (
                <>
                  <div className="space-y-1">
                    <Label>Ödeme Tarihi</Label>
                    <EnhancedDatePicker date={editPaidDate || undefined} onSelect={(d) => setEditPaidDate(d || null)} placeholder="Tarih seçin" className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <Label>Hesap Türü</Label>
                    <Select value={editPaymentAccountType} onValueChange={(val: any) => { setEditPaymentAccountType(val); setEditPaymentAccountId(''); }}>
                      <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Hesap türü seçin" /></SelectTrigger>
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
                      <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Hesap seçin" /></SelectTrigger>
                      <SelectContent>
                        {editPaymentAccountType === 'cash' && cashAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {editPaymentAccountType === 'bank' && bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {editPaymentAccountType === 'credit_card' && creditCards.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                        {editPaymentAccountType === 'partner' && partnerAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditSheetOpen(false)} disabled={isUpdating}>İptal</Button>
            <Button onClick={handleUpdateExpense} disabled={isUpdating} className="bg-red-600 hover:bg-red-700">{isUpdating ? 'Güncelleniyor...' : 'Kaydet'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
});

ExpensesManager.displayName = 'ExpensesManager';

export default ExpensesManager;
