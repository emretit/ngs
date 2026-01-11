import { useParams, useNavigate } from "react-router-dom";
import { logger } from '@/utils/logger';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Printer } from "lucide-react";
import { useGRN, useUpdateGRNStatus } from "@/hooks/useGRNs";
import { format } from "date-fns";

// Print styles
const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .print-page {
      padding: 20mm;
    }
  }
`;

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    received: { label: "Teslim Alındı", variant: "default" as const },
    putaway: { label: "Yerleştirildi", variant: "default" as const },
    returned: { label: "İade", variant: "destructive" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getQCBadge = (status: string) => {
  const variants = {
    accepted: { label: "Kabul", variant: "default" as const },
    rework: { label: "İşlem Gerekli", variant: "secondary" as const },
    rejected: { label: "Red", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.accepted;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function GRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: grn, isLoading } = useGRN(id!);
  const updateStatus = useUpdateGRNStatus();

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!grn) {
    return <div className="container mx-auto p-6">GRN bulunamadı</div>;
  }

  const handlePutaway = async () => {
    try {
      await updateStatus.mutateAsync({ id: grn.id, status: 'putaway' });
    } catch (error) {
      logger.error('Error updating status:', error);
    }
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="container mx-auto p-6 space-y-6 print-page">
        <div className="flex items-center gap-4 no-print">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/grns")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Mal Kabul Detayı</h1>
          <p className="text-muted-foreground">{grn.grn_number}</p>
        </div>
          <div className="flex gap-2 no-print">
            {grn.status === 'received' && (
              <Button onClick={handlePutaway} disabled={updateStatus.isPending}>
                Yerleştirme Tamamla
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              GRN Yazdır
            </Button>
          </div>
        </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">GRN Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span>{getStatusBadge(grn.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO No:</span>
              <span className="font-medium">{grn.po?.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teslim Tarihi:</span>
              <span>{format(new Date(grn.received_date), 'dd.MM.yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teslim Alan:</span>
              <span>{grn.received_by_user?.email || '-'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Notlar</h3>
          <p className="text-sm">{grn.notes || 'Not yok'}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Teslim Alınan Ürünler</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Sipariş Miktarı</TableHead>
              <TableHead>Teslim Alınan</TableHead>
              <TableHead>Kalite Kontrol</TableHead>
              <TableHead>Lokasyon</TableHead>
              <TableHead>Seri No</TableHead>
              <TableHead>Parti No</TableHead>
              <TableHead>Notlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grn.lines?.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.po_line?.description}</TableCell>
                <TableCell>
                  {line.po_line?.quantity} {line.po_line?.uom}
                </TableCell>
                <TableCell className="font-medium">
                  {line.received_quantity} {line.po_line?.uom}
                </TableCell>
                <TableCell>{getQCBadge(line.qc_status)}</TableCell>
                <TableCell>{line.location_id || '-'}</TableCell>
                <TableCell>
                  {line.serials && line.serials.length > 0 
                    ? line.serials.join(', ') 
                    : '-'}
                </TableCell>
                <TableCell>
                  {line.batches && line.batches.length > 0 
                    ? line.batches.join(', ') 
                    : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {line.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      </div>
    </>
  );
}
