import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useExpenseRequests } from "@/hooks/useExpenseRequests";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory } from "@/types/expense";

const expenseSchema = z.object({
  expense_date: z.date({
    required_error: "Tarih seçilmelidir",
  }),
  category: z.enum(["travel", "meals", "supplies", "other"]),
  description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
  amount: z.number().min(0.01, "Tutar 0'dan büyük olmalıdır"),
  currency: z.string().default("TRY"),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ExpenseRequestForm: React.FC<ExpenseRequestFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { createExpense, submitExpense } = useExpenseRequests();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date(),
      category: "other",
      currency: "TRY",
      amount: 0,
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setReceiptFile(null);
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `expense-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("expenses")
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("expenses")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      logger.error("Dosya yükleme hatası:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      let receiptUrl: string | null = null;

      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      const expenseData = {
        ...values,
        expense_date: format(values.expense_date, "yyyy-MM-dd"),
        receipt_url: receiptUrl,
        requester_id: user?.id,
        status: "draft" as const,
      };

      createExpense(expenseData, {
        onSuccess: async (data) => {
          // Otomatik olarak submit et
          if (data?.id) {
            submitExpense(data.id, {
              onSuccess: () => {
                form.reset();
                setReceiptFile(null);
                onSuccess?.();
              },
            });
          }
        },
      });
    } catch (error) {
      logger.error("Harcama talebi oluşturma hatası:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="expense_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Harcama Tarihi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="travel">Seyahat</SelectItem>
                  <SelectItem value="meals">Yemek</SelectItem>
                  <SelectItem value="supplies">Malzeme</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Harcama açıklaması..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tutar</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ek notlar..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Fiş/Fatura (Opsiyonel)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {receiptFile ? (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm truncate">{receiptFile.name}</span>
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
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Dosya yükle
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, PDF 10MB'a kadar
                  </span>
                </label>
                <input
                  id="receipt-upload"
                  type="file"
                  className="sr-only"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1"
            disabled={uploading || form.formState.isSubmitting}
          >
            {uploading || form.formState.isSubmitting ? "Gönderiliyor..." : "Gönder"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading || form.formState.isSubmitting}
            >
              İptal
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

