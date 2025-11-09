import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, XCircle, CheckCircle, Activity, Globe, Clock, User } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SecurityMonitoring = () => {
  const { data: authLogs, isLoading: authLogsLoading } = useQuery({
    queryKey: ['auth-logs'],
    queryFn: async () => {
      // Query Supabase auth logs for failed login attempts
      const query = `
        select 
          id, 
          auth_logs.timestamp, 
          event_message, 
          metadata.level, 
          metadata.status, 
          metadata.path, 
          metadata.msg as msg, 
          metadata.error 
        from auth_logs
        cross join unnest(metadata) as metadata
        where metadata.status >= 400
        order by timestamp desc
        limit 100
      `;

      try {
        const { data, error } = await supabase.rpc('run_analytics_query' as any, { query_text: query });
        
        if (error) {
          console.error('Auth logs error:', error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error('Failed to fetch auth logs:', err);
        return [];
      }
    },
  });

  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      // Get active user sessions from profiles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          created_at,
          companies (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const { data: suspiciousActivity, isLoading: suspiciousLoading } = useQuery({
    queryKey: ['suspicious-activity'],
    queryFn: async () => {
      // Get suspicious activities from audit logs
      // Multiple actions in short time, admin actions at night, etc.
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          user_id,
          action,
          created_at,
          profiles:user_id (
            email,
            first_name,
            last_name,
            companies (
              name
            )
          )
        `)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and count actions
      const userActions = data.reduce((acc: any, log: any) => {
        const userId = log.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            email: log.profiles?.email,
            name: `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim(),
            company: log.profiles?.companies?.name,
            count: 0,
            actions: []
          };
        }
        acc[userId].count++;
        acc[userId].actions.push(log.action);
        return acc;
      }, {});

      // Filter suspicious (more than 20 actions in last hour)
      return Object.values(userActions).filter((user: any) => user.count > 20);
    },
  });

  // Calculate metrics
  const failedLoginCount = authLogs?.length || 0;
  const activeSessionCount = activeSessions?.length || 0;
  const suspiciousActivityCount = suspiciousActivity?.length || 0;

  // Group failed logins by IP or email
  const failedLoginsByEmail = authLogs?.reduce((acc: any, log: any) => {
    const email = log.msg || 'Unknown';
    if (!acc[email]) {
      acc[email] = { email, count: 0, lastAttempt: log.timestamp };
    }
    acc[email].count++;
    if (new Date(log.timestamp) > new Date(acc[email].lastAttempt)) {
      acc[email].lastAttempt = log.timestamp;
    }
    return acc;
  }, {});

  const failedLoginsArray = Object.values(failedLoginsByEmail || {}).sort((a: any, b: any) => b.count - a.count);

  if (authLogsLoading || sessionsLoading || suspiciousLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Heading 
        title="Security Monitoring" 
        description="Sistem güvenlik izleme ve şüpheli aktivite tespiti"
      />

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız Login</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedLoginCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Son 100 kayıt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Session</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSessionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Kayıtlı kullanıcılar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Şüpheli Aktivite</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{suspiciousActivityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Son 1 saat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Başarısız Login Denemeleri
          </CardTitle>
          <CardDescription>
            Sistem genelindeki başarısız giriş denemeleri (email bazlı)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email/Mesaj</TableHead>
                <TableHead>Deneme Sayısı</TableHead>
                <TableHead>Son Deneme</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedLoginsArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
                    <p>Başarısız login denemesi yok!</p>
                  </TableCell>
                </TableRow>
              ) : (
                failedLoginsArray.map((item: any, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>
                      <Badge variant={item.count >= 5 ? "destructive" : "secondary"}>
                        {item.count} deneme
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(item.lastAttempt), 'dd MMM yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.count >= 5 ? (
                        <Button size="sm" variant="destructive">
                          <Shield className="h-3 w-3 mr-2" />
                          İncelenmeli
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Normal</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      {suspiciousActivityCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Şüpheli Aktiviteler
            </CardTitle>
            <CardDescription>
              Son 1 saatte 20'den fazla işlem yapan kullanıcılar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Şirket</TableHead>
                  <TableHead>İşlem Sayısı</TableHead>
                  <TableHead className="text-center">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousActivity?.map((item: any, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {item.name || item.email}
                      </div>
                    </TableCell>
                    <TableCell>{item.company || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.count} işlem</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.actions.slice(0, 3).map((action: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                        {item.actions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.actions.length - 3} daha
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Son Kayıtlı Kullanıcılar
          </CardTitle>
          <CardDescription>
            Sistemdeki kayıtlı kullanıcılar (son 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Şirket</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions?.map((session: any) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {session.avatar_url ? (
                        <img 
                          src={session.avatar_url} 
                          alt="" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="font-medium">
                        {session.first_name || session.last_name 
                          ? `${session.first_name || ''} ${session.last_name || ''}`.trim()
                          : 'İsimsiz'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{session.email || '-'}</TableCell>
                  <TableCell>{session.companies?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(session.created_at), 'dd MMM yyyy HH:mm')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitoring;
