import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Wallet, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ExpenseItem {
  id: string;
  amount: number;
  category_id: string;
  date: string;
  description: string | null;
  attachment_url: string | null;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
  };
  subcategory?: string;
}

const EXPENSE_CATEGORIES = [
  {
    name: "Personel Giderleri",
    subcategories: ["Net Maaşlar", "SGK İşveren Payı", "İşsizlik Sigortası", "İş Kazası Sigortası", "Yemek Yardımı", "Ulaşım Yardımı"]
  },
  {
    name: "Operasyonel Giderler",
    subcategories: ["Kira", "Elektrik", "Su", "Doğalgaz", "İnternet", "Telefon", "Temizlik", "Güvenlik", "Bakım"]
  },
  {
    name: "Ofis Giderleri", 
    subcategories: ["Ofis Malzemeleri", "Kırtasiye", "Mobilya", "Teknik Ekipman", "Aidat"]
  },
  {
    name: "Pazarlama & Satış",
    subcategories: ["Reklam", "Promosyon", "Etkinlik", "Satış Komisyonu", "Sosyal Medya"]
  },
  {
    name: "Finansman Giderleri",
    subcategories: ["Kredi Faizleri", "Kart Komisyonları", "Banka Masrafları", "Kambiyo Giderleri", "Faktoring Giderleri", "Leasing Giderleri", "Diğer Finansman Giderleri"]
  },
  {
    name: "Genel Giderler",
    subcategories: ["Danışmanlık", "Hukuki Giderler", "Sigorta", "Vergiler", "Yasal Giderler", "Diğer"]
  },
  {
    name: "Seyahat Giderleri",
    subcategories: ["Uçak Bileti", "Otel", "Yemek", "Ulaşım", "Diğer Seyahat"]
  }
];

const ExpensesManager = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch expenses data
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Fetch from cashflow_transactions with category join
      const { data: transactionData, error: transactionError } = await supabase
        .from('cashflow_transactions')
        .select(`
          *,
          category:cashflow_categories(name)
        `)
        .eq('type', 'expense')
        .gte('date', `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`)
        .lt('date', `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`)
        .order('date', { ascending: false });

      if (transactionError) throw transactionError;

      // For each transaction, get subcategory from opex_matrix
      const enrichedExpenses = await Promise.all(
        ((transactionData as any) || []).map(async (expense: any) => {
          const { data: opexData } = await supabase
            .from('opex_matrix')
            .select('subcategory')
            .eq('year', new Date(expense.date).getFullYear())
            .eq('month', new Date(expense.date).getMonth() + 1)
            .eq('category', expense.category?.name || '')
            .eq('amount', expense.amount)
            .eq('user_id', expense.user_id)
            .single();

          return {
            ...expense,
            subcategory: (opexData as any)?.subcategory || null
          };
        })
      );

      setExpenses(enrichedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Masraf verileri yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `expenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cashflow-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('cashflow-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Add new expense
  const handleAddExpense = async () => {
    if (!selectedCategory || !amount || !date) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen gerekli alanları doldurun",
      });
      return;
    }

    try {
      setLoading(true);
      
      const adminUserId = '3efe360b-98fd-4718-9fb5-f65e4ad408a9'; // Admin user ID
      
      let attachmentUrl = null;
      if (selectedFile) {
        attachmentUrl = await handleFileUpload(selectedFile);
      }

      // First get the category ID or create if doesn't exist
      let categoryId = null;
      const { data: existingCategory } = await supabase
        .from('cashflow_categories')
        .select('id')
        .eq('name', selectedCategory)
        .eq('type', 'expense')
        .single();

        if (existingCategory) {
        categoryId = (existingCategory as any).id;
      } else {
        const { data: newCategory, error: categoryError } = await supabase
          .from('cashflow_categories')
          .insert({
            name: selectedCategory,
            type: 'expense',
            user_id: adminUserId
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = (newCategory as any).id;
      }

      // Add to cashflow_transactions
      const { error: transactionError } = await supabase
        .from('cashflow_transactions')
        .insert({
          amount: parseFloat(amount),
          category_id: categoryId,
          type: 'expense',
          date: format(date, 'yyyy-MM-dd'),
          description: description || null,
          attachment_url: attachmentUrl,
          user_id: adminUserId,
        });

      if (transactionError) throw transactionError;

      // Also add to opex_matrix for reporting
      const { error: opexError } = await supabase
        .from('opex_matrix')
        .insert({
          user_id: adminUserId,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          category: selectedCategory,
          subcategory: selectedSubcategory || null,
          amount: parseFloat(amount),
          description: description || null,
          attachment_url: attachmentUrl,
        });

      if (opexError) throw opexError;

      toast({
        title: "Başarılı",
        description: "Masraf başarıyla eklendi",
      });

      // Reset form
      setSelectedCategory("");
      setSelectedSubcategory("");
      setAmount("");
      setDescription("");
      setDate(new Date());
      setSelectedFile(null);
      setIsAddDialogOpen(false);
      
      // Refresh data
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Masraf eklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cashflow_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Masraf silindi",
      });

      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Masraf silinirken hata oluştu",
      });
    }
  };

  // Calculate total expenses
  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get subcategories for selected category
  const getSubcategories = () => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.name === selectedCategory);
    return category?.subcategories || [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Masraf Yönetimi
            </span>
            <div className="flex items-center gap-4">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMMM', { locale: tr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Masraf
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Masraf Ekle</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(category => (
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCategory && (
                      <div className="grid gap-2">
                        <Label htmlFor="subcategory">Alt Kategori</Label>
                        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Alt kategori seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubcategories().map(subcategory => (
                              <SelectItem key={subcategory} value={subcategory}>
                                {subcategory}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="amount">Tutar</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="date">Tarih</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(date, 'dd MMMM yyyy', { locale: tr })}
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

                    <div className="grid gap-2">
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        placeholder="Masraf açıklaması..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="file">Dosya Ekle</Label>
                      <Input
                        id="file"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleAddExpense} disabled={loading}>
                      Ekle
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Toplam Masraf:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(getTotalExpenses())}
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Alt Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead>Ek</TableHead>
                    <TableHead className="text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Bu dönem için masraf kaydı bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.date), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {expense.category?.name || 'Kategorisiz'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.subcategory || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {expense.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          {expense.attachment_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={expense.attachment_url} target="_blank" rel="noopener noreferrer">
                                <Upload className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesManager;