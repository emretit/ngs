import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { useForm, FormProvider } from "react-hook-form";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check } from "@/types/check";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface CheckTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: Check | null;
  onSuccess?: () => void;
}

export default function CheckTransferDialog({ 
  open, 
  onOpenChange, 
  check,
  onSuccess
}: CheckTransferDialogProps) {
  const queryClient = useQueryClient();
  const [transferDate, setTransferDate] = useState<Date>(new Date());
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const payeeForm = useForm({
    defaultValues: {
      customer_id: "",
      supplier_id: ""
    }
  });

  const payeeSupplierId = payeeForm.watch("supplier_id");

  // Dialog açıldığında form'u sıfırla
  useEffect(() => {
    if (open && check) {
      setTransferDate(new Date());
      setSelectedSupplierId("");
      payeeForm.reset({
        customer_id: "",
        supplier_id: ""
      });
    }
  }, [open, check, payeeForm]);

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
      if (!check) throw new Error("Çek bilgisi bulunamadı");
      if (!selectedSupplierId) throw new Error("Lütfen tedarikçi seçin");
      if (!transferDate) throw new Error("Lütfen ciro tarihi seçin");

      // Çek kaydını güncelle
      const updateData = {
        status: "tedarikciye_verildi",
        transferred_to_supplier_id: selectedSupplierId,
        transferred_date: format(transferDate, "yyyy-MM-dd")
      };

      const { data, error: updateError } = await supabase
        .from("checks")
        .update(updateData)
        .eq("id", check.id)
        .select();

      if (updateError) {
        console.error("Update error:", updateError);
        console.error("Update data:", updateData);
        console.error("Check ID:", check.id);
        throw new Error(updateError.message || "Çek güncellenirken hata oluştu");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
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
    if (!check) return;
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

  return (
    <UnifiedDialog
      isOpen={open && !!check}
      onClose={() => onOpenChange(false)}
      title="Çeki Ciro Et"
      maxWidth="lg"
      headerColor="blue"
    >
      {check && (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
            <div className="space-y-3">
              {/* Çek Bilgileri (Readonly) - Kompakt */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 mb-0.5">Çek No</div>
                    <div className="font-semibold text-gray-900">#{check.check_number}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 mb-0.5">Banka</div>
                    <div className="font-semibold text-gray-900 truncate">{check.bank}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 mb-0.5">Tutar</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(check.amount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 mb-0.5">Vade</div>
                    <div className="font-semibold text-gray-900">{format(new Date(check.due_date), "dd/MM/yyyy")}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-gray-200 text-xs">
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 mb-0.5">Keşideci</div>
                    <div className="font-semibold text-gray-900 truncate">{check.issuer_name || "-"}</div>
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
            </div>
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
                  disabled={transferMutation.isPending || !selectedSupplierId || !transferDate}
                  loading={transferMutation.isPending}
                >
                  Ciro Et
                </UnifiedDialogActionButton>
              </UnifiedDialogFooter>
            </form>
          )}
        </UnifiedDialog>
      );
}

