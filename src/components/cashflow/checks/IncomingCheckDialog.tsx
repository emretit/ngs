import React, { useState, useEffect } from "react";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useForm, FormProvider } from "react-hook-form";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Check } from "@/types/check";

interface Bank { id: string; name: string; short_name?: string | null }

interface IncomingCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCheck?: Check | null;
  onSaved?: () => void;
  defaultCustomerId?: string;
}

export default function IncomingCheckDialog({ 
  open, 
  onOpenChange, 
  editingCheck,
  onSaved,
  defaultCustomerId
}: IncomingCheckDialogProps) {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  
  const { data: companyData } = useQuery({
    queryKey: ["company", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", userData.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });
  const companyName = companyData?.name || "";

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

  // Payment accounts query
  const { data: paymentAccounts } = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      const [cashRes, bankRes, cardRes, partnerRes] = await Promise.all([
        supabase.from('cash_accounts').select('id, name'),
        supabase.from('bank_accounts').select('id, account_name, bank_name').eq("is_active", true),
        supabase.from('credit_cards').select('id, card_name'),
        supabase.from('partner_accounts').select('id, partner_name')
      ]);

      return {
        cash: cashRes.data?.map(a => ({ id: a.id, label: a.name })) || [],
        bank: bankRes.data?.map(a => ({ id: a.id, label: `${a.account_name} - ${a.bank_name}` })) || [],
        credit_card: cardRes.data?.map(a => ({ id: a.id, label: a.card_name })) || [],
        partner: partnerRes.data?.map(a => ({ id: a.id, label: a.partner_name })) || []
      };
    },
  });

  const [bankName, setBankName] = useState<string>("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>("portfoyde");
  const [paymentAccountType, setPaymentAccountType] = useState<"cash" | "bank" | "credit_card" | "partner">("bank");
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>("");

  const issuerForm = useForm({
    defaultValues: {
      customer_id: defaultCustomerId || "",
      supplier_id: ""
    }
  });

  const [issuerName, setIssuerName] = useState<string>("");
  const issuerSelectedId = issuerForm.watch("customer_id");
  const issuerSupplierId = issuerForm.watch("supplier_id");

  // Seçilen müşteri/tedarikçiyi fetch et
  const { data: selectedIssuerCustomer } = useQuery({
    queryKey: ["selected-issuer-customer", issuerSelectedId],
    queryFn: async () => {
      if (!issuerSelectedId) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company")
        .eq("id", issuerSelectedId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!issuerSelectedId,
  });

  const { data: selectedIssuerSupplier } = useQuery({
    queryKey: ["selected-issuer-supplier", issuerSupplierId],
    queryFn: async () => {
      if (!issuerSupplierId) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company")
        .eq("id", issuerSupplierId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!issuerSupplierId,
  });

  // Dialog açıldığında default değerleri yükle
  useEffect(() => {
    if (open) {
      if (editingCheck) {
        setBankName(editingCheck.bank || "");
        setIssueDate(editingCheck.issue_date ? new Date(editingCheck.issue_date) : undefined);
        setDueDate(editingCheck.due_date ? new Date(editingCheck.due_date) : undefined);
        setStatus(editingCheck.status || "portfoyde");
        setIssuerName(editingCheck.issuer_name || "");
        
        if (editingCheck.issuer_customer_id) {
          issuerForm.setValue("customer_id", editingCheck.issuer_customer_id);
        }
        if (editingCheck.issuer_supplier_id) {
          issuerForm.setValue("supplier_id", editingCheck.issuer_supplier_id);
        }
      } else {
        setBankName(banks[0]?.name || "");
        setIssueDate(undefined);
        setDueDate(undefined);
        setStatus("portfoyde");
        setIssuerName("");
        if (defaultCustomerId) {
          issuerForm.setValue("customer_id", defaultCustomerId);
        }
      }
    }
  }, [open, editingCheck, defaultCustomerId, banks, issuerForm]);

  // Seçilen müşteri/tedarikçi ismini güncelle
  useEffect(() => {
    if (selectedIssuerCustomer) {
      const name = selectedIssuerCustomer.company || selectedIssuerCustomer.name || "";
      setIssuerName(name);
    } else if (selectedIssuerSupplier) {
      const name = selectedIssuerSupplier.company || selectedIssuerSupplier.name || "";
      setIssuerName(name);
    } else if (!issuerSelectedId && !issuerSupplierId) {
      setIssuerName("");
    }
  }, [selectedIssuerCustomer, selectedIssuerSupplier, issuerSelectedId, issuerSupplierId]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const amount = parseFloat((formData.get("amount") as string) || "0");
      const issueDateValue = formData.get("issue_date") as string;
      const checkNumber = formData.get("check_number") as string;
      const bank = formData.get("bank") as string;

      if (!issueDateValue || !formData.get("due_date")) {
        throw new Error("Tarih bilgileri zorunludur");
      }

      const cleanString = (value: string | null | undefined): string | null => {
        if (!value || value.trim() === "") return null;
        return value;
      };

      const payload: any = {
        check_number: checkNumber,
        issue_date: issueDateValue,
        due_date: formData.get("due_date") as string,
        amount: amount,
        bank: bank,
        issuer_name: cleanString(issuerName),
        payee: companyName || "Şirket",
        status: status,
        notes: cleanString(formData.get("notes") as string),
        check_type: "incoming",
        company_id: userData?.company_id || null,
        issuer_customer_id: cleanString(issuerSelectedId) || null,
        issuer_supplier_id: cleanString(issuerSupplierId) || null,
      };

      // Tahsil Edildi durumunda hesap bilgileri
      let receiptAccountType: string | null = null;
      let receiptAccountId: string | null = null;
      if (status === "tahsil_edildi") {
        receiptAccountType = formData.get("receipt_account_type") as string;
        receiptAccountId = formData.get("receipt_account_id") as string;
      }

      // Çek kaydını kaydet
      let insertedCheckId: string | null = null;
      if (editingCheck?.id) {
        const { error } = await supabase.from("checks").update(payload).eq("id", editingCheck.id);
        if (error) throw error;
        insertedCheckId = editingCheck.id;
      } else {
        const { data: insertedCheck, error } = await supabase.from("checks").insert([payload]).select("id").single();
        if (error) throw error;
        insertedCheckId = insertedCheck?.id || null;
      }

      // Payment kaydı oluştur (yeni çek için)
      if (!editingCheck?.id && insertedCheckId) {
        const paymentDate = issueDateValue ? new Date(issueDateValue + 'T00:00:00').toISOString() : new Date().toISOString();
        
        const paymentData: any = {
          amount: amount,
          payment_type: "cek",
          description: `Çek No: ${checkNumber} - ${bank}`,
          payment_date: paymentDate,
          customer_id: issuerSelectedId || null,
          payment_direction: "incoming",
          currency: "TRY",
          company_id: userData?.company_id || null,
          account_id: receiptAccountId || null,
          account_type: receiptAccountType || null,
          reference_note: checkNumber || null,
          check_id: insertedCheckId,
        };

        const { error: paymentError } = await supabase.from("payments").insert(paymentData);
        if (paymentError) throw paymentError;
      }

      // Bakiye güncellemeleri (tahsil_edildi durumunda)
      if (status === "tahsil_edildi" && !editingCheck?.id && receiptAccountId && receiptAccountType) {
        const balanceMultiplier = 1;

        if (receiptAccountType === "bank") {
          const { data: bankData } = await supabase
            .from("bank_accounts")
            .select("current_balance, available_balance")
            .eq("id", receiptAccountId)
            .single();

          if (bankData) {
            await supabase
              .from("bank_accounts")
              .update({
                current_balance: bankData.current_balance + (amount * balanceMultiplier),
                available_balance: bankData.available_balance + (amount * balanceMultiplier),
              })
              .eq("id", receiptAccountId);
          }
        } else if (receiptAccountType === "cash") {
          const { data: cashData } = await supabase
            .from("cash_accounts")
            .select("current_balance")
            .eq("id", receiptAccountId)
            .single();

          if (cashData) {
            await supabase
              .from("cash_accounts")
              .update({
                current_balance: cashData.current_balance + (amount * balanceMultiplier),
              })
              .eq("id", receiptAccountId);
          }
        }

        // Müşteri bakiyesini güncelle
        if (issuerSelectedId) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("balance")
            .eq("id", issuerSelectedId)
            .single();

          if (customerData) {
            await supabase
              .from("customers")
              .update({
                balance: customerData.balance - amount,
              })
              .eq("id", issuerSelectedId);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      toast.success(editingCheck?.id ? "Çek güncellendi" : "Çek kaydedildi", { duration: 1000 });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error(error.message || (editingCheck?.id ? "Çek güncellenirken hata oluştu" : "Çek kaydedilirken hata oluştu"), { duration: 2000 });
    },
  });

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={editingCheck?.id ? "Gelen Çek Düzenle" : "Yeni Gelen Çek Ekle"}
      maxWidth="lg"
      headerColor="green"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const fd = new FormData(form);
          fd.set("bank", bankName || "");
          
          if (!issueDate) {
            toast.error("Keşide tarihi seçilmelidir");
            return;
          }
          if (!dueDate) {
            toast.error("Vade tarihi seçilmelidir");
            return;
          }
          
          fd.set("issue_date", format(issueDate, "yyyy-MM-dd"));
          fd.set("due_date", format(dueDate, "yyyy-MM-dd"));
          fd.set("status", status);
          saveMutation.mutate(fd);
        }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
          <div className="space-y-3">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="check_number" className="text-sm font-medium text-gray-700">
                  Çek No *
                </Label>
                <Input 
                  id="check_number" 
                  name="check_number" 
                  defaultValue={editingCheck?.check_number || ""} 
                  placeholder="Çek numarasını girin"
                  className="h-10"
                  autoFocus
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Banka *
                </Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors">
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

            {/* Tarih Bilgileri */}
            <div className="grid grid-cols-2 gap-2">
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

            {/* Tutar ve Durum */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Tutar *
                </Label>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingCheck?.amount || ""} 
                  placeholder="0.00"
                  className="h-10"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Durum *
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfoyde">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Portföyde</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bankaya_verildi">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Bankaya Verildi</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tahsil_edildi">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Tahsil Edildi</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="karsilik_yok">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Karşılıksız</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="status" value={status} />
              </div>
            </div>

            {/* Taraf Bilgileri */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <FormProvider {...issuerForm}>
                  <ProposalPartnerSelect 
                    partnerType="customer" 
                    placeholder="Müşteri seçin..."
                    hideLabel={false}
                  />
                </FormProvider>
                <input type="hidden" id="issuer_name" name="issuer_name" value={issuerName} />
                <input type="hidden" name="issuer_customer_id" value={issuerSelectedId} />
                <input type="hidden" name="issuer_supplier_id" value={issuerSupplierId} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payee" className="text-sm font-medium text-gray-700">
                  Lehtar
                </Label>
                <Input 
                  id="payee" 
                  name="payee" 
                  value={companyName} 
                  disabled
                  className="bg-gray-50 h-10"
                />
              </div>
            </div>

            {/* Tahsil Edilen Hesap */}
            {status === "tahsil_edildi" && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Label className="text-xs font-medium text-gray-600">Tahsil Edilen Hesap</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="receipt_account_type" className="text-xs font-medium text-gray-600">
                        Hesap Türü
                      </Label>
                      <Select value={paymentAccountType} onValueChange={(value) => {
                        setPaymentAccountType(value as "cash" | "bank" | "credit_card" | "partner");
                        setSelectedPaymentAccountId("");
                      }}>
                      <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Hesap türü seçin" />
                      </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Kasa</SelectItem>
                          <SelectItem value="bank">Banka</SelectItem>
                          <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                          <SelectItem value="partner">Ortak Hesap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="receipt_account" className="text-xs font-medium text-gray-600">
                        Hesap
                      </Label>
                      <Select value={selectedPaymentAccountId} onValueChange={setSelectedPaymentAccountId}>
                        <SelectTrigger className="h-10 bg-white border-gray-200 hover:border-primary/50 transition-colors">
                          <SelectValue placeholder="Hesap seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentAccountType === 'cash' && paymentAccounts?.cash?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {paymentAccountType === 'bank' && paymentAccounts?.bank?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {paymentAccountType === 'credit_card' && paymentAccounts?.credit_card?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {paymentAccountType === 'partner' && paymentAccounts?.partner?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <input type="hidden" name="receipt_account_type" value={paymentAccountType} />
                <input type="hidden" name="receipt_account_id" value={selectedPaymentAccountId} />
              </div>
            )}

            {/* Notlar */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                defaultValue={editingCheck?.notes || ""} 
                placeholder="Ek notlar..."
                rows={3}
                className="resize-none min-h-[80px]"
              />
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
            className="bg-green-600 hover:bg-green-700"
          >
            {editingCheck?.id ? "Güncelle" : "Oluştur"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
}

