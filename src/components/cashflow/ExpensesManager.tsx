import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Wallet, FileText, Search, Filter, User, Tag } from "lucide-react";
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
}

const EXPENSE_CATEGORIES = [
  "Personel Giderleri",
  "Operasyonel Giderler", 
  "Ofis Giderleri",
  "Pazarlama & Satış",
  "Finansman Giderleri",
  "Genel Giderler",
  "Seyahat Giderleri"
];

const ExpensesManager = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [expenseType, setExpenseType] = useState<'company' | 'employee'>('company');
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employees, setEmployees] = useState<Array<{id: string, first_name: string, last_name: string, department: string}>>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'employee'>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();

  // Fetch employees data
  const fetchEmployees = async () => {
    try {
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

  useEffect(() => {
    fetchEmployees();
    fetchCategories();
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
      // Find category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('cashflow_categories')
        .select('id')
        .eq('name', selectedCategory)
        .eq('type', 'expense')
        .single();

      if (categoryError || !categoryData) {
        throw new Error("Kategori bulunamadı");
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          type: 'expense',
          amount: parseFloat(amount),
          category_id: categoryData.id,
          description: description,
          date: format(date, 'yyyy-MM-dd'),
          expense_type: expenseType,
          employee_id: expenseType === 'employee' ? selectedEmployee : null
        });

      if (error) throw error;

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
    if (filterCategory !== 'all' && expense.category?.name !== filterCategory) {
      return false;
    }
    
    return matchesSearch;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-semibold text-gray-900">Masraf Yönetimi</h2>
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
            Gelir-Gider Kategorileri
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Masraf
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Masraf Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expenseType">Masraf Türü</Label>
                  <Select value={expenseType} onValueChange={(value: 'company' | 'employee') => setExpenseType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">🏢 Şirket Masrafı</SelectItem>
                      <SelectItem value="employee">👤 Çalışan Masrafı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {expenseType === 'employee' && (
                  <div>
                    <Label htmlFor="employee">Çalışan</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Çalışan seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name} - {employee.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subcategory">Alt Kategori</Label>
                  <Input
                    id="subcategory"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Alt kategori girin"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Tutar (₺)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Tarih</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'dd MMMM yyyy', { locale: tr }) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masraf açıklaması"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleAddExpense}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            <SelectItem value="company">🏢 Şirket</SelectItem>
            <SelectItem value="employee">👤 Çalışan</SelectItem>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-32 justify-start text-left font-normal text-xs">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, 'dd MMM', { locale: tr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(newDate) => newDate && setStartDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">-</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-32 justify-start text-left font-normal text-xs">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, 'dd MMM', { locale: tr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(newDate) => newDate && setEndDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
                <TableHead>Kategori</TableHead>
                <TableHead>Alt Kategori</TableHead>
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
                      {expense.expense_type === 'company' ? '🏢 Şirket' : '👤 Çalışan'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.employee ? 
                      `${expense.employee.first_name} ${expense.employee.last_name}` : 
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category?.name || 'Bilinmeyen'}</Badge>
                  </TableCell>
                  <TableCell>{expense.subcategory || "-"}</TableCell>
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
    </div>
  );
};

export default ExpensesManager;