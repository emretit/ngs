import { useState } from "react";
import { format } from "date-fns";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Upload, X } from "lucide-react";
import { useCashflowTransactions, CreateTransactionData } from "@/hooks/useCashflowTransactions";
import { useCashflowCategories } from "@/hooks/useCashflowCategories";
import { useFileUpload } from "@/hooks/useFileUpload";

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  date: Date;
  description: string;
}

const AddTransaction = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  
  const { createTransaction } = useCashflowTransactions();
  const { categories } = useCashflowCategories();
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
    } catch (error) {
      logger.error('Failed to create transaction:', error);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Yeni İşlem Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <Label htmlFor="expense" className="text-red-600 font-medium">Masraf</Label>
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
              <EnhancedDatePicker
                date={selectedDate}
                onSelect={(date) => date && setValue('date', date)}
                placeholder="Tarih seçin"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
              <Textarea
                id="description"
                placeholder="İşlem açıklaması girin..."
                rows={3}
                {...register('description')}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Fiş/Fatura (İsteğe Bağlı)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Dosya yükle
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || uploading}
            >
              {isSubmitting || uploading ? 'İşlem Oluşturuluyor...' : 'İşlem Oluştur'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTransaction;