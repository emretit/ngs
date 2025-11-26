import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupplierPortalLayout from '@/components/supplier-portal/SupplierPortalLayout';
import RFQResponseForm from '@/components/supplier-portal/RFQResponseForm';
import { usePortalRFQ } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function SupplierPortalRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rfq, isLoading, refetch } = usePortalRFQ(id || '');

  const getStatusBadge = (vendorStatus: string, rfqStatus: string) => {
    if (rfqStatus === 'closed' || rfqStatus === 'cancelled') {
      return <Badge variant="outline" className="text-lg px-4 py-1">Kapalı</Badge>;
    }

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      invited: { label: 'Yanıt Bekliyor', variant: 'default' },
      quoted: { label: 'Teklif Verildi', variant: 'secondary' },
      declined: { label: 'Reddedildi', variant: 'destructive' },
    };

    const config = statusConfig[vendorStatus] || { label: vendorStatus, variant: 'outline' };
    return <Badge variant={config.variant} className="text-lg px-4 py-1">{config.label}</Badge>;
  };

  const isExpired = rfq?.due_date && new Date(rfq.due_date) < new Date();
  const canRespond = rfq?.vendor_status === 'invited' && rfq?.status !== 'closed' && rfq?.status !== 'cancelled' && !isExpired;
  const hasQuoted = rfq?.vendor_status === 'quoted';

  if (isLoading) {
    return (
      <SupplierPortalLayout>
        <div className="py-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Yükleniyor...
        </div>
      </SupplierPortalLayout>
    );
  }

  if (!rfq) {
    return (
      <SupplierPortalLayout>
        <div className="py-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg">RFQ bulunamadı</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/supplier-portal/rfqs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Listeye Dön
          </Button>
        </div>
      </SupplierPortalLayout>
    );
  }

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/supplier-portal/rfqs')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{rfq.rfq_number}</h1>
                {getStatusBadge(rfq.vendor_status || 'invited', rfq.status)}
              </div>
              <p className="text-slate-500">Teklif Talebi Detayı</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Kalem Sayısı</p>
                  <p className="text-xl font-bold text-slate-800">{rfq.lines?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Oluşturulma</p>
                  <p className="text-xl font-bold text-slate-800">
                    {format(new Date(rfq.created_at), 'dd MMM yyyy', { locale: tr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isExpired ? 'border-red-200 bg-red-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                  <Clock className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Son Tarih</p>
                  <p className={`text-xl font-bold ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>
                    {rfq.due_date 
                      ? format(new Date(rfq.due_date), 'dd MMM yyyy', { locale: tr })
                      : 'Belirtilmemiş'
                    }
                    {isExpired && ' (Süresi Doldu)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue={canRespond || hasQuoted ? 'response' : 'details'} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">RFQ Detayları</TabsTrigger>
            {(canRespond || hasQuoted) && (
              <TabsTrigger value="response">
                {hasQuoted ? 'Teklifim' : 'Teklif Ver'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Talep Edilen Kalemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-center">Miktar</TableHead>
                        <TableHead>Birim</TableHead>
                        <TableHead className="text-right">Hedef Fiyat</TableHead>
                        <TableHead>Notlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfq.lines?.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-center">{line.quantity}</TableCell>
                          <TableCell>{line.uom}</TableCell>
                          <TableCell className="text-right">
                            {line.target_price 
                              ? `${line.target_price.toLocaleString('tr-TR')} ${rfq.currency}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">{line.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {rfq.notes && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-600 mb-1">Müşteri Notları:</p>
                    <p className="text-slate-700">{rfq.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(canRespond || hasQuoted) && (
            <TabsContent value="response">
              {!canRespond && hasQuoted && rfq.my_quote && (
                <Card className="mb-4 bg-emerald-50 border-emerald-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Bu RFQ için teklif verdiniz. Teklifinizi güncelleyebilirsiniz.
                      </span>
                    </div>
                    {rfq.my_quote.submitted_at && (
                      <p className="text-sm text-emerald-600 mt-1">
                        Gönderim: {format(new Date(rfq.my_quote.submitted_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <RFQResponseForm rfq={rfq} onSuccess={() => refetch()} />
            </TabsContent>
          )}
        </Tabs>

        {/* Expired/Closed Warning */}
        {(isExpired || rfq.status === 'closed' || rfq.status === 'cancelled') && !hasQuoted && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-amber-700">
                {rfq.status === 'cancelled' 
                  ? 'Bu RFQ iptal edilmiştir.'
                  : rfq.status === 'closed'
                    ? 'Bu RFQ kapatılmıştır.'
                    : 'Bu RFQ\'nun süresi dolmuştur. Teklif verilemez.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SupplierPortalLayout>
  );
}

