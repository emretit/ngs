import React, { useState, useEffect } from "react";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useForm, FormProvider } from "react-hook-form";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Bank { id: string; name: string; short_name?: string | null }

export interface CheckRecord {
  id?: string;
  check_number?: string;
  issue_date?: string;
  due_date?: string;
  amount?: number;
  bank?: string;
  issuer_name?: string;
  payee?: string;
  status?: string;
  notes?: string | null;
}

interface CheckCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCheck?: CheckRecord | null;
  setEditingCheck?: (c: CheckRecord | null) => void;
  onSaved?: () => void;
}

export default function CheckCreateDialog({ open, onOpenChange, editingCheck, setEditingCheck, onSaved }: CheckCreateDialogProps) {
  const queryClient = useQueryClient();

  const { data: banks = [] } = useQuery({
    queryKey: ["banks", { active: true }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name, short_name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data as unknown as Bank[]) || [];
    },
  });

  const [bankName, setBankName] = useState<string>(editingCheck?.bank || (banks[0]?.name || ""));
  const [issueDate, setIssueDate] = useState<Date | undefined>(editingCheck?.issue_date ? new Date(editingCheck.issue_date) : undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(editingCheck?.due_date ? new Date(editingCheck.due_date) : undefined);
  const [status, setStatus] = useState<string>(editingCheck?.status || "pending");
  const issuerForm = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const payeeForm = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const [issuerName, setIssuerName] = useState<string>(editingCheck?.issuer_name || "");
  const [payeeName, setPayeeName] = useState<string>(editingCheck?.payee || "");
  const { customers = [], suppliers = [] } = useCustomerSelect();

  const issuerSelectedId = issuerForm.watch("customer_id");
  const payeeSelectedId = payeeForm.watch("customer_id");
  const issuerSupplierId = issuerForm.watch("supplier_id");
  const payeeSupplierId = payeeForm.watch("supplier_id");

  // Seçilen müşteri/tedarikçi id'sine göre isimleri güncelle
  useEffect(() => {
    if (issuerSelectedId) {
      const c = customers.find((x: any) => x.id === issuerSelectedId);
      if (c) setIssuerName(c.company || c.name || "");
    } else if (issuerSupplierId) {
      const s = suppliers.find((x: any) => x.id === issuerSupplierId);
      if (s) setIssuerName(s.company || s.name || "");
    }
  }, [issuerSelectedId, issuerSupplierId, customers, suppliers]);

  useEffect(() => {
    if (payeeSelectedId) {
      const c = customers.find((x: any) => x.id === payeeSelectedId);
      if (c) setPayeeName(c.company || c.name || "");
    } else if (payeeSupplierId) {
      const s = suppliers.find((x: any) => x.id === payeeSupplierId);
      if (s) setPayeeName(s.company || s.name || "");
    }
  }, [payeeSelectedId, payeeSupplierId, customers, suppliers]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat((formData.get("amount") as string) || "0"),
        bank: formData.get("bank") as string,
        issuer_name: formData.get("issuer_name") as string,
        payee: formData.get("payee") as string,
        status: formData.get("status") as string,
        notes: (formData.get("notes") as string) || null,
      };

      if (editingCheck?.id) {
        const { error } = await supabase.from("checks").update(payload).eq("id", editingCheck.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("checks").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      onOpenChange(false);
      setEditingCheck?.(null);
      onSaved?.();
    },
  });

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={editingCheck?.id ? "Çek Düzenle" : "Yeni Çek Ekle"}
      maxWidth="2xl"
      headerColor="blue"
    >
      <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);
            fd.set("bank", bankName || "");
            fd.set("issue_date", issueDate ? format(issueDate, "yyyy-MM-dd") : "");
            fd.set("due_date", dueDate ? format(dueDate, "yyyy-MM-dd") : "");
            fd.set("status", status);
            saveMutation.mutate(fd);
          }}
          className="flex flex-col h-full"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              form.requestSubmit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onOpenChange(false);
            }
          }}
        >
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-4">
          {/* Temel Bilgiler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="check_number" className="text-sm font-medium text-gray-700">
                  Çek No <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="check_number" 
                  name="check_number" 
                  defaultValue={editingCheck?.check_number || ""} 
                  placeholder="Çek numarasını girin"
                  className="h-9"
                  autoFocus
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  Banka <span className="text-red-500">*</span>
                </Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Banka seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tarih Bilgileri */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UnifiedDatePicker
                label="Düzenleme Tarihi"
                date={issueDate}
                onSelect={setIssueDate}
                placeholder="Tarih seçin"
                required
              />
              <UnifiedDatePicker
                label="Vade Tarihi"
                date={dueDate}
                onSelect={setDueDate}
                placeholder="Tarih seçin"
                required
              />
            </div>
          </div>

          {/* Tutar ve Durum */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Tutar <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingCheck?.amount || ""} 
                  placeholder="0.00"
                  className="h-9"
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">
                  Durum <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="odenecek">Ödenecek</SelectItem>
                    <SelectItem value="odendi">Ödendi</SelectItem>
                    <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="status" value={status} />
              </div>
            </div>
          </div>

          {/* Taraf Bilgileri */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Taraf Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="issuer_name" className="text-sm font-medium text-gray-700">
                  Keşideci (çeki düzenleyen)
                </Label>
                <FormProvider {...issuerForm}>
                  <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Firma seçin..." />
                </FormProvider>
                <input type="hidden" id="issuer_name" name="issuer_name" value={issuerName} />
                <input type="hidden" name="issuer_customer_id" value={issuerSelectedId} />
                <input type="hidden" name="issuer_supplier_id" value={issuerSupplierId} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="payee" className="text-sm font-medium text-gray-700">
                  Lehtar (çeki alan)
                </Label>
                <FormProvider {...payeeForm}>
                  <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Firma seçin..." />
                </FormProvider>
                <input type="hidden" id="payee" name="payee" value={payeeName} />
                <input type="hidden" name="payee_customer_id" value={payeeSelectedId} />
                <input type="hidden" name="payee_supplier_id" value={payeeSupplierId} />
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                defaultValue={editingCheck?.notes || ""} 
                placeholder="Ek notlar..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          </div>
        </div>
        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} disabled={saveMutation.isPending} />
          <UnifiedDialogActionButton
            onClick={() => {}}
            variant="primary"
            disabled={saveMutation.isPending}
            loading={saveMutation.isPending}
          >
            Kaydet
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
}


