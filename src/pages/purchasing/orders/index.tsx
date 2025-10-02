import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText } from "lucide-react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useVendors } from "@/hooks/useVendors";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    submitted: { label: "Onayda", variant: "default" as const },
    approved: { label: "Onaylandı", variant: "default" as const },
    sent: { label: "Gönderildi", variant: "default" as const },
    received: { label: "Teslim Alındı", variant: "default" as const },
    completed: { label: "Tamamlandı", variant: "default" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function PurchaseOrdersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");

  const { data: purchaseOrders, isLoading } = usePurchaseOrders({
    search: searchTerm,
    status: statusFilter || undefined,
    supplier_id: supplierFilter || undefined,
  });
  
  const { data: vendors } = useVendors({ is_active: true });

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma Siparişleri</h1>
          <p className="text-muted-foreground">Siparişleri yönetin ve takip edin</p>
        </div>
        <Button onClick={() => navigate("/purchasing/orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sipariş
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sipariş no veya tedarikçi ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="submitted">Onayda</SelectItem>
            <SelectItem value="approved">Onaylandı</SelectItem>
            <SelectItem value="sent">Gönderildi</SelectItem>
            <SelectItem value="received">Teslim Alındı</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tedarikçi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            {vendors?.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sipariş Tarihi</TableHead>
              <TableHead>Beklenen Teslimat</TableHead>
              <TableHead className="text-right">Ara Toplam</TableHead>
              <TableHead className="text-right">KDV</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Para Birimi</TableHead>
              <TableHead>Güncelleme</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz sipariş bulunmuyor</p>
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders?.map((po) => (
                <TableRow
                  key={po.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/purchasing/orders/${po.id}`)}
                >
                  <TableCell className="font-medium">{po.order_number}</TableCell>
                  <TableCell>{po.supplier?.name}</TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell>{format(new Date(po.order_date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    {po.expected_delivery_date 
                      ? format(new Date(po.expected_delivery_date), 'dd.MM.yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {po.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {po.tax_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {po.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{po.currency}</TableCell>
                  <TableCell>{format(new Date(po.updated_at), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/purchasing/orders/${po.id}`);
                      }}
                    >
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
