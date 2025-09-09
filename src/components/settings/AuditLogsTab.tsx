
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export const AuditLogsTab = () => {
  const { auditLogs } = useAuditLogs();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Denetim Günlüğü</CardTitle>
        <CardDescription>
          Sistem üzerinde yapılan değişikliklerin kaydı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Kullanıcı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString('tr-TR')}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entity_type}</TableCell>
                <TableCell>{log.user_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
