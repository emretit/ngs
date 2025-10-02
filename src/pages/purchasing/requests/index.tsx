import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchaseRequests } from "@/hooks/usePurchasing";
import { formatDate } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const statusConfig = {
  draft: { label: "Taslak", variant: "secondary" as const },
  submitted: { label: "Onay Bekliyor", variant: "default" as const },
  approved: { label: "Onaylandı", variant: "default" as const },
  rejected: { label: "Reddedildi", variant: "destructive" as const },
  converted: { label: "Dönüştürüldü", variant: "default" as const },
};

const priorityConfig = {
  low: { label: "Düşük", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  high: { label: "Yüksek", variant: "default" as const },
  urgent: { label: "Acil", variant: "destructive" as const },
};

export default function PurchaseRequestsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");

  const { data: requests, isLoading } = usePurchaseRequests();

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const filteredRequests = requests?.filter((req) => {
    const matchesSearch =
      !search ||
      req.request_number?.toLowerCase().includes(search.toLowerCase()) ||
      req.requester_notes?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || req.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const exportToCSV = () => {
    if (!filteredRequests || filteredRequests.length === 0) return;

    const headers = ["Req No", "Status", "Requester", "Dept", "Priority", "Need By", "Items", "Est. Total", "Updated"];
    const rows = filteredRequests.map((req) => [
      req.request_number || "-",
      req.status || "-",
      req.requester ? `${req.requester.first_name} ${req.requester.last_name}` : "-",
      req.department?.name || "-",
      req.priority || "-",
      req.need_by_date || "-",
      req.items?.length || 0,
      req.items?.reduce((sum, item) => sum + ((item.estimated_price || 0) * item.quantity), 0).toFixed(2) || "0.00",
      formatDate(req.updated_at),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-requests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma Talepleri</h1>
          <p className="text-muted-foreground">Talepleri oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => navigate("/purchasing/requests/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Talep
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Talep no veya notlar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilters("search", e.target.value);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                updateFilters("status", val);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="submitted">Onay Bekliyor</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
                <SelectItem value="converted">Dönüştürüldü</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(val) => {
                setPriorityFilter(val);
                updateFilters("priority", val);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talep No</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Talep Eden</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>İhtiyaç Tarihi</TableHead>
                <TableHead className="text-right">Kalem</TableHead>
                <TableHead className="text-right">Tahmini Toplam</TableHead>
                <TableHead>Güncelleme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests?.map((req) => {
                const estimatedTotal = req.items?.reduce(
                  (sum, item) => sum + ((item.estimated_price || 0) * item.quantity),
                  0
                ) || 0;

                return (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/purchasing/requests/${req.id}`)}
                  >
                    <TableCell className="font-medium">{req.request_number || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[req.status as keyof typeof statusConfig]?.variant}>
                        {statusConfig[req.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.requester ? `${req.requester.first_name} ${req.requester.last_name}` : "-"}
                    </TableCell>
                    <TableCell>{req.department?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={priorityConfig[req.priority as keyof typeof priorityConfig]?.variant}>
                        {priorityConfig[req.priority as keyof typeof priorityConfig]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{req.need_by_date ? formatDate(req.need_by_date) : "-"}</TableCell>
                    <TableCell className="text-right">{req.items?.length || 0}</TableCell>
                    <TableCell className="text-right">₺{estimatedTotal.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(req.updated_at)}</TableCell>
                  </TableRow>
                );
              })}
              {filteredRequests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Talep bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
