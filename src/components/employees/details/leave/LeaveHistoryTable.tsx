
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusBadgeClass, getLeaveTypeDisplay } from "./useLeaveManagement";

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'parental' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
  notes: string | null;
  approved_by: string | null;
  created_at: string;
}

interface LeaveHistoryTableProps {
  leaveHistory: LeaveRecord[];
  isLoading: boolean;
}

export const LeaveHistoryTable = ({ leaveHistory, isLoading }: LeaveHistoryTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İzin Türü</TableHead>
          <TableHead>Başlangıç</TableHead>
          <TableHead>Bitiş</TableHead>
          <TableHead>Toplam Gün</TableHead>
          <TableHead>Neden</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Talep Tarihi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-4">
              Yükleniyor...
            </TableCell>
          </TableRow>
        ) : leaveHistory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-4">
              Henüz izin kaydı bulunmamaktadır.
            </TableCell>
          </TableRow>
        ) : (
          leaveHistory.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{getLeaveTypeDisplay(record.leave_type)}</TableCell>
              <TableCell>{new Date(record.start_date).toLocaleDateString('tr-TR')}</TableCell>
              <TableCell>{new Date(record.end_date).toLocaleDateString('tr-TR')}</TableCell>
              <TableCell>{record.total_days} gün</TableCell>
              <TableCell>{record.reason}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(record.status)}`}>
                  {record.status === 'approved' ? 'Onaylandı' :
                   record.status === 'pending' ? 'Beklemede' :
                   'Reddedildi'}
                </span>
              </TableCell>
              <TableCell>{new Date(record.created_at).toLocaleDateString('tr-TR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
