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
import { useRFQs } from "@/hooks/useRFQs";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    sent: { label: "Gönderildi", variant: "default" as const },
    received: { label: "Teklif Alındı", variant: "default" as const },
    closed: { label: "Kapatıldı", variant: "default" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function RFQsList() {
  const navigate = useNavigate();
  const { data: rfqs, isLoading } = useRFQs();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRFQs = rfqs?.filter(
    (rfq) =>
      rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teklif Talepleri (RFQ)</h1>
          <p className="text-muted-foreground">Tedarikçilerden teklif alın ve karşılaştırın</p>
        </div>
        <Button onClick={() => navigate("/purchasing/rfqs/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni RFQ
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="RFQ no veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ No</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Son Teklif Tarihi</TableHead>
              <TableHead>Tedarikçi Sayısı</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRFQs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz RFQ bulunmuyor</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRFQs?.map((rfq) => (
                <TableRow
                  key={rfq.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/purchasing/rfqs/${rfq.id}`)}
                >
                  <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                  <TableCell>{getStatusBadge(rfq.status)}</TableCell>
                  <TableCell>
                    {rfq.due_date ? format(new Date(rfq.due_date), 'dd.MM.yyyy') : '-'}
                  </TableCell>
                  <TableCell>{rfq.vendors?.length || 0}</TableCell>
                  <TableCell>{format(new Date(rfq.created_at), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/purchasing/rfqs/${rfq.id}`);
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
