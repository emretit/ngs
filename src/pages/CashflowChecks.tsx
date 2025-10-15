import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Calendar, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useForm, FormProvider } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusConfig } from "@/utils/cashflowUtils";

interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  issuer_name?: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface Bank {
  id: string;
  name: string;
  short_name?: string | null;
}

const CashflowChecks = () => {
  const [checkDialog, setCheckDialog] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [checkStatus, setCheckStatus] = useState("pending");
  const [checkType, setCheckType] = useState<"incoming" | "outgoing">("incoming");
  
  // Filtreleme state'leri
  const [incomingSearchQuery, setIncomingSearchQuery] = useState("");
  const [incomingStatusFilter, setIncomingStatusFilter] = useState("all");
  const [incomingStartDate, setIncomingStartDate] = useState<Date | undefined>(undefined);
  const [incomingEndDate, setIncomingEndDate] = useState<Date | undefined>(undefined);
  
  const [outgoingSearchQuery, setOutgoingSearchQuery] = useState("");
  const [outgoingStatusFilter, setOutgoingStatusFilter] = useState("all");
  const [outgoingStartDate, setOutgoingStartDate] = useState<Date | undefined>(undefined);
  const [outgoingEndDate, setOutgoingEndDate] = useState<Date | undefined>(undefined);
  
  // Ödenen hesap seçimi için
  const [paymentAccountType, setPaymentAccountType] = useState<"cash" | "bank" | "credit_card" | "partner">("bank");
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>("");
  
  // Check form states
  const [bankName, setBankName] = useState<string>("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const issuerForm = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const payeeForm = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const [issuerName, setIssuerName] = useState<string>("");
  const [payeeName, setPayeeName] = useState<string>("");
  const { customers = [], suppliers = [] } = useCustomerSelect();
  const issuerSelectedId = issuerForm.watch("customer_id");
  const payeeSelectedId = payeeForm.watch("customer_id");
  const issuerSupplierId = issuerForm.watch("supplier_id");
  const payeeSupplierId = payeeForm.watch("supplier_id");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch checks
  const { data: checks = [] } = useQuery({
    queryKey: ["checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Check[]) || [];
    },
  });

  // Fetch banks
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
    }
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

  // Update issuer/payee names when customer/supplier selection changes
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

  // Update form state when editing check
  useEffect(() => {
    if (editingCheck) {
      setBankName(editingCheck.bank || (banks[0]?.name || ""));
      setIssueDate(editingCheck.issue_date ? new Date(editingCheck.issue_date) : undefined);
      setDueDate(editingCheck.due_date ? new Date(editingCheck.due_date) : undefined);
      setIssuerName(editingCheck.issuer_name || "");
      setPayeeName(editingCheck.payee || "");
      setCheckStatus(editingCheck.status || "pending");
    } else {
      setBankName(banks[0]?.name || "");
      setIssueDate(undefined);
      setDueDate(undefined);
      setIssuerName("");
      setPayeeName("");
      setCheckStatus("pending");
      issuerForm.reset({ customer_id: "", supplier_id: "" });
      payeeForm.reset({ customer_id: "", supplier_id: "" });
    }
  }, [editingCheck, banks]);

  // Update default status when check type changes
  useEffect(() => {
    if (!editingCheck) {
      if (checkType === "incoming") {
        setCheckStatus("portfoyde");
      } else if (checkType === "outgoing") {
        setCheckStatus("odenecek");
      }
    }
  }, [checkType, editingCheck]);

  // Reset payment account selection when account type changes
  useEffect(() => {
    setSelectedPaymentAccountId("");
  }, [paymentAccountType]);

  // Check mutations
  const saveCheckMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const status = formData.get("status") as string;
      const checkData: any = {
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat(formData.get("amount") as string),
        bank: formData.get("bank") as string,
        issuer_name: checkType === "outgoing" ? "NGS İLETİŞİM" : (formData.get("issuer_name") as string),
        payee: checkType === "incoming" ? "NGS İLETİŞİM" : (formData.get("payee") as string),
        status: status,
        notes: formData.get("notes") as string,
      };

      if (status === "ciro_edildi") {
        const supplierId = formData.get("transferred_to_supplier_id") as string;
        const transferredDate = formData.get("transferred_date") as string;
        if (supplierId) {
          checkData.transferred_to_supplier_id = supplierId;
          checkData.transferred_date = transferredDate || new Date().toISOString();
        }
      }

      if (editingCheck) {
        const { error } = await supabase
          .from("checks")
          .update(checkData)
          .eq("id", editingCheck.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("checks")
          .insert([checkData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      setCheckDialog(false);
      setEditingCheck(null);
      toast({ title: "Başarılı", description: "Çek kaydedildi" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      toast({ title: "Başarılı", description: "Çek silindi" });
    },
  });

  // Gelen çekler
  const allIncomingChecks = checks.filter(check => 
    (check.payee === 'NGS İLETİŞİM' || check.payee === 'NGS İLETİŞİM A.Ş.') &&
    !['ciro_edildi'].includes(check.status)
  );

  // Giden çekler
  const allOutgoingChecks = checks.filter(check => 
    (check.issuer_name === 'NGS İLETİŞİM' || check.issuer_name === 'NGS İLETİŞİM A.Ş.') ||
    check.status === 'ciro_edildi'
  );

  // Filtrelenmiş gelen çekler
  const incomingChecks = useMemo(() => {
    return allIncomingChecks.filter(check => {
      const matchesSearch = !incomingSearchQuery || 
        check.check_number.toLowerCase().includes(incomingSearchQuery.toLowerCase()) ||
        check.issuer_name?.toLowerCase().includes(incomingSearchQuery.toLowerCase()) ||
        check.bank.toLowerCase().includes(incomingSearchQuery.toLowerCase());
      
      const matchesStatus = incomingStatusFilter === "all" || check.status === incomingStatusFilter;
      
      let matchesDate = true;
      if (incomingStartDate || incomingEndDate) {
        const checkDate = new Date(check.due_date);
        const startDate = incomingStartDate ? new Date(incomingStartDate) : null;
        const endDate = incomingEndDate ? new Date(incomingEndDate) : null;
        
        if (startDate && endDate) {
          matchesDate = checkDate >= startDate && checkDate <= endDate;
        } else if (startDate) {
          matchesDate = checkDate >= startDate;
        } else if (endDate) {
          matchesDate = checkDate <= endDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allIncomingChecks, incomingSearchQuery, incomingStatusFilter, incomingStartDate, incomingEndDate]);

  // Filtrelenmiş giden çekler
  const outgoingChecks = useMemo(() => {
    return allOutgoingChecks.filter(check => {
      const matchesSearch = !outgoingSearchQuery || 
        check.check_number.toLowerCase().includes(outgoingSearchQuery.toLowerCase()) ||
        check.payee.toLowerCase().includes(outgoingSearchQuery.toLowerCase()) ||
        check.bank.toLowerCase().includes(outgoingSearchQuery.toLowerCase());
      
      const matchesStatus = outgoingStatusFilter === "all" || check.status === outgoingStatusFilter;
      
      let matchesDate = true;
      if (outgoingStartDate || outgoingEndDate) {
        const checkDate = new Date(check.due_date);
        const startDate = outgoingStartDate ? new Date(outgoingStartDate) : null;
        const endDate = outgoingEndDate ? new Date(outgoingEndDate) : null;
        
        if (startDate && endDate) {
          matchesDate = checkDate >= startDate && checkDate <= endDate;
        } else if (startDate) {
          matchesDate = checkDate >= startDate;
        } else if (endDate) {
          matchesDate = checkDate <= endDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allOutgoingChecks, outgoingSearchQuery, outgoingStatusFilter, outgoingStartDate, outgoingEndDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gelen Çekler Kartı */}
        <Card className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Gelen Çekler</h3>
                  <p className="text-sm text-gray-600">Müşterilerden aldığımız çekler</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Tutar</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(incomingChecks.reduce((sum, check) => sum + check.amount, 0))}
                </span>
              </div>
              
              {/* Durum Kartları */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-2 text-center">
                  <div className="text-xs text-orange-600 font-medium mb-1">Portföyde</div>
                  <div className="text-sm font-bold text-orange-700">
                    {incomingChecks.filter(check => check.status === 'portfoyde').length}
                  </div>
                  <div className="text-xs text-orange-500 truncate">
                    {formatCurrency(incomingChecks.filter(check => check.status === 'portfoyde').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-center">
                  <div className="text-xs text-blue-600 font-medium mb-1">Bankaya</div>
                  <div className="text-sm font-bold text-blue-700">
                    {incomingChecks.filter(check => check.status === 'bankaya_verildi').length}
                  </div>
                  <div className="text-xs text-blue-500 truncate">
                    {formatCurrency(incomingChecks.filter(check => check.status === 'bankaya_verildi').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
                  <div className="text-xs text-green-600 font-medium mb-1">Tahsil</div>
                  <div className="text-sm font-bold text-green-700">
                    {incomingChecks.filter(check => check.status === 'tahsil_edildi').length}
                  </div>
                  <div className="text-xs text-green-500 truncate">
                    {formatCurrency(incomingChecks.filter(check => check.status === 'tahsil_edildi').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-center">
                  <div className="text-xs text-purple-600 font-medium mb-1">Ciro</div>
                  <div className="text-sm font-bold text-purple-700">
                    {incomingChecks.filter(check => check.status === 'ciro_edildi').length}
                  </div>
                  <div className="text-xs text-purple-500 truncate">
                    {formatCurrency(incomingChecks.filter(check => check.status === 'ciro_edildi').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Portföydeki Çekler</h4>
                <Dialog open={checkDialog} onOpenChange={setCheckDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingCheck(null);
                        setCheckType("incoming");
                        setCheckStatus("portfoyde");
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Çek
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
              
              {/* Filtreleme */}
              <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Çek no, keşideci veya banka ile ara..."
                    value={incomingSearchQuery}
                    onChange={(e) => setIncomingSearchQuery(e.target.value)}
                    className="pl-10 w-full h-8 text-sm"
                  />
                </div>

                <Select value={incomingStatusFilter} onValueChange={setIncomingStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="portfoyde">Portföyde</SelectItem>
                    <SelectItem value="bankaya_verildi">Bankaya Verildi</SelectItem>
                    <SelectItem value="tahsil_edildi">Tahsil Edildi</SelectItem>
                    <SelectItem value="ciro_edildi">Ciro Edildi</SelectItem>
                    <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <EnhancedDatePicker
                    date={incomingStartDate}
                    onSelect={(newDate) => newDate && setIncomingStartDate(newDate)}
                    placeholder="Başlangıç"
                    className="w-32 text-xs h-8"
                  />
                  <span className="text-muted-foreground text-sm">-</span>
                  <EnhancedDatePicker
                    date={incomingEndDate}
                    onSelect={(newDate) => newDate && setIncomingEndDate(newDate)}
                    placeholder="Bitiş"
                    className="w-32 text-xs h-8"
                  />
                </div>
              </div>
              
              {/* Tablo */}
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-600">Çek No</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Keşideci</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Vade</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-right">Tutar</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Durum</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomingChecks.slice(0, 5).map((check) => (
                      <TableRow key={check.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium">{check.check_number}</TableCell>
                        <TableCell className="text-xs">{check.issuer_name || "-"}</TableCell>
                        <TableCell className="text-xs">{format(new Date(check.due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatCurrency(check.amount)}</TableCell>
                        <TableCell>{<Badge variant={getStatusConfig(check.status).variant}>{getStatusConfig(check.status).label}</Badge>}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-1">
                            {check.status === 'portfoyde' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setEditingCheck(check);
                                  setCheckStatus("ciro_edildi");
                                  setCheckType("incoming");
                                  setCheckDialog(true);
                                }}
                              >
                                Ciro Et
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingCheck(check);
                                setCheckStatus(check.status);
                                setCheckType("incoming");
                                setCheckDialog(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteCheckMutation.mutate(check.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {incomingChecks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-4">
                          Henüz gelen çek bulunmuyor
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {incomingChecks.length > 5 && (
                <div className="mt-2 text-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    Tümünü Gör ({incomingChecks.length} çek)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Giden Çekler Kartı */}
        <Card className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Giden Çekler</h3>
                  <p className="text-sm text-gray-600">Tedarikçilere verdiğimiz çekler</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Tutar</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(outgoingChecks.reduce((sum, check) => sum + check.amount, 0))}
                </span>
              </div>
              
              {/* Durum Kartları */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-orange-50 border border-orange-200 rounded-md p-2 text-center">
                  <div className="text-xs text-orange-600 font-medium mb-1">Ödenecek</div>
                  <div className="text-sm font-bold text-orange-700">
                    {outgoingChecks.filter(check => check.status === 'odenecek').length}
                  </div>
                  <div className="text-xs text-orange-500 truncate">
                    {formatCurrency(outgoingChecks.filter(check => check.status === 'odenecek').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-2 text-center">
                  <div className="text-xs text-green-600 font-medium mb-1">Ödendi</div>
                  <div className="text-sm font-bold text-green-700">
                    {outgoingChecks.filter(check => check.status === 'odendi').length}
                  </div>
                  <div className="text-xs text-green-500 truncate">
                    {formatCurrency(outgoingChecks.filter(check => check.status === 'odendi').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-2 text-center">
                  <div className="text-xs text-red-600 font-medium mb-1">Karşılıksız</div>
                  <div className="text-sm font-bold text-red-700">
                    {outgoingChecks.filter(check => check.status === 'karsilik_yok').length}
                  </div>
                  <div className="text-xs text-red-500 truncate">
                    {formatCurrency(outgoingChecks.filter(check => check.status === 'karsilik_yok').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-md p-2 text-center">
                  <div className="text-xs text-purple-600 font-medium mb-1">Ciro</div>
                  <div className="text-sm font-bold text-purple-700">
                    {outgoingChecks.filter(check => check.status === 'ciro_edildi').length}
                  </div>
                  <div className="text-xs text-purple-500 truncate">
                    {formatCurrency(outgoingChecks.filter(check => check.status === 'ciro_edildi').reduce((sum, check) => sum + check.amount, 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Verdiğimiz Çekler</h4>
                <Dialog open={checkDialog} onOpenChange={setCheckDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingCheck(null);
                        setCheckType("outgoing");
                        setCheckStatus("odenecek");
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Çek
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
              
              {/* Filtreleme */}
              <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Çek no, lehtar veya banka ile ara..."
                    value={outgoingSearchQuery}
                    onChange={(e) => setOutgoingSearchQuery(e.target.value)}
                    className="pl-10 w-full h-8 text-sm"
                  />
                </div>

                <Select value={outgoingStatusFilter} onValueChange={setOutgoingStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="odenecek">Ödenecek</SelectItem>
                    <SelectItem value="odendi">Ödendi</SelectItem>
                    <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                    <SelectItem value="ciro_edildi">Ciro Edildi</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <EnhancedDatePicker
                    date={outgoingStartDate}
                    onSelect={(newDate) => newDate && setOutgoingStartDate(newDate)}
                    placeholder="Başlangıç"
                    className="w-32 text-xs h-8"
                  />
                  <span className="text-muted-foreground text-sm">-</span>
                  <EnhancedDatePicker
                    date={outgoingEndDate}
                    onSelect={(newDate) => newDate && setOutgoingEndDate(newDate)}
                    placeholder="Bitiş"
                    className="w-32 text-xs h-8"
                  />
                </div>
              </div>
              
              {/* Tablo */}
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-600">Çek No</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Keşideci</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Lehtar</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Vade</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-right">Tutar</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Durum</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoingChecks.slice(0, 5).map((check) => (
                      <TableRow key={check.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium">{check.check_number}</TableCell>
                        <TableCell className="text-xs">{check.issuer_name}</TableCell>
                        <TableCell className="text-xs">{check.payee}</TableCell>
                        <TableCell className="text-xs">{format(new Date(check.due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{formatCurrency(check.amount)}</TableCell>
                        <TableCell>{<Badge variant={getStatusConfig(check.status).variant}>{getStatusConfig(check.status).label}</Badge>}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-1">
                            {check.status === 'odenecek' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setEditingCheck(check);
                                  setCheckStatus("odendi");
                                  setCheckType("outgoing");
                                  setCheckDialog(true);
                                }}
                              >
                                Ödeme Yap
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingCheck(check);
                                setCheckStatus(check.status);
                                if (check.status === 'ciro_edildi') {
                                  setCheckType("incoming");
                                } else {
                                  setCheckType("outgoing");
                                }
                                setCheckDialog(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteCheckMutation.mutate(check.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {outgoingChecks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-4">
                          Henüz giden çek bulunmuyor
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {outgoingChecks.length > 5 && (
                <div className="mt-2 text-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    Tümünü Gör ({outgoingChecks.length} çek)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check Dialog */}
      <Dialog open={checkDialog} onOpenChange={setCheckDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCheck ? "Çek Düzenle" : "Yeni Çek Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              saveCheckMutation.mutate(formData);
            }}
          >
            {!editingCheck && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Çek Tipi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={
                      "p-2 rounded border text-left transition-colors " +
                      (checkType === "incoming"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                    }
                    onClick={() => setCheckType("incoming")}
                  >
                    <div className="font-medium text-sm">Gelen Çek</div>
                    <div className="text-xs text-gray-500">Müşteriden aldığımız</div>
                  </button>
                  <button
                    type="button"
                    className={
                      "p-2 rounded border text-left transition-colors " +
                      (checkType === "outgoing"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                    }
                    onClick={() => setCheckType("outgoing")}
                  >
                    <div className="font-medium text-sm">Giden Çek</div>
                    <div className="text-xs text-gray-500">Tedarikçiye verdiğimiz</div>
                  </button>
                </div>
              </div>
            )}

            {editingCheck && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Çek Tipi</Label>
                <div className="p-2 rounded border bg-gray-50">
                  <div className="font-medium text-sm">
                    {checkType === "incoming" ? "Gelen Çek" : "Giden Çek"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {checkType === "incoming" ? "Müşteriden aldığımız" : "Tedarikçiye verdiğimiz"}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="check_number">Çek No</Label>
                  <Input
                    id="check_number"
                    name="check_number"
                    defaultValue={editingCheck?.check_number || ""}
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank">Banka</Label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger id="bank" className="h-8 text-sm">
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
                  <input type="hidden" name="bank" value={bankName} />
                </div>
                <div>
                  <Label>Düzenleme Tarihi</Label>
                  <div className="[&_button]:h-8 [&_button]:text-sm">
                    <EnhancedDatePicker date={issueDate} onSelect={setIssueDate} placeholder="Tarih seçin" />
                  </div>
                  <input type="hidden" name="issue_date" value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""} />
                </div>
                <div>
                  <Label>Vade Tarihi</Label>
                  <div className="[&_button]:h-8 [&_button]:text-sm">
                    <EnhancedDatePicker date={dueDate} onSelect={setDueDate} placeholder="Tarih seçin" />
                  </div>
                  <input type="hidden" name="due_date" value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""} />
                </div>
                <div>
                  <Label htmlFor="amount">Tutar (₺)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={editingCheck?.amount || ""}
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Durum</Label>
                  <Select value={checkStatus} onValueChange={setCheckStatus}>
                    <SelectTrigger className="h-8 text-sm">
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
                  <input type="hidden" name="status" value={checkStatus} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">Taraf Bilgileri</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {checkType === "incoming" ? (
                  <>
                    <div>
                      <Label htmlFor="issuer_name">Keşideci (Müşteri)</Label>
                      <div className="[&_button]:h-8 [&_button]:text-sm">
                        <FormProvider {...issuerForm}>
                          <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Müşteri seçin..." />
                        </FormProvider>
                      </div>
                      <input type="hidden" id="issuer_name" name="issuer_name" value={issuerName} />
                      <input type="hidden" name="issuer_customer_id" value={issuerSelectedId} />
                    </div>
                    <div>
                      <Label htmlFor="payee">Lehtar</Label>
                      <Input 
                        id="payee" 
                        name="payee" 
                        value="NGS İLETİŞİM" 
                        disabled
                        className="bg-gray-50 h-8 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="issuer_name">Keşideci</Label>
                      <Input 
                        id="issuer_name" 
                        name="issuer_name" 
                        value="NGS İLETİŞİM" 
                        disabled
                        className="bg-gray-50 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payee">Lehtar (Tedarikçi)</Label>
                      <div className="[&_button]:h-8 [&_button]:text-sm">
                        <FormProvider {...payeeForm}>
                          <ProposalPartnerSelect partnerType="supplier" hideLabel placeholder="Tedarikçi seçin..." />
                        </FormProvider>
                      </div>
                      <input type="hidden" id="payee" name="payee" value={payeeName} />
                      <input type="hidden" name="payee_supplier_id" value={payeeSupplierId} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {checkType === "incoming" && checkStatus === "ciro_edildi" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">Ciro Et</h4>
                <div>
                  <Label htmlFor="transferred_supplier">Hangi Tedarikçiye Ciro Edildi?</Label>
                  <div className="[&_button]:h-8 [&_button]:text-sm">
                    <FormProvider {...payeeForm}>
                      <ProposalPartnerSelect partnerType="supplier" hideLabel placeholder="Tedarikçi seçin..." />
                    </FormProvider>
                  </div>
                  <input type="hidden" name="transferred_to_supplier_id" value={payeeSupplierId} />
                  <input type="hidden" name="transferred_date" value={new Date().toISOString()} />
                  <p className="text-xs text-gray-500 mt-1">
                    Bu çek seçilen tedarikçiye ciro edilecek
                  </p>
                </div>
              </div>
            )}

            {checkStatus === "odendi" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">Ödenen Hesap</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="payment_account_type">Hesap Türü</Label>
                    <Select value={paymentAccountType} onValueChange={setPaymentAccountType}>
                      <SelectTrigger className="h-8 text-sm">
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
                  <div>
                    <Label htmlFor="payment_account">Hesap</Label>
                    <Select value={selectedPaymentAccountId} onValueChange={setSelectedPaymentAccountId}>
                      <SelectTrigger className="h-8 text-sm">
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
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">Notlar</h4>
              <div>
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingCheck?.notes || ""}
                  placeholder="Notlar..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCheckDialog(false)}>
                İptal
              </Button>
              <Button type="submit">
                Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashflowChecks;

