import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { usePurchaseRequests, useSubmitPurchaseRequest } from "@/hooks/usePurchasing";
import type { PurchaseRequestStatus, PurchaseRequestPriority } from "@/types/purchasing";

const statusConfig: Record<PurchaseRequestStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Taslak', color: 'bg-slate-100 text-slate-800', icon: FileText },
  submitted: { label: 'Onay Bekliyor', color: 'bg-orange-100 text-orange-800', icon: Clock },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: XCircle },
  converted: { label: 'Siparişe Dönüştürüldü', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
};

const priorityConfig: Record<PurchaseRequestPriority, { label: string; color: string }> = {
  low: { label: 'Düşük', color: 'bg-slate-100 text-slate-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-800' },
};

export default function PurchaseRequestsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: requests, isLoading } = usePurchaseRequests();
  const submitMutation = useSubmitPurchaseRequest();

  const filteredRequests = requests?.filter(request => {
    const matchesSearch = 
      request.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (id: string) => {
    if (confirm('Bu talebi onaya göndermek istediğinizden emin misiniz?')) {
      submitMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma Talepleri</h1>
          <p className="text-muted-foreground">Taleplerinizi oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => navigate('/purchasing/requests/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Talep
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Talep numarası, talep eden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="submitted">Onay Bekliyor</option>
          <option value="approved">Onaylandı</option>
          <option value="rejected">Reddedildi</option>
          <option value="converted">Siparişe Dönüştürüldü</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Talepler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talep No</TableHead>
                <TableHead>Talep Eden</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İhtiyaç Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests?.map((request) => {
                const StatusIcon = statusConfig[request.status].icon;
                
                return (
                  <TableRow 
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchasing/requests/${request.id}`)}
                  >
                    <TableCell className="font-medium">
                      {request.request_number || 'PR-DRAFT'}
                    </TableCell>
                    <TableCell>
                      {request.requester?.first_name} {request.requester?.last_name}
                    </TableCell>
                    <TableCell>{request.department?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={priorityConfig[request.priority].color}>
                        {priorityConfig[request.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[request.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.need_by_date 
                        ? new Date(request.need_by_date).toLocaleDateString('tr-TR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {request.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmit(request.id)}
                          disabled={submitMutation.isPending}
                        >
                          Onaya Gönder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredRequests?.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz talep bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
