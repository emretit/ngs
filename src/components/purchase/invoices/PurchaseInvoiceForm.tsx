
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Receipt, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "../constants";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { PurchaseInvoice } from "@/types/purchase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CategorySelect } from "@/components/budget/CategorySelect";

interface PurchaseInvoiceFormProps {
  poId: string;
  supplierId: string;
}

const formSchema = z.object({
  invoice_number: z.string().min(1, "Fatura numarası zorunludur"),
  invoice_date: z.string().min(1, "Fatura tarihi zorunludur"),
  due_date: z.string().min(1, "Son ödeme tarihi zorunludur"),
  subtotal: z.coerce.number().min(0, "Ara toplam en az 0 olmalıdır"),
  tax_amount: z.coerce.number().min(0, "KDV tutarı en az 0 olmalıdır"),
  total_amount: z.coerce.number().min(0, "Toplam tutar en az 0 olmalıdır"),
  category_id: z.string().optional(),
  notes: z.string().optional(),
});

const PurchaseInvoiceForm: React.FC<PurchaseInvoiceFormProps> = ({ poId, supplierId }) => {
  const { toast } = useToast();
  const { createInvoiceMutation } = usePurchaseInvoices();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      category_id: "",
      notes: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const invoiceData: Partial<PurchaseInvoice> = {
      ...values,
      po_id: poId,
      supplier_id: supplierId,
      currency: "TRY",
      status: "pending",
      paid_amount: 0,
      category_id: values.category_id || null,
    };
    
    createInvoiceMutation.mutate(invoiceData, {
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Fatura başarıyla kaydedildi",
        });
        form.reset();
        setIsExpanded(false);
      },
      onError: (error) => {
        toast({
          title: "Hata",
          description: "Fatura kaydedilirken bir hata oluştu",
          variant: "destructive",
        });
      }
    });
  };
  
  // Calculate total amount when subtotal or tax_amount changes
  const subtotal = form.watch("subtotal");
  const taxAmount = form.watch("tax_amount");
  
  React.useEffect(() => {
    const total = parseFloat(String(subtotal)) + parseFloat(String(taxAmount));
    form.setValue("total_amount", total);
  }, [subtotal, taxAmount, form]);
  
  if (!isExpanded) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Yeni Fatura Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <Button onClick={() => setIsExpanded(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Yeni E-Fatura Ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <span>Yeni Fatura Ekle</span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
            İptal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatura Numarası</FormLabel>
                    <FormControl>
                      <Input placeholder="Fatura numarası giriniz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gider Kategorisi</FormLabel>
                    <FormControl>
                      <CategorySelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Kategori seçiniz"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fatura Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Son Ödeme Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ara Toplam</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tax_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KDV Tutarı</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toplam Tutar</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        readOnly 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Fatura ile ilgili notlar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border border-dashed rounded p-4 text-center">
              <div className="flex items-center justify-center p-4">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Fatura dosyasını buraya sürükleyip bırakın veya
              </p>
              <Button variant="outline" type="button">
                Dosya Seç
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                <Receipt className="h-4 w-4 mr-2" />
                Faturayı Kaydet
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PurchaseInvoiceForm;
