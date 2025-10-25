import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, User, Activity } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: companies } = useQuery({
    queryKey: ['companies-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, companyFilter, actionFilter, entityFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            company_id,
            companies (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (companyFilter && companyFilter !== 'all') {
        query = query.eq('profiles.company_id', companyFilter);
      }

      if (actionFilter && actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      if (entityFilter && entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', new Date(dateTo).toISOString());
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      return data;
    },
  });

  const exportToExcel = () => {
    if (!logs || logs.length === 0) return;

    const exportData = logs.map(log => ({
      'Tarih': format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss'),
      'Kullanıcı': log.profiles?.email || 'Bilinmiyor',
      'Şirket': log.profiles?.companies?.name || 'Bilinmiyor',
      'İşlem': log.action,
      'Entity Type': log.entity_type,
      'Entity ID': log.entity_id,
      'Değişiklikler': JSON.stringify(log.changes)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
    XLSX.writeFile(wb, `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Tarih', 'Kullanıcı', 'Şirket', 'İşlem', 'Entity Type', 'Entity ID', 'Değişiklikler'];
    const csvData = logs.map(log => [
      format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss'),
      log.profiles?.email || 'Bilinmiyor',
      log.profiles?.companies?.name || 'Bilinmiyor',
      log.action,
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
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('login')) return 'outline';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading title="Audit Logs" description="Sistem aktivite logları ve değişiklik geçmişi" />
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="İşlem, entity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Şirket</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">İşlem Tipi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity">Entity Type</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger id="entity">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="profiles">Profiles</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="sales_invoices">Sales Invoices</SelectItem>
                  <SelectItem value="purchase_invoices">Purchase Invoices</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Başlangıç</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Bitiş</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Log Kayıtları ({logs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs?.map((log: any) => (
              <Collapsible key={log.id}>
                <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {log.profiles?.avatar_url ? (
                        <img 
                          src={log.profiles.avatar_url} 
                          alt="" 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {log.profiles?.first_name || log.profiles?.last_name 
                              ? `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim()
                              : log.profiles?.email || 'Bilinmeyen Kullanıcı'
                            }
                          </p>
                          <Badge variant={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.entity_type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.profiles?.companies?.name && (
                            <span className="inline-flex items-center gap-1 mr-3">
                              <Activity className="h-3 w-3" />
                              {log.profiles.companies.name}
                            </span>
                          )}
                          <span>{format(new Date(log.created_at), 'dd MMMM yyyy HH:mm:ss')}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Entity ID: {log.entity_id}
                        </p>
                      </div>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Detaylar
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-medium mb-2">Değişiklikler:</p>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {logs?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Kayıt bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
