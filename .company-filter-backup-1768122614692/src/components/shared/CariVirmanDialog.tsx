import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const cariVirmanSchema = z.object({
  transaction_type: z.enum(["receiver", "sender"], {
    required_error: "İşlem tipi seçilmelidir",
  }),
  transaction_date: z.date({
    required_error: "İşlem tarihi gereklidir",
  }),
  due_date: z.date({
    required_error: "Vade tarihi gereklidir",
  }),
  other_party_id: z.string().min(1, "Diğer cari seçilmelidir"),
  other_party_type: z.enum(["customer", "supplier"]),
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  description: z.string().optional(),
});

type CariVirmanFormData = z.infer<typeof cariVirmanSchema>;

interface CariVirmanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  supplierId?: string;
  onSaved?: () => void;
}

interface PartnerOption {
  id: string;
  name: string;
  company: string | null;
  type: "customer" | "supplier";
  searchText: string;
}

export default function CariVirmanDialog({
  open,
  onOpenChange,
  customerId,
  supplierId,
  onSaved
}: CariVirmanDialogProps) {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const form = useForm<CariVirmanFormData>({
    resolver: zodResolver(cariVirmanSchema),
    defaultValues: {
      transaction_type: "receiver",
      transaction_date: new Date(),
      due_date: new Date(),
      other_party_id: "",
      other_party_type: "customer",
      amount: 0,
      description: "",
    },
  });

  // Müşteri ve tedarikçileri yükle
  useEffect(() => {
    if (!open || !userData?.company_id) return;

    const loadPartners = async () => {
      const partnerOptions: PartnerOption[] = [];

      // Müşterileri yükle
      let customersQuery = supabase
        .from("customers")
        .select("id, name, company, mobile_phone, office_phone, tax_number")
        .eq("company_id", userData.company_id);

      // Sadece customerId varsa filtrele
      if (customerId) {
        customersQuery = customersQuery.neq("id", customerId);
      }

      const { data: customers } = await customersQuery;

      if (customers) {
        customers.forEach((customer: { id: string; name: string | null; company: string | null; mobile_phone: string | null; office_phone: string | null; tax_number: string | null }) => {
          const phone = customer.mobile_phone || customer.office_phone || "";
          partnerOptions.push({
            id: customer.id,
            name: customer.name || "",
            company: customer.company,
            type: "customer",
            searchText: `${customer.name || ""} ${customer.company || ""} ${phone} ${customer.tax_number || ""}`.toLowerCase(),
          });
        });
      }

      // Tedarikçileri yükle
      let suppliersQuery = supabase
        .from("suppliers")
        .select("id, name, company, mobile_phone, office_phone, tax_number")
        .eq("company_id", userData.company_id);

      // Sadece supplierId varsa filtrele
      if (supplierId) {
        suppliersQuery = suppliersQuery.neq("id", supplierId);
      }

      const { data: suppliers } = await suppliersQuery;

      if (suppliers) {
        suppliers.forEach((supplier: { id: string; name: string | null; company: string | null; mobile_phone: string | null; office_phone: string | null; tax_number: string | null }) => {
          const phone = supplier.mobile_phone || supplier.office_phone || "";
          partnerOptions.push({
            id: supplier.id,
            name: supplier.name || "",
            company: supplier.company,
            type: "supplier",
            searchText: `${supplier.name || ""} ${supplier.company || ""} ${phone} ${supplier.tax_number || ""}`.toLowerCase(),
          });
        });
      }

      setPartners(partnerOptions);
    };

    loadPartners();
  }, [open, userData?.company_id, customerId, supplierId]);

  useEffect(() => {
    if (!open) {
      form.reset({
        transaction_type: "receiver",
        transaction_date: new Date(),
        due_date: new Date(),
        other_party_id: "",
        other_party_type: "customer",
        amount: 0,
        description: "",
      });
    }
  }, [open, form]);

  const resetDialog = () => {
    form.reset({
      transaction_type: "receiver",
      transaction_date: new Date(),
      due_date: new Date(),
      other_party_id: "",
      other_party_type: "customer",
      amount: 0,
      description: "",
    });
    setPartners([]);
    setComboboxOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CariVirmanFormData) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Bu cari: customerId veya supplierId
      // Diğer cari: data.other_party_id ve data.other_party_type

      // transaction_type:
      // - "receiver": Bu cari alacaklansın (diğer cari borçlanır)
      // - "sender": Bu cari borçlansın (diğer cari alacaklanır)

      const isReceiver = data.transaction_type === "receiver";
      const thisPartyId = customerId || supplierId;
      const thisPartyType = customerId ? "customer" : "supplier";

      if (!thisPartyId) {
        throw new Error("Cari bilgisi bulunamadı");
      }

      // Bu cari için bakiye değişikliği
      // receiver: +amount (alacak artar)
      // sender: -amount (borç artar)
      const thisPartyBalanceChange = isReceiver ? data.amount : -data.amount;

      // Diğer cari için bakiye değişikliği
      // receiver: -amount (borç artar)
      // sender: +amount (alacak artar)
      const otherPartyBalanceChange = isReceiver ? -data.amount : data.amount;

      // Bu cariyi güncelle
      const thisTable = thisPartyType === "customer" ? "customers" : "suppliers";
      const { data: thisPartner } = await supabase
        .from(thisTable)
        .select("balance")
        .eq("id", thisPartyId)
        .single();

      const thisNewBalance = (thisPartner?.balance || 0) + thisPartyBalanceChange;
      const { error: thisUpdateError } = await supabase
        .from(thisTable)
        .update({ balance: thisNewBalance })
        .eq("id", thisPartyId);

      if (thisUpdateError) throw thisUpdateError;

      // Diğer cariyi güncelle
      const otherTable = data.other_party_type === "customer" ? "customers" : "suppliers";
      const { data: otherPartner } = await supabase
        .from(otherTable)
        .select("balance")
        .eq("id", data.other_party_id)
        .single();

      const otherNewBalance = (otherPartner?.balance || 0) + otherPartyBalanceChange;
      const { error: otherUpdateError } = await supabase
        .from(otherTable)
        .update({ balance: otherNewBalance })
        .eq("id", data.other_party_id);

      if (otherUpdateError) throw otherUpdateError;

      // Her iki cari için de payments kaydı oluştur

      // Bu cari için payment
      const thisPaymentPayload: any = {
        company_id: userData.company_id,
        amount: data.amount,
        payment_type: "cari_virman",
        payment_date: data.transaction_date.toISOString(),
        payment_direction: isReceiver ? "incoming" : "outgoing",
        currency: "TRY",
        description: data.description || `Cari Virman - ${isReceiver ? 'Alacak' : 'Borç'}`,
      };

      if (thisPartyType === "customer") {
        thisPaymentPayload.customer_id = thisPartyId;
      } else {
        thisPaymentPayload.supplier_id = thisPartyId;
      }

      const { error: thisPaymentError } = await supabase
        .from("payments")
        .insert([thisPaymentPayload]);

      if (thisPaymentError) throw thisPaymentError;

      // Diğer cari için payment
      const otherPaymentPayload: any = {
        company_id: userData.company_id,
        amount: data.amount,
        payment_type: "cari_virman",
        payment_date: data.transaction_date.toISOString(),
        payment_direction: isReceiver ? "outgoing" : "incoming",
        currency: "TRY",
        description: data.description || `Cari Virman - ${isReceiver ? 'Borç' : 'Alacak'}`,
      };

      if (data.other_party_type === "customer") {
        otherPaymentPayload.customer_id = data.other_party_id;
      } else {
        otherPaymentPayload.supplier_id = data.other_party_id;
      }

      const { error: otherPaymentError } = await supabase
        .from("payments")
        .insert([otherPaymentPayload]);

      if (otherPaymentError) throw otherPaymentError;
    },
    onSuccess: () => {
      toast.success("Cari virman başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
        queryClient.invalidateQueries({ queryKey: ["customer-payments", customerId] });
      }

      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
        queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplierId] });
      }

      onOpenChange(false);
      if (onSaved) {
        onSaved();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cari virman oluşturulurken bir hata oluştu");
    },
  });

  const onSubmit = (data: CariVirmanFormData) => {
    saveMutation.mutate(data);
  };

  const selectedPartner = partners.find(p => p.id === form.watch("other_party_id"));

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={(isOpen) => onOpenChange(isOpen)}
      onClosed={resetDialog}
      title="Cari Virman Fişleri"
      maxWidth="xl"
      headerColor="green"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Açıklayıcı Metin */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
            Bu carideki borcun bir miktarını veya tamamını başka bir cariye aktarabilirsiniz. Seçtiğiniz diğer caride, yazdığınız tutarın tersi kadar hareket oluşacaktır.
          </div>

          <div
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onOpenChange(false);
              }
            }}
          >
            {/* İşlem Tipi */}
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşlem Tipi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İşlem tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="receiver">Bu cari alacaklansın</SelectItem>
                      <SelectItem value="sender">Bu cari borçlansın</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    seçilen diğer cari borçlanacak
                  </p>
                </FormItem>
              )}
            />

            {/* İşlem Tarihi */}
            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşlem Tarihi <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      date={field.value}
                      onSelect={(newDate) => newDate && field.onChange(newDate)}
                      placeholder="İşlem tarihi seçin"
                      className="w-full h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vade Tarihi */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vade Tarihi <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      date={field.value}
                      onSelect={(newDate) => newDate && field.onChange(newDate)}
                      placeholder="Vade tarihi seçin"
                      className="w-full h-9"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    vade aşım hesabı için
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seçilen Diğer Cari */}
            <FormField
              control={form.control}
              name="other_party_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Seçilen Diğer Cari</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedPartner
                            ? `${selectedPartner.company || selectedPartner.name} (${selectedPartner.type === "customer" ? "Müşteri" : "Tedarikçi"})`
                            : "İsim, telefon, vergi/TC No ile arama yapa..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Ara..." />
                        <CommandEmpty>Cari bulunamadı.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {partners.map((partner) => (
                            <CommandItem
                              key={partner.id}
                              value={partner.searchText}
                              onSelect={() => {
                                form.setValue("other_party_id", partner.id);
                                form.setValue("other_party_type", partner.type);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  partner.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div>
                                <div>{partner.company || partner.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {partner.type === "customer" ? "Müşteri" : "Tedarikçi"}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tutar */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutar <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Açıklama */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Açıklama girin..."
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
            <UnifiedDialogActionButton
              type="submit"
              variant="primary"
              disabled={saveMutation.isPending}
              loading={saveMutation.isPending}
            >
              Kaydet
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </form>
      </Form>
    </UnifiedDialog>
  );
}
