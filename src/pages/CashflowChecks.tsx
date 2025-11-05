import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Calendar, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusConfig } from "@/utils/cashflowUtils";
import CheckCreateDialog, { CheckRecord } from "@/components/shared/CheckCreateDialog";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { format } from "date-fns";

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
  check_type?: 'incoming' | 'outgoing';
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

  // Gelen/Giden çekler (check_type alanına göre)
  const allIncomingChecks = checks.filter(check => check.check_type === 'incoming');
  const allOutgoingChecks = checks.filter(check => check.check_type === 'outgoing');

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
    <>
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
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCheck(null);
                    setCheckType("incoming");
                    setCheckStatus("portfoyde");
                    setCheckDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Çek
                </Button>
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
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCheck(null);
                    setCheckType("outgoing");
                    setCheckStatus("odenecek");
                    setCheckDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Çek
                </Button>
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
      <CheckCreateDialog
        open={checkDialog}
        onOpenChange={setCheckDialog}
        editingCheck={editingCheck ? {
          id: editingCheck.id,
          check_number: editingCheck.check_number,
          issue_date: editingCheck.issue_date,
          due_date: editingCheck.due_date,
          amount: editingCheck.amount,
          bank: editingCheck.bank,
          issuer_name: editingCheck.issuer_name,
          payee: editingCheck.payee,
          status: editingCheck.status,
          notes: editingCheck.notes || null,
        } : null}
        setEditingCheck={(check) => setEditingCheck(check ? {
          id: check.id || "",
          check_number: check.check_number || "",
          issue_date: check.issue_date || "",
          due_date: check.due_date || "",
          amount: check.amount || 0,
          bank: check.bank || "",
          issuer_name: check.issuer_name,
          payee: check.payee || "",
          status: check.status || "pending",
          notes: check.notes || "",
          created_at: editingCheck?.created_at || new Date().toISOString(),
        } : null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["checks"] });
          setEditingCheck(null);
        }}
        defaultCheckType={checkType}
        defaultStatus={checkStatus}
      />
    </>
  );
};

export default CashflowChecks;

