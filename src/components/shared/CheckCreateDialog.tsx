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
}

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

  // Dialog açıldığında default değerleri form'a yükle
  useEffect(() => {
    if (open && !editingCheck) {
      // Gelen çek için müşteri seçimi
      if (defaultCheckType === "incoming" && defaultCustomerId) {
        issuerForm.setValue("customer_id", defaultCustomerId);
      }
      // Giden çek için tedarikçi seçimi
      if (defaultCheckType === "outgoing" && defaultSupplierId) {
        payeeForm.setValue("supplier_id", defaultSupplierId);
      }
    }
  }, [open, defaultCustomerId, defaultSupplierId, defaultCheckType, editingCheck]);

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
      const payload: any = {
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat((formData.get("amount") as string) || "0"),
        bank: formData.get("bank") as string,
        issuer_name: checkType === "outgoing" ? (companyName || "") : (formData.get("issuer_name") as string || ""),
        payee: checkType === "incoming" ? (companyName || "") : (formData.get("payee") as string || ""),
        status: formData.get("status") as string,
        notes: (formData.get("notes") as string) || null,
        check_type: checkType,
      };

      // Ciro edildi durumunda
      if (status === "ciro_edildi") {
        const supplierId = formData.get("transferred_to_supplier_id") as string;
        const transferredDate = formData.get("transferred_date") as string;
        if (supplierId) {
          payload.transferred_to_supplier_id = supplierId;
          payload.transferred_date = transferredDate || new Date().toISOString();
        }
      }

      // Tahsil Edildi durumunda hesap bilgileri (gelen çek)
      if (status === "tahsil_edildi") {
        const accountType = formData.get("receipt_account_type") as string;
        const accountId = formData.get("receipt_account_id") as string;
        if (accountType && accountId) {
          payload.receipt_account_type = accountType;
          payload.receipt_account_id = accountId;
        }
      }

      // Ödendi durumunda hesap bilgileri (giden çek)
      if (status === "odendi") {
        const accountType = formData.get("payment_account_type") as string;
        const accountId = formData.get("payment_account_id") as string;
        if (accountType && accountId) {
          payload.payment_account_type = accountType;
          payload.payment_account_id = accountId;
        }
      }

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
                      <SelectItem value="ciro_edildi">Ciro Edildi</SelectItem>
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

          {/* Ciro Edildi - Sadece incoming ve ciro_edildi durumunda */}
          {checkType === "incoming" && status === "ciro_edildi" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Ciro Et</h3>
              <div className="space-y-1">
                <Label htmlFor="transferred_supplier" className="text-sm font-medium text-gray-700">
                  Hangi Tedarikçiye Ciro Edildi?
                </Label>
                <FormProvider {...payeeForm}>
                  <ProposalPartnerSelect partnerType="supplier" hideLabel placeholder="Tedarikçi seçin..." />
                </FormProvider>
                <input type="hidden" name="transferred_to_supplier_id" value={payeeSupplierId} />
                <input type="hidden" name="transferred_date" value={new Date().toISOString()} />
                <p className="text-xs text-gray-500 mt-1">
                  Bu çek seçilen tedarikçiye ciro edilecek
                </p>
              </div>
            </div>
          )}

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


