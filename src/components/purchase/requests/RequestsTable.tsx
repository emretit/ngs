
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RequestStatusBadge } from "../StatusBadge";
import { PurchaseRequest } from "@/types/purchase";
import { usePurchaseRequests } from "@/hooks/usePurchaseRequests";
import { formatMoney } from "../constants";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export const RequestsTable = () => {
  const navigate = useNavigate();
  const { requests, isLoading, filters, setFilters } = usePurchaseRequests();
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterChange = (status: string) => {
    setFilters({ ...filters, status });
  };

  const handleCreateNew = () => {
    navigate("/purchase-requests/new");
  };

  const handleViewRequest = (id: string) => {
    navigate(`/purchase-requests/${id}`);
  };

  const handleEditRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/purchase-requests/edit/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Talep Ara..."
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Yeni Talep Oluştur
        </Button>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant={filters.status === "" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("")}
        >
          Tümü
        </Button>
        <Button
          variant={filters.status === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("draft")}
        >
          Taslak
        </Button>
        <Button
          variant={filters.status === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("pending")}
        >
          Onay Bekleyen
        </Button>
        <Button
          variant={filters.status === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("approved")}
        >
          Onaylı
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talep No</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Talep Tarihi</TableHead>
              <TableHead>Departman</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Bütçe</TableHead>
              <TableHead className="text-center">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-4">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : !requests || requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-4">
                  Talep bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request: PurchaseRequest) => (
                <TableRow 
                  key={request.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewRequest(request.id)}
                >
                  <TableCell className="font-medium">{request.request_number}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{format(new Date(request.requested_date), "dd.MM.yyyy")}</TableCell>
                  <TableCell>{request.department || "-"}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(request.total_budget, "TRY")}</TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleEditRequest(e, request.id)}
                        disabled={request.status !== "draft"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRequest(request.id);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
