import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { useForm, FormProvider } from "react-hook-form";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Check } from "@/types/check";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface CheckTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check?: Check | null;  // Opsiyonel - eğer null ise portföyden seçilecek
  onSuccess?: () => void;
  allowCheckSelection?: boolean;  // Çek seçimine izin ver
  defaultSupplierId?: string;  // Tedarikçi sayfasından geliyorsa otomatik seçilsin
}

export default function CheckTransferDialog({ 
  open, 
  onOpenChange, 
  check: initialCheck,
  onSuccess,
  allowCheckSelection = false,
  defaultSupplierId
}: CheckTransferDialogProps) {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(defaultSupplierId || "");
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(initialCheck || null);

  const payeeForm = useForm({
    defaultValues: {
      customer_id: "",
      supplier_id: ""
    }
  });

  const payeeSupplierId = payeeForm.watch("supplier_id");

  // Portföydeki çekleri çek (eğer çek seçimine izin veriliyorsa)
  const { data: portfolioChecks = [], isLoading: checksLoading } = useQuery({
    queryKey: ["portfolio-checks", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.log("No company_id, returning empty array");
        return [];
      }

      console.log("Fetching portfolio checks for company:", userData.company_id);

      const { data, error } = await supabase
        .from("checks")
        .select(`
          *,
          issuer_customer:customers!checks_issuer_customer_id_fkey(id, name, company),
          issuer_supplier:suppliers!checks_issuer_supplier_id_fkey(id, name, company)
        `)
        .eq("company_id", userData.company_id)
        .eq("status", "portfoyde")
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching portfolio checks:", error);
        throw error;
      }

      console.log("Fetched portfolio checks:", data);
      return data || [];
    },
    enabled: open && allowCheckSelection && !initialCheck && !!userData?.company_id,
  });

  // Dialog açıldığında form'u sıfırla
  useEffect(() => {
    if (open) {
      setTransferDate(new Date());
      setSelectedSupplierId(defaultSupplierId || "");
      setSelectedCheck(initialCheck || null);
      payeeForm.reset({
        customer_id: "",
        supplier_id: defaultSupplierId || ""
      });
    }
  }, [open, initialCheck, payeeForm, defaultSupplierId]);

  // Initial check değiştiğinde selectedCheck'i güncelle
  useEffect(() => {
    if (initialCheck) {
      setSelectedCheck(initialCheck);
    }
  }, [initialCheck]);

  // Tedarikçi seçildiğinde ID'yi güncelle
  useEffect(() => {
    if (payeeSupplierId) {
      setSelectedSupplierId(payeeSupplierId);
    } else {
      setSelectedSupplierId("");
    }
  }, [payeeSupplierId]);

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCheck) throw new Error("Çek bilgisi bulunamadı");
      if (!selectedSupplierId) throw new Error("Lütfen tedarikçi seçin");
      if (!transferDate) throw new Error("Lütfen ciro tarihi seçin");

      // Çek kaydını güncelle
      // Ciro edildi durumunda çek tipi giden olmalı
      const updateData = {
        status: "ciro_edildi",
        check_type: "outgoing",
        transferred_to_supplier_id: selectedSupplierId,
        transferred_date: format(transferDate, "yyyy-MM-dd")
      };

      const { data, error: updateError } = await supabase
        .from("checks")
        .update(updateData)
        .eq("id", selectedCheck.id)
        .select();

      if (updateError) {
        console.error("Update error:", updateError);
        console.error("Update data:", updateData);
        console.error("Check ID:", selectedCheck.id);
        throw new Error(updateError.message || "Çek güncellenirken hata oluştu");
      }

      // Payment kaydı oluştur - Ciro edilen tedarikçiye ödeme yapılmış demektir
      const paymentDate = new Date(transferDate).toISOString();

      const paymentData: any = {
        amount: selectedCheck.amount,
        payment_type: "cek",
        description: `Çek Ciro - Çek No: ${selectedCheck.check_number} - ${selectedCheck.bank}`,
        payment_date: paymentDate,
        supplier_id: selectedSupplierId,
        payment_direction: "outgoing",
        currency: "TRY",
        company_id: selectedCheck.company_id || null,
        reference_note: `Ciro - ${selectedCheck.check_number}`,
        check_id: selectedCheck.id,
      };

      const { error: paymentError } = await supabase.from("payments").insert(paymentData);
      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw new Error(paymentError.message || "Ödeme kaydı oluşturulurken hata oluştu");
      }

      // Tedarikçi bakiyesini güncelle - Ciro edilen tedarikçiye borç ödenmiş olur
      const { data: supplierData } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", selectedSupplierId)
        .single();

      if (supplierData) {
        await supabase
          .from("suppliers")
          .update({
            balance: supplierData.balance + selectedCheck.amount,
          })
          .eq("id", selectedSupplierId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Çek başarıyla ciro edildi", { duration: 2000 });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Transfer mutation error:", error);
      toast.error(error.message || "Çek ciro edilirken hata oluştu", { duration: 2000 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    if (!selectedCheck) {
      toast.error("Lütfen çek seçin");
      return;
    }
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.error("Lütfen tedarikçi seçin");
      return;
    }
    if (!transferDate) {
      toast.error("Lütfen ciro tarihi seçin");
      return;
    }
    transferMutation.mutate();
  };

  const getIssuerName = (check: any) => {
    if (check.issuer_customer) {
      return check.issuer_customer.company || check.issuer_customer.name;
    }
    if (check.issuer_supplier) {
      return check.issuer_supplier.company || check.issuer_supplier.name;
    }
    if (check.issuer_name) {
      return check.issuer_name;
    }
    return "Bilinmiyor";
  };

  const resetDialog = () => {
    setTransferDate(new Date());
    setSelectedSupplierId(defaultSupplierId || "");
    setSelectedCheck(initialCheck || null);
    payeeForm.reset();
  };

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onClosed={resetDialog}
      title="Çeki Ciro Et"
      maxWidth="lg"
      headerColor="blue"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
            {/* Çek Seçimi (eğer izin veriliyorsa ve çek seçilmemişse) */}
            {allowCheckSelection && !selectedCheck && (
              <div className="space-y-2">
                <Label>Portföyden Çek Seç</Label>
                {checksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : portfolioChecks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                    Portföyde hiç çek bulunmuyor
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                          <TableRow>
                            <TableHead className="text-xs">Çek No</TableHead>
                            <TableHead className="text-xs">Banka</TableHead>
                            <TableHead className="text-xs">Keşideci</TableHead>
                            <TableHead className="text-xs text-right">Tutar</TableHead>
                            <TableHead className="text-xs">Vade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {portfolioChecks.map((check: any) => (
                            <TableRow
                              key={check.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedCheck(check)}
                            >
                              <TableCell className="text-xs font-medium">#{check.check_number}</TableCell>
                              <TableCell className="text-xs">{check.bank}</TableCell>
                              <TableCell className="text-xs">{getIssuerName(check)}</TableCell>
                              <TableCell className="text-xs text-right">
                                {formatCurrency(check.amount)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {check.due_date ? format(new Date(check.due_date), "dd MMM yyyy", { locale: tr }) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seçili Çek Bilgileri */}
            {selectedCheck && (
              <>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {allowCheckSelection && (
                    <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-600">Seçili Çek</div>
                      <button
                        type="button"
                        onClick={() => setSelectedCheck(null)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Değiştir
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Çek No</div>
                      <div className="font-semibold text-gray-900">#{selectedCheck.check_number}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Banka</div>
                      <div className="font-semibold text-gray-900 truncate">{selectedCheck.bank}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Tutar</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(selectedCheck.amount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Vade</div>
                      <div className="font-semibold text-gray-900">{format(new Date(selectedCheck.due_date), "dd/MM/yyyy")}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-gray-200 text-xs">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Keşideci</div>
                      <div className="font-semibold text-gray-900 truncate">{getIssuerName(selectedCheck)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 mb-0.5">Durum</div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0 h-5">
                        Portföyde
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ciro Bilgileri */}
                <div className="space-y-2">
                  <UnifiedDatePicker
                    label="Ciro Tarihi"
                    date={transferDate}
                    onSelect={(date) => date && setTransferDate(date)}
                    placeholder="Ciro tarihi seçin"
                    required
                  />

                  {/* Tedarikçi seçimi - sadece defaultSupplierId yoksa göster */}
                  {!defaultSupplierId && (
                    <div className="space-y-1">
                      <FormProvider {...payeeForm}>
                        <ProposalPartnerSelect 
                          partnerType="supplier" 
                          placeholder="Ciro edilecek tedarikçi seçin..." 
                          hideLabel={false}
                        />
                      </FormProvider>
                      <input type="hidden" name="transferred_to_supplier_id" value={selectedSupplierId} />
                    </div>
                  )}

                  {/* Default tedarikçi varsa bilgi göster */}
                  {defaultSupplierId && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-xs font-medium text-blue-900">
                        Çek bu tedarikçiye ciro edilecek
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton 
            onClick={() => onOpenChange(false)} 
            disabled={transferMutation.isPending} 
          />
          <UnifiedDialogActionButton
            type="submit"
            variant="primary"
            disabled={transferMutation.isPending || !selectedCheck || !selectedSupplierId || !transferDate}
            loading={transferMutation.isPending}
          >
            Ciro Et
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
}

