import React, { useState, useMemo } from "react";
import { logger } from '@/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, User, Activity, ClipboardList, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { DatePicker } from "@/components/ui/date-picker";

const PAGE_SIZE = 20;

const AuditLogs = () => {
  const { userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filtreleri memoize et
  const filters = useMemo(() => ({
    companyId: userData?.company_id,
    searchTerm,
    actionFilter,
    entityFilter,
    dateFrom: startDate?.toISOString(),
    dateTo: endDate?.toISOString(),
  }), [userData?.company_id, searchTerm, actionFilter, entityFilter, startDate, endDate]);

  // Infinite scroll hook
  const fetchLogs = async (page: number, pageSize: number) => {
    const userCompanyId = userData?.company_id;
    
    if (!userCompanyId) {
      return { data: [], totalCount: 0, hasNextPage: false };
    }
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (actionFilter && actionFilter !== 'all') {
      query = query.ilike('action', `%${actionFilter}%`);
    }

    if (entityFilter && entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    if (searchTerm) {
      query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Profiles bilgilerini ayrı çek
    // RLS policy nedeniyle sadece aynı şirketteki profilleri görebiliriz
    const userIds = [...new Set((data || []).map((log: any) => log.user_id).filter(Boolean))];
    let profilesMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url, company_id')
        .in('id', userIds);
      
      if (profilesError) {
        logger.error('Profiles fetch error:', profilesError);
      }
      
      if (profilesData) {
        profilesMap = profilesData.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Logs'a profiles bilgilerini ekle
    // Eğer profile bulunamazsa (RLS veya başka nedenle), null kalacak
    const logsWithProfiles = (data || []).map((log: any) => ({
      ...log,
      profiles: profilesMap[log.user_id] || null
    }));

    return {
      data: logsWithProfiles,
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize
    };
  };

  const {
    data: logs,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
  } = useInfiniteScroll(
    ['audit-logs', JSON.stringify(filters)],
    fetchLogs,
    {
      pageSize: PAGE_SIZE,
      enabled: !!userData?.company_id,
      staleTime: 2 * 60 * 1000, // 2 dakika
    }
  );

  const exportToExcel = () => {
    if (!logs || logs.length === 0) return;

    const exportData = logs.map((log: any) => ({
      'Tarih': format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: tr }),
      'Kullanıcı': log.profiles?.email || 'Bilinmiyor',
      'İşlem': log.action === 'created' ? 'Oluşturuldu' : log.action === 'updated' ? 'Güncellendi' : 'Silindi',
      'Tablo': log.entity_type,
      'Entity ID': log.entity_id,
      'Değişiklikler': JSON.stringify(log.changes)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Denetim Günlüğü");
    XLSX.writeFile(wb, `denetim-gunlugu-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Tarih', 'Kullanıcı', 'İşlem', 'Tablo', 'Entity ID', 'Değişiklikler'];
    const csvData = logs.map((log: any) => [
      format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: tr }),
      log.profiles?.email || 'Bilinmiyor',
      log.action === 'created' ? 'Oluşturuldu' : log.action === 'updated' ? 'Güncellendi' : 'Silindi',
      log.entity_type,
      log.entity_id,
      JSON.stringify(log.changes)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `denetim-gunlugu-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted')) return 'destructive';
    return 'outline';
  };

  const getActionLabel = (action: string) => {
    if (action === 'created') return 'Oluşturuldu';
    if (action === 'updated') return 'Güncellendi';
    if (action === 'deleted') return 'Silindi';
    return action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Denetim Günlüğü
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Sistem aktivite logları ve değişiklik geçmişi
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!logs || logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm" disabled={!logs || logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="İşlem, tablo veya entity ID ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="İşlem Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">İşlemler</SelectItem>
            <SelectItem value="created">✅ Oluşturuldu</SelectItem>
            <SelectItem value="updated">🔄 Güncellendi</SelectItem>
            <SelectItem value="deleted">❌ Silindi</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]">
            <Activity className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tablo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tablolar</SelectItem>
            <SelectItem value="customers">👥 Müşteriler</SelectItem>
            <SelectItem value="suppliers">🏭 Tedarikçiler</SelectItem>
            <SelectItem value="employees">👤 Çalışanlar</SelectItem>
            <SelectItem value="products">📦 Ürünler</SelectItem>
            <SelectItem value="orders">🛒 Siparişler</SelectItem>
            <SelectItem value="sales_invoices">📄 Satış Faturaları</SelectItem>
            <SelectItem value="purchase_invoices">📋 Alış Faturaları</SelectItem>
            <SelectItem value="payments">💳 Ödemeler</SelectItem>
            <SelectItem value="proposals">📊 Teklifler</SelectItem>
          </SelectContent>
        </Select>

        {/* Tarih Filtreleri */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="Bitiş"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Log Kayıtları {totalCount !== undefined && `(${totalCount})`}
              </h2>
            </div>
          </div>

          {isLoading && logs?.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {logs?.map((log: any) => (
                <Collapsible key={log.id}>
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {log.profiles?.avatar_url ? (
                          <img 
                            src={log.profiles.avatar_url} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">
                              {log.profiles?.first_name || log.profiles?.last_name 
                                ? `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim()
                                : log.profiles?.email || 'Bilinmeyen Kullanıcı'
                              }
                            </p>
                            <Badge variant={getActionColor(log.action)} className="text-xs">
                              {getActionLabel(log.action)}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {log.entity_type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(log.created_at), 'dd MMMM yyyy HH:mm:ss', { locale: tr })}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            ID: {log.entity_id?.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          Detaylar
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-4">
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs font-medium mb-2">Değişiklikler:</p>
                        <pre className="text-xs overflow-x-auto max-h-64">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}

              {logs?.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Kayıt bulunamadı</p>
                </div>
              )}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={loadMore} 
                    variant="outline" 
                    disabled={isLoadingMore}
                    className="min-w-[120px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      'Daha Fazla Yükle'
                    )}
                  </Button>
                </div>
              )}

              {!hasNextPage && logs && logs.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Tüm kayıtlar yüklendi
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
