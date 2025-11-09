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
import { Search, Plus, Package } from "lucide-react";
import { useGRNs } from "@/hooks/useGRNs";
import { format } from "date-fns";

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

export default function GRNsList() {
  const navigate = useNavigate();
  const { data: grns, isLoading } = useGRNs();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGRNs = grns?.filter(
    (grn) =>
      grn.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.po?.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mal Kabul Notları</h1>
          <p className="text-muted-foreground">Teslim alınan malları kaydedin</p>
        </div>
        <Button onClick={() => navigate("/purchase-orders")}>
          <Plus className="h-4 w-4 mr-2" />
          Mal Kabul Yap
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="GRN veya PO no ile ara..."
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
              <TableHead>GRN No</TableHead>
              <TableHead>PO No</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Teslim Tarihi</TableHead>
              <TableHead>Teslim Alan</TableHead>
              <TableHead className="w-[100px] text-center">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGRNs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz mal kabul kaydı bulunmuyor</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredGRNs?.map((grn) => (
                <TableRow
                  key={grn.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/purchase-grns/${grn.id}`)}
                >
                  <TableCell className="font-medium">{grn.grn_number}</TableCell>
                  <TableCell>{grn.po?.order_number}</TableCell>
                  <TableCell>{getStatusBadge(grn.status)}</TableCell>
                  <TableCell>
                    {format(new Date(grn.received_date), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{grn.received_by_user?.email || '-'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchase-grns/${grn.id}`);
                        }}
                      >
                        Detay
                      </Button>
                    </div>
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
