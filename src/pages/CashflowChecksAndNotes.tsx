import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Download, Receipt, Search, Calendar, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CustomTabs as Tabs,
  CustomTabsContent as TabsContent,
  CustomTabsList as TabsList,
  CustomTabsTrigger as TabsTrigger
} from "@/components/ui/custom-tabs";
import { Textarea } from "@/components/ui/textarea";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useForm, FormProvider } from "react-hook-form";

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

interface FinancialInstrument {
  id: string;
  instrument_type: "check" | "promissory_note";
  instrument_number: string;
  issuer_name: string;
  recipient_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  bank_account_id?: string;
  bank_name?: string;
  branch_name?: string;
  currency: string;
  notes?: string;
  created_at: string;
}

const CashflowChecksAndNotes = () => {
  const [activeTab, setActiveTab] = useState("checks");
  const [checkDialog, setCheckDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [editingNote, setEditingNote] = useState<FinancialInstrument | null>(null);
  const [checkFilters, setCheckFilters] = useState({ status: "all", dateRange: "" });
  const [noteFilters, setNoteFilters] = useState({ status: "all", dateRange: "" });
  const [checkStatus, setCheckStatus] = useState("pending");
  const [noteStatus, setNoteStatus] = useState("pending");
  
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

  // Fetch promissory notes (senetler)
  const { data: notes = [] } = useQuery({
    queryKey: ["financial_instruments", "promissory_note"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_instruments")
        .select("*")
        .eq("instrument_type", "promissory_note")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as FinancialInstrument[]) || [];
    },
  });

  // Fetch banks (for selects)
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

  // Check mutations
  const saveCheckMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const checkData = {
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat(formData.get("amount") as string),
        bank: formData.get("bank") as string,
        issuer_name: formData.get("issuer_name") as string,
        payee: formData.get("payee") as string,
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      };

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

  // Note mutations
  const saveNoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const noteData = {
        instrument_type: "promissory_note" as const,
        instrument_number: formData.get("instrument_number") as string,
        issuer_name: formData.get("issuer_name") as string,
        recipient_name: formData.get("recipient_name") as string,
        amount: parseFloat(formData.get("amount") as string),
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        bank_name: formData.get("bank_name") as string,
        branch_name: formData.get("branch_name") as string,
        currency: formData.get("currency") as string || "TRY",
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      };

      if (editingNote) {
        const { error } = await supabase
          .from("financial_instruments")
          .update(noteData)
          .eq("id", editingNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_instruments")
          .insert([noteData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_instruments"] });
      setNoteDialog(false);
      setEditingNote(null);
      toast({ title: "Başarılı", description: "Senet kaydedildi" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutations
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

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_instruments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_instruments"] });
      toast({ title: "Başarılı", description: "Senet silindi" });
    },
  });

  // Calculate summary data
  const totalPendingChecks = checks.filter(check => check.status === "odenecek" || check.status === "pending").reduce((sum, check) => sum + check.amount, 0);
  const totalPendingNotes = notes.filter(note => note.status === "pending").reduce((sum, note) => sum + note.amount, 0);
  const overdueChecks = checks.filter(check => {
    const dueDate = new Date(check.due_date);
    return dueDate < new Date() && (check.status === "odenecek" || check.status === "pending");
  }).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Beklemede", variant: "secondary" as const },
      odenecek: { label: "Ödenecek", variant: "destructive" as const },
      odendi: { label: "Ödendi", variant: "default" as const },
      cleared: { label: "Tahsil Edildi", variant: "default" as const },
      bounced: { label: "Karşılıksız", variant: "destructive" as const },
      karsilik_yok: { label: "Karşılıksız", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  const NoteForm = () => {
    const currentNoteStatus = editingNote?.status || "pending";
    const [issueDate, setIssueDate] = useState<Date | undefined>(
      editingNote?.issue_date ? new Date(editingNote.issue_date) : undefined
    );
    const [dueDate, setDueDate] = useState<Date | undefined>(
      editingNote?.due_date ? new Date(editingNote.due_date) : undefined
    );
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="instrument_number">Senet No</Label>
            <Input
              id="instrument_number"
              name="instrument_number"
              defaultValue={editingNote?.instrument_number || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Tutar</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={editingNote?.amount || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issuer_name">Keşideci</Label>
            <Input
              id="issuer_name"
              name="issuer_name"
              defaultValue={editingNote?.issuer_name || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="recipient_name">Lehtar</Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              defaultValue={editingNote?.recipient_name || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Düzenleme Tarihi</Label>
            <EnhancedDatePicker date={issueDate} onSelect={setIssueDate} placeholder="Tarih seçin" />
            <input type="hidden" name="issue_date" value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""} />
          </div>
          <div>
            <Label>Vade Tarihi</Label>
            <EnhancedDatePicker date={dueDate} onSelect={setDueDate} placeholder="Tarih seçin" />
            <input type="hidden" name="due_date" value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bank_name">Banka</Label>
            <Input
              id="bank_name"
              name="bank_name"
              defaultValue={editingNote?.bank_name || ""}
            />
          </div>
          <div>
            <Label htmlFor="branch_name">Şube</Label>
            <Input
              id="branch_name"
              name="branch_name"
              defaultValue={editingNote?.branch_name || ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency">Para Birimi</Label>
            <Select name="currency" defaultValue={editingNote?.currency || "TRY"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Durum</Label>
            <Select 
              value={noteStatus} 
              onValueChange={setNoteStatus}
              defaultValue={currentNoteStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="cleared">Tahsil Edildi</SelectItem>
                <SelectItem value="bounced">Karşılıksız</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={noteStatus} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={editingNote?.notes || ""}
            placeholder="Notlar..."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setNoteDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={(e) => {
              const form = e.currentTarget.closest("form") as HTMLFormElement;
              const formData = new FormData(form);
              saveNoteMutation.mutate(formData);
            }}
          >
            Kaydet
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Çekler ve Senetler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Çek ve senet işlemlerinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="group relative overflow-hidden bg-white border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Bekleyen Çek</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">
              {formatCurrency(totalPendingChecks)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-orange-100 rounded-full">
                <span className="text-xs font-medium text-orange-700">Beklemede</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Bekleyen Senet</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(totalPendingNotes)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">Beklemede</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-red-100 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Vadesi Geçmiş Çek</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
              {overdueChecks}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-red-100 rounded-full">
                <span className="text-xs font-medium text-red-700">Vadesi geçti</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm flex flex-nowrap justify-start sm:justify-center">
              <TabsTrigger value="checks" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 font-medium">
                <span>📄</span>
                <span>Çekler</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 font-medium">
                <span>📋</span>
                <span>Senetler</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="checks" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Select
                    value={checkFilters.status}
                    onValueChange={(value) => setCheckFilters({ ...checkFilters, status: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Durum filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="odenecek">Ödenecek</SelectItem>
                      <SelectItem value="odendi">Ödendi</SelectItem>
                      <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
                <Dialog open={checkDialog} onOpenChange={setCheckDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingCheck(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Çek
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCheck ? "Çek Düzenle" : "Yeni Çek Ekle"}
                      </DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="check_number">Çek No</Label>
                          <Input
                            id="check_number"
                            name="check_number"
                            defaultValue={editingCheck?.check_number || ""}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="bank">Banka</Label>
                          <Select value={bankName} onValueChange={setBankName}>
                            <SelectTrigger id="bank">
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Düzenleme Tarihi</Label>
                          <EnhancedDatePicker date={issueDate} onSelect={setIssueDate} placeholder="Tarih seçin" />
                          <input type="hidden" name="issue_date" value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""} />
                        </div>
                        <div>
                          <Label>Vade Tarihi</Label>
                          <EnhancedDatePicker date={dueDate} onSelect={setDueDate} placeholder="Tarih seçin" />
                          <input type="hidden" name="due_date" value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="amount">Tutar</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={editingCheck?.amount || ""}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Durum</Label>
                          <Select 
                            value={checkStatus} 
                            onValueChange={setCheckStatus}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Durum seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Beklemede</SelectItem>
                              <SelectItem value="odenecek">Ödenecek</SelectItem>
                              <SelectItem value="odendi">Ödendi</SelectItem>
                              <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="status" value={checkStatus} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="issuer_name">Keşideci (çeki düzenleyen)</Label>
                          <FormProvider {...issuerForm}>
                            <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Firma seçin..." />
                          </FormProvider>
                          <input type="hidden" id="issuer_name" name="issuer_name" value={issuerName} />
                          <input type="hidden" name="issuer_customer_id" value={issuerSelectedId} />
                          <input type="hidden" name="issuer_supplier_id" value={issuerSupplierId} />
                        </div>
                        <div>
                          <Label htmlFor="payee">Lehtar (çeki alan)</Label>
                          <FormProvider {...payeeForm}>
                            <ProposalPartnerSelect partnerType="customer" hideLabel placeholder="Firma seçin..." />
                          </FormProvider>
                          <input type="hidden" id="payee" name="payee" value={payeeName} />
                          <input type="hidden" name="payee_customer_id" value={payeeSelectedId} />
                          <input type="hidden" name="payee_supplier_id" value={payeeSupplierId} />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notlar</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          defaultValue={editingCheck?.notes || ""}
                          placeholder="Notlar..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setCheckDialog(false)}>
                          İptal
                        </Button>
                        <Button
                          onClick={(e) => {
                            const form = e.currentTarget.closest("form") as HTMLFormElement;
                            const formData = new FormData(form);
                            saveCheckMutation.mutate(formData);
                          }}
                        >
                          Kaydet
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Çek No</TableHead>
                      <TableHead>Düzenleme Tarihi</TableHead>
                      <TableHead>Vade Tarihi</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Banka</TableHead>
                      <TableHead>Lehtar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checks
                      .filter(check => checkFilters.status === "all" || check.status === checkFilters.status)
                      .map((check) => (
                        <TableRow key={check.id}>
                          <TableCell className="font-medium">{check.check_number}</TableCell>
                          <TableCell>{format(new Date(check.issue_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{format(new Date(check.due_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right">{formatCurrency(check.amount)}</TableCell>
                          <TableCell>{check.bank}</TableCell>
                          <TableCell>{check.payee}</TableCell>
                          <TableCell>{getStatusBadge(check.status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCheck(check);
                                  setCheckStatus(check.status);
                                  setCheckDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCheckMutation.mutate(check.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Select
                    value={noteFilters.status}
                    onValueChange={(value) => setNoteFilters({ ...noteFilters, status: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Durum filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="cleared">Tahsil Edildi</SelectItem>
                      <SelectItem value="bounced">Karşılıksız</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
                <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingNote(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Senet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingNote ? "Senet Düzenle" : "Yeni Senet Ekle"}
                      </DialogTitle>
                    </DialogHeader>
                    <form>
                      <NoteForm />
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Senet No</TableHead>
                      <TableHead>Keşideci</TableHead>
                      <TableHead>Lehtar</TableHead>
                      <TableHead>Düzenleme</TableHead>
                      <TableHead>Vade</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Banka</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notes
                      .filter(note => noteFilters.status === "all" || note.status === noteFilters.status)
                      .map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-medium">{note.instrument_number}</TableCell>
                          <TableCell>{note.issuer_name}</TableCell>
                          <TableCell>{note.recipient_name}</TableCell>
                          <TableCell>{format(new Date(note.issue_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{format(new Date(note.due_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right">{formatCurrency(note.amount)}</TableCell>
                          <TableCell>{note.bank_name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(note.status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNote(note);
                                  setNoteStatus(note.status);
                                  setNoteDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CashflowChecksAndNotes;
