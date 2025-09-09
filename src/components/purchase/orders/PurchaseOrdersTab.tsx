
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter, Pencil, Trash2, ExternalLink, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "../StatusBadge";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { formatMoney } from "../constants";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const PurchaseOrdersTab = () => {
  const navigate = useNavigate();
  const { orders, isLoading, filters, setFilters, deleteOrderMutation } = usePurchaseOrders();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
    navigate("/orders/create");
  };

  const handleViewOrder = (id: string) => {
    navigate(`/orders/purchase/${id}`);
  };

  const handleEditOrder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/orders/purchase/edit/${id}`);
  };

  const handleDeleteOrder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOrderId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedOrderId) {
      deleteOrderMutation.mutate(selectedOrderId);
      setDeleteDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Sipariş Ara..."
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
          Yeni Sipariş Oluştur
        </Button>
      </div>

      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
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
          variant={filters.status === "sent" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("sent")}
        >
          Gönderildi
        </Button>
        <Button
          variant={filters.status === "confirmed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("confirmed")}
        >
          Onaylandı
        </Button>
        <Button
          variant={filters.status === "received" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("received")}
        >
          Teslim Alındı
        </Button>
        <Button
          variant={filters.status === "partially_received" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("partially_received")}
        >
          Kısmen Teslim Alındı
        </Button>
        <Button
          variant={filters.status === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("cancelled")}
        >
          İptal Edildi
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead>Sipariş Tarihi</TableHead>
              <TableHead>Beklenen Teslim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
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
            ) : !orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-4">
                  Sipariş bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleViewOrder(order.id)}
                >
                  <TableCell className="font-medium">{order.po_number}</TableCell>
                  <TableCell>{order.supplier_id}</TableCell>
                  <TableCell>{order.issued_date ? format(new Date(order.issued_date), "dd.MM.yyyy") : "-"}</TableCell>
                  <TableCell>{order.expected_delivery_date ? format(new Date(order.expected_delivery_date), "dd.MM.yyyy") : "-"}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(order.total_amount, order.currency || "TRY")}</TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleEditOrder(e, order.id)}
                        disabled={order.status !== "draft"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleDeleteOrder(e, order.id)}
                        disabled={order.status !== "draft"}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseOrdersTab;
