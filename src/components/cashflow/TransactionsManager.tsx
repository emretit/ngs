import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CalendarIcon, 
  Upload, 
  X, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useCashflowTransactions, CreateTransactionData } from "@/hooks/useCashflowTransactions";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useCashflowAnalytics } from "@/hooks/useCashflowAnalytics";
import { useFileUpload } from "@/hooks/useFileUpload";

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  date: Date;
  description: string;
}

const TransactionsManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  const { transactions, loading, createTransaction, deleteTransaction } = useCashflowTransactions();
  const { categories } = useCashflowCategories();
  const { formatCurrency } = useCashflowAnalytics(transactions);
  const { uploadFile, uploading } = useFileUpload();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      date: new Date(),
      description: '',
    }
  });

  const transactionType = watch('type');
  const selectedDate = watch('date');

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    const matchesCategory = categoryFilter === "all" || transaction.category_id === categoryFilter;
    
    const transactionDate = new Date(transaction.date);
    const matchesDateFrom = !dateFrom || transactionDate >= dateFrom;
    const matchesDateTo = !dateTo || transactionDate <= dateTo;
    
    return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  // Calculate filtered totals
  const filteredSummary = {
    totalIncome: filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  };
  const netAmount = filteredSummary.totalIncome - filteredSummary.totalExpenses;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setAttachmentUrl(null);
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      let fileUrl = attachmentUrl;
      
      // Upload file if selected
      if (selectedFile && !attachmentUrl) {
        fileUrl = await uploadFile(selectedFile, 'receipts');
        setAttachmentUrl(fileUrl);
      }

      const transactionData: CreateTransactionData = {
        type: data.type,
        amount: parseFloat(data.amount),
        category_id: data.category_id,
        date: format(data.date, 'yyyy-MM-dd'),
        description: data.description || undefined,
        attachment_url: fileUrl || undefined,
      };

      await createTransaction(transactionData);
      
      // Reset form
      reset({
        type: 'expense',
        date: new Date(),
        description: '',
        amount: '',
        category_id: '',
      });
      setSelectedFile(null);
      setAttachmentUrl(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      await deleteTransaction(id);
    }
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
  };



  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>İşlemler</CardTitle>
            <Button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Yeni İşlem Ekle
              {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isFormOpen && (
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Type */}
                <div className="space-y-3">
                  <Label>İşlem Türü</Label>
                  <RadioGroup
                    value={transactionType}
                    onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income" className="text-green-600 font-medium">Gelir</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="expense" />
                      <Label htmlFor="expense" className="text-red-600 font-medium">Gider</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Tutar</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-8"
                      {...register('amount', { 
                        required: 'Tutar gereklidir',
                        min: { value: 0.01, message: 'Tutar 0\'dan büyük olmalıdır' }
                      })}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                  </div>
                  {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    onValueChange={(value) => setValue('category_id', value)}
                    {...register('category_id', { required: 'Kategori gereklidir' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && <p className="text-sm text-red-600">{errors.category_id.message}</p>}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: tr }) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setValue('date', date)}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
                <Textarea
                  id="description"
                  placeholder="İşlem açıklaması girin..."
                  rows={2}
                  {...register('description')}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Fiş/Fatura (İsteğe Bağlı)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {selectedFile || attachmentUrl ? (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">
                        {selectedFile?.name || 'Yüklenen dosya'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="block text-sm font-medium text-gray-900">
                            Dosya yükle
                          </span>
                          <span className="block text-xs text-gray-500">
                            PNG, JPG, PDF 10MB'a kadar
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={handleFileSelect}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isSubmitting || uploading}
                >
                  {isSubmitting || uploading ? 'İşlem Oluşturuluyor...' : 'İşlem Oluştur'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="İşlem ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="income">Gelir</SelectItem>
                <SelectItem value="expense">Gider</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tüm Kategoriler" />
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

            {/* Date Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PP", { locale: tr }) : "Başlangıç"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  locale={tr}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateTo ? format(dateTo, "PP", { locale: tr }) : "Bitiş"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  locale={tr}
                />
              </PopoverContent>
            </Popover>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Filtrelenmiş Gelir</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(filteredSummary.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Filtrelenmiş Gider</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(filteredSummary.totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Tutar</p>
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netAmount)}
                </p>
              </div>
              <div className="text-gray-600">
                {filteredTransactions.length} işlem
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Ek</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.category?.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.attachment_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={transaction.attachment_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Hiçbir işlem bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsManager;