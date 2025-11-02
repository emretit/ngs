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
import StatusBadge from "@/components/common/StatusBadge";

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
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teklif Talepleri</h1>
          <p className="text-muted-foreground">Tedarikçilerden teklif alın ve karşılaştırın</p>
        </div>
        <Button onClick={() => navigate("/purchase-rfqs/new")}>
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
              <TableHead>Davet Edilen</TableHead>
              <TableHead>Teklif Sayısı</TableHead>
              <TableHead>Güncelleme</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRFQs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz RFQ bulunmuyor</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRFQs?.map((rfq) => {
                const quotesCount = rfq.quotes?.length || 0;
                const vendorsCount = rfq.vendors?.length || 0;
                
                return (
                  <TableRow
                    key={rfq.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchase-rfqs/${rfq.id}`)}
                  >
                    <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                    <TableCell><StatusBadge status={rfq.status} /></TableCell>
                    <TableCell>
                      {rfq.due_date ? format(new Date(rfq.due_date), 'dd.MM.yyyy') : '-'}
                    </TableCell>
                    <TableCell>{vendorsCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{quotesCount} / {vendorsCount}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(rfq.updated_at), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchase-rfqs/${rfq.id}`);
                        }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
