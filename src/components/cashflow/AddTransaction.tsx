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
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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
      console.error('Failed to create transaction:', error);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type */}
            <div className="space-y-3">
              <Label>Transaction Type</Label>
              <RadioGroup
                value={transactionType}
                onValueChange={(value: 'income' | 'expense') => setValue('type', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="text-green-600 font-medium">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="text-red-600 font-medium">Expense</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
              </div>
              {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => setValue('category_id', value)}
                {...register('category_id', { required: 'Category is required' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: tr }) : "Select date"}
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter transaction description..."
                rows={3}
                {...register('description')}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Receipt/Invoice (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {selectedFile || attachmentUrl ? (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">
                      {selectedFile?.name || 'Uploaded file'}
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
                          Upload a file
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
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
              {isSubmitting || uploading ? 'Creating Transaction...' : 'Create Transaction'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTransaction;