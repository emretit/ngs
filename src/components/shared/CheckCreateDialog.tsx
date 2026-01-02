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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

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
  check_type?: "incoming" | "outgoing";
  issuer_customer_id?: string | null;
  issuer_supplier_id?: string | null;
  payee_customer_id?: string | null;
  payee_supplier_id?: string | null;
  receipt_account_type?: string | null;
  receipt_account_id?: string | null;
  payment_account_type?: string | null;
  payment_account_id?: string | null;
}

/**
 * @deprecated Bu dialog artık kullanılmıyor. 
 * Gelen çekler için IncomingCheckDialog, giden çekler için OutgoingCheckDialog kullanın.
 * Bu dosya geriye dönük uyumluluk için korunuyor.
 */
interface CheckCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCheck?: CheckRecord | null;
  setEditingCheck?: (c: CheckRecord | null) => void;
  onSaved?: () => void;
  defaultCheckType?: "incoming" | "outgoing";
  defaultStatus?: string;
  defaultCustomerId?: string;  // Otomatik seçili gelecek müşteri ID'si
  defaultSupplierId?: string;  // Otomatik seçili gelecek tedarikçi ID'si
}

export default function CheckCreateDialog({ open, onOpenChange, editingCheck, setEditingCheck, onSaved, defaultCheckType = "incoming", defaultStatus, defaultCustomerId, defaultSupplierId }: CheckCreateDialogProps) {
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

  // Determine check type: prefer stored field, else fallback to default
  const determineCheckType = (): "incoming" | "outgoing" => {
    if (editingCheck) {
      if (editingCheck.check_type === "incoming" || editingCheck.check_type === "outgoing") {
        return editingCheck.check_type;
      }
      return defaultCheckType;
    }
    return defaultCheckType;
  };
  
  const [checkType, setCheckType] = useState<"incoming" | "outgoing">(determineCheckType());
  
  // Update checkType when editingCheck or defaultCheckType changes
  useEffect(() => {
    const newType = determineCheckType();
    setCheckType(newType);
  }, [editingCheck, defaultCheckType]);
  const [bankName, setBankName] = useState<string>(editingCheck?.bank || (banks[0]?.name || ""));
  const [issueDate, setIssueDate] = useState<Date | undefined>(editingCheck?.issue_date ? new Date(editingCheck.issue_date) : undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(editingCheck?.due_date ? new Date(editingCheck.due_date) : undefined);
  
  // Determine initial status
  const getInitialStatus = () => {
    if (editingCheck?.status) return editingCheck.status;
    if (defaultStatus) return defaultStatus;
    return checkType === "incoming" ? "portfoyde" : "odenecek";
  };
  const [status, setStatus] = useState<string>(getInitialStatus());
  
  // Payment account states
  const [paymentAccountType, setPaymentAccountType] = useState<"cash" | "bank" | "credit_card" | "partner">("bank");
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>("");

  // Form'ları başlangıç değerleriyle oluştur
  const issuerForm = useForm({
    defaultValues: {
      customer_id: defaultCheckType === "incoming" && defaultCustomerId ? defaultCustomerId : "",
      supplier_id: ""
    }
  });
  const payeeForm = useForm({
    defaultValues: {
      customer_id: "",
      supplier_id: defaultCheckType === "outgoing" && defaultSupplierId ? defaultSupplierId : ""
    }
  });

  const [issuerName, setIssuerName] = useState<string>(editingCheck?.issuer_name || "");
  const [payeeName, setPayeeName] = useState<string>(editingCheck?.payee || "");
  const { customers = [], suppliers = [] } = useCustomerSelect();

  const issuerSelectedId = issuerForm.watch("customer_id");
  const payeeSelectedId = payeeForm.watch("customer_id");
  const issuerSupplierId = issuerForm.watch("supplier_id");
  const payeeSupplierId = payeeForm.watch("supplier_id");

  // Seçilen müşteri/tedarikçiyi direkt database'den fetch et
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

  const { data: selectedPayeeSupplier } = useQuery({
    queryKey: ["selected-payee-supplier", payeeSupplierId],
    queryFn: async () => {
      if (!payeeSupplierId) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company")
        .eq("id", payeeSupplierId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!payeeSupplierId,
  });

  // Dialog açıldığında default değerleri form'a yükle
  useEffect(() => {
    if (open) {
      if (editingCheck) {
        // Düzenleme modunda: mevcut çekin verilerini yükle
        if (checkType === "incoming") {
          // Gelen çek: issuer bilgilerini yükle
          if (editingCheck.issuer_customer_id) {
            issuerForm.setValue("customer_id", editingCheck.issuer_customer_id);
          }
          if (editingCheck.issuer_supplier_id) {
            issuerForm.setValue("supplier_id", editingCheck.issuer_supplier_id);
          }
        } else {
          // Giden çek: payee bilgilerini yükle
          if (editingCheck.payee_supplier_id) {
            payeeForm.setValue("supplier_id", editingCheck.payee_supplier_id);
          }
        }
      } else {
        // Yeni çek modunda: default değerleri yükle
        if (defaultCheckType === "incoming" && defaultCustomerId) {
          issuerForm.setValue("customer_id", defaultCustomerId);
        }
        if (defaultCheckType === "outgoing" && defaultSupplierId) {
          payeeForm.setValue("supplier_id", defaultSupplierId);
        }
      }
    }
  }, [open, defaultCustomerId, defaultSupplierId, defaultCheckType, editingCheck, checkType]);

  // Seçilen müşteri/tedarikçi id'sine göre isimleri güncelle
  useEffect(() => {
    if (selectedIssuerCustomer) {
      const name = selectedIssuerCustomer.company || selectedIssuerCustomer.name || "";
      setIssuerName(name);
    } else if (selectedIssuerSupplier) {
      const name = selectedIssuerSupplier.company || selectedIssuerSupplier.name || "";
      setIssuerName(name);
    } else if (!issuerSelectedId && !issuerSupplierId) {
      // ID'ler boşsa ismi de temizle
      setIssuerName("");
    }
  }, [selectedIssuerCustomer, selectedIssuerSupplier, issuerSelectedId, issuerSupplierId]);

  useEffect(() => {
    if (selectedPayeeSupplier) {
      const name = selectedPayeeSupplier.company || selectedPayeeSupplier.name || "";
      setPayeeName(name);
    } else if (!payeeSupplierId) {
      setPayeeName("");
    }
  }, [selectedPayeeSupplier, payeeSupplierId]);

  // editingCheck değiştiğinde state'leri güncelle
  useEffect(() => {
    if (editingCheck) {
      setBankName(editingCheck.bank || "");
      setIssueDate(editingCheck.issue_date ? new Date(editingCheck.issue_date) : undefined);
      setDueDate(editingCheck.due_date ? new Date(editingCheck.due_date) : undefined);
      setStatus(editingCheck.status || (checkType === "incoming" ? "portfoyde" : "odenecek"));
      setIssuerName(editingCheck.issuer_name || "");
      setPayeeName(editingCheck.payee || "");

      // Hesap bilgilerini yükle
      if (editingCheck.receipt_account_type && editingCheck.receipt_account_id) {
        setPaymentAccountType(editingCheck.receipt_account_type as "cash" | "bank" | "credit_card" | "partner");
        setSelectedPaymentAccountId(editingCheck.receipt_account_id);
      } else if (editingCheck.payment_account_type && editingCheck.payment_account_id) {
        setPaymentAccountType(editingCheck.payment_account_type as "cash" | "bank" | "credit_card" | "partner");
        setSelectedPaymentAccountId(editingCheck.payment_account_id);
      }
    } else {
      // Reset form when closing
      setBankName(banks[0]?.name || "");
      setIssueDate(undefined);
      setDueDate(undefined);
      setStatus(checkType === "incoming" ? "portfoyde" : "odenecek");
      setIssuerName("");
      setPayeeName("");
      setPaymentAccountType("bank");
      setSelectedPaymentAccountId("");
    }
  }, [editingCheck, checkType, banks]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const amount = parseFloat((formData.get("amount") as string) || "0");
      const issueDate = formData.get("issue_date") as string;
      const checkNumber = formData.get("check_number") as string;
      const bank = formData.get("bank") as string;

      // payee zorunlu alan, boş olamaz
      const payeeValue = checkType === "incoming" ? (companyName || "Şirket") : (payeeName || "Tedarikçi");
      
      // Boş string'leri null'a çevir
      const cleanString = (value: string | null | undefined): string | null => {
        if (!value || value.trim() === "") return null;
        return value;
      };
      
      // issue_date ve due_date zorunlu alanlar, boş olamaz
      const issueDateValue = issueDate || formData.get("issue_date") as string;
      const dueDateValue = formData.get("due_date") as string;
      
      if (!issueDateValue || issueDateValue.trim() === "") {
        throw new Error("Keşide tarihi zorunludur");
      }
      if (!dueDateValue || dueDateValue.trim() === "") {
        throw new Error("Vade tarihi zorunludur");
      }
      
      const payload: any = {
        check_number: checkNumber,
        issue_date: issueDateValue,
        due_date: dueDateValue,
        amount: amount,
        bank: bank,
        issuer_name: checkType === "outgoing" ? cleanString(companyName) : cleanString(issuerName),
        payee: payeeValue, // Zorunlu alan, boş olamaz
        status: formData.get("status") as string || "pending",
        notes: cleanString(formData.get("notes") as string),
        check_type: checkType,
        company_id: userData?.company_id || null,
      };

      // Müşteri/tedarikçi ID'lerini ekle
      if (checkType === "incoming") {
        // Gelen çek: keşideci müşteri/tedarikçi olabilir
        const issuerCustomerId = formData.get("issuer_customer_id") as string;
        const issuerSupplierId = formData.get("issuer_supplier_id") as string;
        payload.issuer_customer_id = cleanString(issuerCustomerId) || null;
        payload.issuer_supplier_id = cleanString(issuerSupplierId) || null;
      } else {
        // Giden çek: lehtar tedarikçi olabilir
        const payeeSupplierId = formData.get("payee_supplier_id") as string;
        const payeeCustomerId = formData.get("payee_customer_id") as string;
        payload.payee_supplier_id = cleanString(payeeSupplierId) || null;
        payload.payee_customer_id = cleanString(payeeCustomerId) || null;
      }


      // Tahsil Edildi durumunda hesap bilgileri (gelen çek) - sadece payments tablosunda kullanılacak
      let receiptAccountType: string | null = null;
      let receiptAccountId: string | null = null;
      if (status === "tahsil_edildi") {
        receiptAccountType = formData.get("receipt_account_type") as string;
        receiptAccountId = formData.get("receipt_account_id") as string;
        // Bu alanlar checks tablosunda değil, sadece payments tablosunda kullanılacak
      }

      // Ödendi durumunda hesap bilgileri (giden çek) - sadece payments tablosunda kullanılacak
      let paymentAccountType: string | null = null;
      let paymentAccountId: string | null = null;
      if (status === "odendi") {
        paymentAccountType = formData.get("payment_account_type") as string;
        paymentAccountId = formData.get("payment_account_id") as string;
        // Bu alanlar checks tablosunda değil, sadece payments tablosunda kullanılacak
      }

      // 1. Çek kaydını kaydet
      let insertedCheckId: string | null = null;
      if (editingCheck?.id) {
        const { error } = await supabase.from("checks").update(payload).eq("id", editingCheck.id);
        if (error) {
          console.error("Check update error:", error);
          throw error;
        }
        insertedCheckId = editingCheck.id;
      } else {
        console.log("Inserting check with payload:", payload);
        const { data: insertedCheck, error } = await supabase.from("checks").insert([payload]).select("id").single();
        if (error) {
          console.error("Check insert error:", error);
          console.error("Payload was:", JSON.stringify(payload, null, 2));
          throw error;
        }
        insertedCheckId = insertedCheck?.id || null;
      }

      // 2. Payment kaydı oluştur (her yeni çek için)
      // Yeni çek oluşturulduğunda her zaman payments tablosuna kayıt ekle
      if (!editingCheck?.id && insertedCheckId) {
        const paymentDirection = checkType === "incoming" ? "incoming" : "outgoing";
        const accountType = checkType === "incoming" ? receiptAccountType : paymentAccountType;
        const accountId = checkType === "incoming" ? receiptAccountId : paymentAccountId;

        // Müşteri veya tedarikçi ID'sini al
        const customerId = checkType === "incoming" ?
          (formData.get("issuer_customer_id") as string || null) : null;
        const supplierId = checkType === "outgoing" ?
          (formData.get("payee_supplier_id") as string || null) : null;

        // Payment kaydı oluştur
        // issueDate yyyy-MM-dd formatında string olarak geliyor, ISO formatına çevir
        const paymentDate = issueDate ? new Date(issueDate + 'T00:00:00').toISOString() : new Date().toISOString();
        
        const paymentData: any = {
          amount: amount,
          payment_type: "cek",
          description: `Çek No: ${checkNumber} - ${bank}`,
          payment_date: paymentDate,
          customer_id: customerId || null,
          supplier_id: supplierId || null,
          payment_direction: paymentDirection,
          currency: "TRY",
          company_id: userData?.company_id || null,
          account_id: accountId || null,
          account_type: accountType || null,
          reference_note: checkNumber || null,
          check_id: insertedCheckId, // Çek ID'sini payment kaydına bağla
        };

        const { error: paymentError } = await supabase.from("payments").insert(paymentData);
        if (paymentError) throw paymentError;
      }

      // 3. Bakiye güncellemeleri yap (sadece tahsil_edildi veya ödendi durumlarında)
      const shouldUpdateBalances = status === "tahsil_edildi" || status === "odendi";

      if (shouldUpdateBalances && !editingCheck?.id) {
        const paymentDirection = checkType === "incoming" ? "incoming" : "outgoing";
        const accountType = checkType === "incoming" ? receiptAccountType : paymentAccountType;
        const accountId = checkType === "incoming" ? receiptAccountId : paymentAccountId;

        // Müşteri veya tedarikçi ID'sini al
        const customerId = checkType === "incoming" ?
          (formData.get("issuer_customer_id") as string || null) : null;
        const supplierId = checkType === "outgoing" ?
          (formData.get("payee_supplier_id") as string || null) : null;

        // 4. Hesap bakiyesini güncelle (eğer hesap seçildiyse)
        if (accountId && accountType) {
          const balanceMultiplier = paymentDirection === "incoming" ? 1 : -1;

          if (accountType === "bank") {
            const { data: bankData } = await supabase
              .from("bank_accounts")
              .select("current_balance, available_balance")
              .eq("id", accountId)
              .single();

            if (bankData) {
              const newCurrentBalance = bankData.current_balance + (amount * balanceMultiplier);
              const newAvailableBalance = bankData.available_balance + (amount * balanceMultiplier);

              const { error: accountUpdateError } = await supabase
                .from("bank_accounts")
                .update({
                  current_balance: newCurrentBalance,
                  available_balance: newAvailableBalance,
                })
                .eq("id", accountId);

              if (accountUpdateError) throw accountUpdateError;
            }
          } else if (accountType === "cash") {
            const { data: cashData } = await supabase
              .from("cash_accounts")
              .select("current_balance")
              .eq("id", accountId)
              .single();

            if (cashData) {
              const newCurrentBalance = cashData.current_balance + (amount * balanceMultiplier);

              const { error: accountUpdateError } = await supabase
                .from("cash_accounts")
                .update({
                  current_balance: newCurrentBalance,
                })
                .eq("id", accountId);

              if (accountUpdateError) throw accountUpdateError;
            }
          } else if (accountType === "credit_card") {
            const { error: cardUpdateError } = await supabase.rpc('update_credit_card_balance', {
              card_id: accountId,
              amount: amount * balanceMultiplier,
              transaction_type: paymentDirection === 'incoming' ? 'income' : 'expense'
            });

            if (cardUpdateError) throw cardUpdateError;
          } else if (accountType === "partner") {
            const { error: partnerUpdateError } = await supabase.rpc('update_partner_account_balance', {
              account_id: accountId,
              amount: amount * balanceMultiplier,
              transaction_type: paymentDirection === 'incoming' ? 'income' : 'expense'
            });

            if (partnerUpdateError) throw partnerUpdateError;
          }
        }

        // 5. Müşteri veya tedarikçi bakiyesini güncelle
        if (customerId) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("balance")
            .eq("id", customerId)
            .single();

          if (customerData) {
            const customerBalanceMultiplier = paymentDirection === "incoming" ? -1 : 1;
            const newCustomerBalance = customerData.balance + (amount * customerBalanceMultiplier);

            const { error: customerUpdateError } = await supabase
              .from("customers")
              .update({
                balance: newCustomerBalance,
              })
              .eq("id", customerId);

            if (customerUpdateError) throw customerUpdateError;
          }
        } else if (supplierId) {
          const { data: supplierData } = await supabase
            .from("suppliers")
            .select("balance")
            .eq("id", supplierId)
            .single();

          if (supplierData) {
            const supplierBalanceMultiplier = paymentDirection === "incoming" ? -1 : 1;
            const newSupplierBalance = supplierData.balance + (amount * supplierBalanceMultiplier);

            const { error: supplierUpdateError } = await supabase
              .from("suppliers")
              .update({
                balance: newSupplierBalance,
              })
              .eq("id", supplierId);

            if (supplierUpdateError) throw supplierUpdateError;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      toast.success(editingCheck?.id ? "Çek güncellendi" : "Çek kaydedildi", { duration: 1000 });
      onOpenChange(false);
      setEditingCheck?.(null);
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error(editingCheck?.id ? "Çek güncellenirken hata oluştu" : "Çek kaydedilirken hata oluştu", { duration: 2000 });
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
            
            // issue_date ve due_date zorunlu alanlar
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
          {/* Çek Tipi */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Çek Tipi</h3>
            {!editingCheck ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  className={
                    "p-3 rounded-lg border-2 text-left transition-all " +
                    (checkType === "incoming"
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                  }
                  onClick={() => {
                    setCheckType("incoming");
                    setStatus("portfoyde");
                  }}
                >
                  <div className="font-semibold text-sm mb-1">Gelen Çek</div>
                  <div className="text-xs text-gray-500">Müşteriden aldığımız</div>
                </button>
                <button
                  type="button"
                  className={
                    "p-3 rounded-lg border-2 text-left transition-all " +
                    (checkType === "outgoing"
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                  }
                  onClick={() => {
                    setCheckType("outgoing");
                    setStatus("odenecek");
                  }}
                >
                  <div className="font-semibold text-sm mb-1">Giden Çek</div>
                  <div className="text-xs text-gray-500">Tedarikçiye verdiğimiz</div>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="font-semibold text-sm text-gray-900">
                  {checkType === "incoming" ? "Gelen Çek" : "Giden Çek"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {checkType === "incoming" ? "Müşteriden aldığımız" : "Tedarikçiye verdiğimiz"}
                </div>
              </div>
            )}
          </div>

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
                  {checkType === "incoming" ? (
                    <>
                      <SelectItem value="portfoyde">Portföyde</SelectItem>
                      <SelectItem value="bankaya_verildi">Bankaya Verildi</SelectItem>
                      <SelectItem value="tahsil_edildi">Tahsil Edildi</SelectItem>
                      <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="odenecek">Ödenecek</SelectItem>
                      <SelectItem value="odendi">Ödendi</SelectItem>
                    </>
                  )}
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
              {checkType === "incoming" ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="issuer_name" className="text-sm font-medium text-gray-700">
                      Keşideci (Müşteri)
                    </Label>
                    <FormProvider {...issuerForm}>
                      <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Müşteri seçin..." />
                    </FormProvider>
                    <input type="hidden" id="issuer_name" name="issuer_name" value={issuerName} />
                    <input type="hidden" name="issuer_customer_id" value={issuerSelectedId} />
                    <input type="hidden" name="issuer_supplier_id" value={issuerSupplierId} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payee" className="text-sm font-medium text-gray-700">
                      Lehtar
                    </Label>
                    <Input 
                      id="payee" 
                      name="payee" 
                      value={companyName} 
                      disabled
                      className="bg-gray-50 h-9"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="issuer_name" className="text-sm font-medium text-gray-700">
                      Keşideci
                    </Label>
                    <Input 
                      id="issuer_name" 
                      name="issuer_name" 
                      value={companyName} 
                      disabled
                      className="bg-gray-50 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payee" className="text-sm font-medium text-gray-700">
                      Lehtar (Tedarikçi)
                    </Label>
                    <FormProvider {...payeeForm}>
                      <ProposalPartnerSelect partnerType="supplier" hideLabel placeholder="Tedarikçi seçin..." />
                    </FormProvider>
                    <input type="hidden" id="payee" name="payee" value={payeeName} />
                    <input type="hidden" name="payee_supplier_id" value={payeeSupplierId} />
                  </div>
                </>
              )}
            </div>
          </div>


          {/* Tahsil Edilen Hesap - Gelen çek ve tahsil_edildi durumunda */}
          {checkType === "incoming" && status === "tahsil_edildi" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Tahsil Edilen Hesap</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="receipt_account_type" className="text-sm font-medium text-gray-700">
                    Hesap Türü
                  </Label>
                  <Select value={paymentAccountType} onValueChange={(value) => {
                    setPaymentAccountType(value as "cash" | "bank" | "credit_card" | "partner");
                    setSelectedPaymentAccountId("");
                  }}>
                    <SelectTrigger className="h-9">
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
                <div className="space-y-1">
                  <Label htmlFor="receipt_account" className="text-sm font-medium text-gray-700">
                    Hesap
                  </Label>
                  <Select value={selectedPaymentAccountId} onValueChange={setSelectedPaymentAccountId}>
                    <SelectTrigger className="h-9">
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
              <input type="hidden" name="receipt_account_type" value={paymentAccountType} />
              <input type="hidden" name="receipt_account_id" value={selectedPaymentAccountId} />
              <p className="text-xs text-gray-500 mt-1">
                Bu çek hangi hesaba tahsil edildi?
              </p>
            </div>
          )}

          {/* Ödenen Hesap - Giden çek ve odendi durumunda */}
          {checkType === "outgoing" && status === "odendi" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Ödenen Hesap</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="payment_account_type" className="text-sm font-medium text-gray-700">
                    Hesap Türü
                  </Label>
                  <Select value={paymentAccountType} onValueChange={(value) => {
                    setPaymentAccountType(value as "cash" | "bank" | "credit_card" | "partner");
                    setSelectedPaymentAccountId("");
                  }}>
                    <SelectTrigger className="h-9">
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
                <div className="space-y-1">
                  <Label htmlFor="payment_account" className="text-sm font-medium text-gray-700">
                    Hesap
                  </Label>
                  <Select value={selectedPaymentAccountId} onValueChange={setSelectedPaymentAccountId}>
                    <SelectTrigger className="h-9">
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
              <input type="hidden" name="payment_account_type" value={paymentAccountType} />
              <input type="hidden" name="payment_account_id" value={selectedPaymentAccountId} />
              <p className="text-xs text-gray-500 mt-1">
                Bu çek hangi hesaptan ödendi?
              </p>
            </div>
          )}

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


