import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Download, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
}

export function LoansAndChecks() {
  const [activeTab, setActiveTab] = useState("loans");
  const [loanDialog, setLoanDialog] = useState(false);
  const [checkDialog, setCheckDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [loanFilters, setLoanFilters] = useState({ status: "all", dateRange: "" });
  const [checkFilters, setCheckFilters] = useState({ status: "all", dateRange: "" });
  const [loanStatus, setLoanStatus] = useState("odenecek");
  const [checkStatus, setCheckStatus] = useState("odenecek");
  
  const queryClient = useQueryClient();

  // Fetch loans
  const { data: loans = [] } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Loan[]) || [];
    },
  });

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

  // Loan mutations
  const saveLoanMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Auth disabled - no user check needed

      const loanData = {
        user_id: '00000000-0000-0000-0000-000000000001', // Default user ID
        loan_name: formData.get("loan_name") as string,
        bank: formData.get("bank") as string,
        amount: parseFloat(formData.get("amount") as string),
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string,
        interest_rate: parseFloat(formData.get("interest_rate") as string),
        installment_amount: parseFloat(formData.get("installment_amount") as string),
        remaining_debt: parseFloat(formData.get("remaining_debt") as string),
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      };

      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", editingLoan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loans")
          .insert([loanData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setLoanDialog(false);
      setEditingLoan(null);
      toast.success("Kredi kaydedildi");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check mutations
  const saveCheckMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Auth disabled - no user check needed

      const checkData = {
        user_id: '00000000-0000-0000-0000-000000000001', // Default user ID
        check_number: formData.get("check_number") as string,
        issue_date: formData.get("issue_date") as string,
        due_date: formData.get("due_date") as string,
        amount: parseFloat(formData.get("amount") as string),
        bank: formData.get("bank") as string,
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
      toast.success("Çek kaydedildi");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete mutations
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast.success("Kredi silindi");
    },
  });

  const deleteCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      toast.success("Çek silindi");
    },
  });

  // Calculate summary data
  const totalLoanDebt = loans.reduce((sum, loan) => sum + loan.remaining_debt, 0);
  const totalPayableChecks = checks.filter(check => check.status === "odenecek").reduce((sum, check) => sum + check.amount, 0);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthPayments = loans.filter(loan => {
    const endDate = new Date(loan.end_date);
    return endDate.getMonth() + 1 === currentMonth && endDate.getFullYear() === currentYear;
  }).reduce((sum, loan) => sum + loan.installment_amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      odenecek: { label: "Ödenecek", variant: "destructive" as const },
      odendi: { label: "Ödendi", variant: "default" as const },
      karsilik_yok: { label: "Karşılıksız", variant: "secondary" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const LoanForm = () => {
    const currentLoanStatus = editingLoan?.status || "odenecek";
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loan_name">Kredi Adı</Label>
            <Input
              id="loan_name"
              name="loan_name"
              defaultValue={editingLoan?.loan_name || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="bank">Banka</Label>
            <Input
              id="bank"
              name="bank"
              defaultValue={editingLoan?.bank || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Tutar</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              defaultValue={editingLoan?.amount || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="interest_rate">Faiz Oranı (%)</Label>
            <Input
              id="interest_rate"
              name="interest_rate"
              type="number"
              step="0.01"
              defaultValue={editingLoan?.interest_rate || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Vade Başlangıcı</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={editingLoan?.start_date || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">Vade Sonu</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={editingLoan?.end_date || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="installment_amount">Aylık Taksit</Label>
            <Input
              id="installment_amount"
              name="installment_amount"
              type="number"
              defaultValue={editingLoan?.installment_amount || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="remaining_debt">Kalan Borç</Label>
            <Input
              id="remaining_debt"
              name="remaining_debt"
              type="number"
              defaultValue={editingLoan?.remaining_debt || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Ödeme Durumu</Label>
            <Select 
              value={loanStatus} 
              onValueChange={setLoanStatus}
              defaultValue={currentLoanStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odenecek">Ödenecek</SelectItem>
                <SelectItem value="odendi">Ödendi</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={loanStatus} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={editingLoan?.notes || ""}
            placeholder="Notlar..."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setLoanDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={(e) => {
              const form = e.currentTarget.closest("form") as HTMLFormElement;
              const formData = new FormData(form);
              saveLoanMutation.mutate(formData);
            }}
          >
            Kaydet
          </Button>
        </div>
      </div>
    );
  };

  const CheckForm = () => {
    const currentCheckStatus = editingCheck?.status || "odenecek";
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <Input
              id="bank"
              name="bank"
              defaultValue={editingCheck?.bank || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issue_date">Düzenleme Tarihi</Label>
            <Input
              id="issue_date"
              name="issue_date"
              type="date"
              defaultValue={editingCheck?.issue_date || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="due_date">Vade Tarihi</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              defaultValue={editingCheck?.due_date || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Tutar</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              defaultValue={editingCheck?.amount || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="payee">Lehtar</Label>
            <Input
              id="payee"
              name="payee"
              defaultValue={editingCheck?.payee || ""}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="status">Durum</Label>
          <Select 
            value={checkStatus} 
            onValueChange={setCheckStatus}
            defaultValue={currentCheckStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="odenecek">Ödenecek</SelectItem>
              <SelectItem value="odendi">Ödendi</SelectItem>
              <SelectItem value="karsilik_yok">Karşılıksız</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="status" value={checkStatus} />
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
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-white to-purple-50/50 rounded-2xl border border-purple-100/50 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Krediler ve Çekler</h1>
            <p className="text-gray-600 text-base">Kredi borçları ve çek yönetimi - Finansal yükümlülükler takibi</p>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden bg-white border border-red-100 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Kredi Borcu</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(totalLoanDebt)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-red-100 rounded-full">
                <span className="text-xs font-medium text-red-700">Kalan borç</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Ödenecek Çek</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">
              {formatCurrency(totalPayableChecks)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-orange-100 rounded-full">
                <span className="text-xs font-medium text-orange-700">Ödenecek</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Bu Ay Ödenecek Toplam</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(thisMonthPayments)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">Bu ay</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Detaylı Krediler ve Çekler Yönetimi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="loans"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-medium"
              >
                💳 Krediler
              </TabsTrigger>
              <TabsTrigger
                value="checks"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-medium"
              >
                📄 Çekler
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="loans" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Select
                    value={loanFilters.status}
                    onValueChange={(value) => setLoanFilters({ ...loanFilters, status: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Durum filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="odenecek">Ödenecek</SelectItem>
                      <SelectItem value="odendi">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
                <Dialog open={loanDialog} onOpenChange={setLoanDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kredi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLoan ? "Kredi Düzenle" : "Yeni Kredi Ekle"}
                      </DialogTitle>
                    </DialogHeader>
                    <form>
                      <LoanForm />
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kredi Adı</TableHead>
                      <TableHead>Banka</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Vade Başlangıcı</TableHead>
                      <TableHead>Vade Sonu</TableHead>
                      <TableHead className="text-right">Faiz Oranı</TableHead>
                      <TableHead className="text-right">Aylık Taksit</TableHead>
                      <TableHead className="text-right">Kalan Borç</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans
                      .filter(loan => loanFilters.status === "all" || loan.status === loanFilters.status)
                      .map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.loan_name}</TableCell>
                          <TableCell>{loan.bank}</TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{format(new Date(loan.start_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{format(new Date(loan.end_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right">%{loan.interest_rate}</TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.installment_amount)}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(loan.remaining_debt)}
                          </TableCell>
                          <TableCell>{getStatusBadge(loan.status)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingLoan(loan);
                                  setLoanDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteLoanMutation.mutate(loan.id)}
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
                    <Button>
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
                    <form>
                      <CheckForm />
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}