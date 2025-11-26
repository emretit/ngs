import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SupplierPortalLayout from '@/components/supplier-portal/SupplierPortalLayout';
import { usePortalRFQs } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function SupplierPortalRFQs() {
  const { data: rfqs, isLoading } = usePortalRFQs();

  const getStatusBadge = (vendorStatus: string, rfqStatus: string) => {
    if (rfqStatus === 'closed' || rfqStatus === 'cancelled') {
      return <Badge variant="outline">Kapalı</Badge>;
    }

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      invited: { 
        label: 'Yanıt Bekliyor', 
        variant: 'default',
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      quoted: { 
        label: 'Teklif Verildi', 
        variant: 'secondary',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      declined: { 
        label: 'Reddedildi', 
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
      no_response: { 
        label: 'Yanıt Verilmedi', 
        variant: 'outline',
        icon: null
      },
    };

    const config = statusConfig[vendorStatus] || { label: vendorStatus, variant: 'outline', icon: null };
    
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const isExpired = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Teklif Talepleri (RFQ)
          </h1>
          <p className="text-slate-500">Size gönderilen teklif taleplerini görüntüleyin ve yanıtlayın</p>
        </div>

        {/* RFQ Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tüm Talepler</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Yükleniyor...
              </div>
            ) : !rfqs || rfqs.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-lg">Henüz teklif talebi yok</p>
                <p className="text-slate-400 text-sm">Müşteriniz size teklif talebi gönderdiğinde burada görünecek.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ No</TableHead>
                      <TableHead>Kalem Sayısı</TableHead>
                      <TableHead>Son Tarih</TableHead>
                      <TableHead>Para Birimi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqs.map((rfq) => (
                      <TableRow key={rfq.id} className={isExpired(rfq.due_date) ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                        <TableCell>{rfq.lines?.length || 0} kalem</TableCell>
                        <TableCell>
                          {rfq.due_date ? (
                            <span className={isExpired(rfq.due_date) ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(rfq.due_date), 'dd MMM yyyy', { locale: tr })}
                              {isExpired(rfq.due_date) && ' (Süresi Doldu)'}
                            </span>
                          ) : (
                            <span className="text-slate-400">Belirtilmemiş</span>
                          )}
                        </TableCell>
                        <TableCell>{rfq.currency || 'TRY'}</TableCell>
                        <TableCell>
                          {getStatusBadge(rfq.vendor_status || 'invited', rfq.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/supplier-portal/rfqs/${rfq.id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" />
                              {rfq.vendor_status === 'invited' ? 'Teklif Ver' : 'Görüntüle'}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierPortalLayout>
  );
}

