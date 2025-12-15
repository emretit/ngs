import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, RotateCcw, MoreHorizontal } from "lucide-react";
import { Return, ReturnStatus, ReturnType, ReturnReason, returnStatusLabels, returnTypeLabels, returnReasonLabels } from "@/types/returns";
import ReturnsTableHeader from "./table/ReturnsTableHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ReturnsTableProps {
  returns: Return[];
  isLoading: boolean;
  onSelectReturn: (returnItem: Return) => void;
  searchQuery?: string;
  statusFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const ReturnsTable = ({
  returns,
  isLoading,
  onSelectReturn,
  searchQuery,
  statusFilter,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: ReturnsTableProps) => {
  const [internalSortField, setInternalSortField] = useState<string>('request_date');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;

  const columns = [
    { id: 'return_number', label: 'İade No', visible: true, sortable: true },
    { id: 'customer', label: 'Müşteri', visible: true, sortable: true },
    { id: 'return_type', label: 'Tür', visible: true, sortable: false },
    { id: 'return_reason', label: 'Neden', visible: true, sortable: false },
    { id: 'request_date', label: 'Talep Tarihi', visible: true, sortable: true },
    { id: 'refund_amount', label: 'Tutar', visible: true, sortable: true },
    { id: 'status', label: 'Durum', visible: true, sortable: false },
    { id: 'actions', label: 'İşlemler', visible: true, sortable: false }
  ];

  const handleSort = (field: string) => {
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortField(field);
        setInternalSortDirection('asc');
      }
    }
  };

  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = !searchQuery ||
      returnItem.return_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (returnItem.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (returnItem.customer?.company?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || returnItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedReturns = externalOnSort 
    ? filteredReturns
    : [...filteredReturns].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'return_number':
          aValue = a.return_number || '';
          bValue = b.return_number || '';
          break;
        case 'customer':
          aValue = a.customer?.company || a.customer?.name || '';
          bValue = b.customer?.company || b.customer?.name || '';
          break;
        case 'request_date':
          aValue = a.request_date ? new Date(a.request_date).getTime() : 0;
          bValue = b.request_date ? new Date(b.request_date).getTime() : 0;
          break;
        case 'refund_amount':
          aValue = a.refund_amount || 0;
          bValue = b.refund_amount || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">⏳ {returnStatusLabels[status]}</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">🔍 {returnStatusLabels[status]}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">✅ {returnStatusLabels[status]}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-700">❌ {returnStatusLabels[status]}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-700">✓ {returnStatusLabels[status]}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">🚫 {returnStatusLabels[status]}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: ReturnType) => {
    switch (type) {
      case 'product_return':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 text-xs">📦 {returnTypeLabels[type]}</Badge>;
      case 'exchange':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">🔄 {returnTypeLabels[type]}</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-green-500 text-green-700 text-xs">💰 {returnTypeLabels[type]}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const getReasonBadge = (reason: ReturnReason) => {
    const reasonColors: Record<ReturnReason, string> = {
      defective: 'border-red-400 text-red-600',
      wrong_product: 'border-yellow-400 text-yellow-600',
      customer_changed_mind: 'border-gray-400 text-gray-600',
      damaged_in_shipping: 'border-orange-400 text-orange-600',
      other: 'border-gray-400 text-gray-600'
    };
    return <Badge variant="outline" className={`text-xs ${reasonColors[reason]}`}>{returnReasonLabels[reason]}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Table>
        <ReturnsTableHeader
          columns={columns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          hasSelection={false}
        />
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="py-2 px-3"><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <ReturnsTableHeader
        columns={columns}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasSelection={false}
      />
      <TableBody>
        {sortedReturns.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun iade bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          sortedReturns.map((returnItem) => (
            <TableRow
              key={returnItem.id}
              onClick={() => onSelectReturn(returnItem)}
              className="cursor-pointer hover:bg-orange-50 h-8"
            >
              <TableCell className="font-medium py-1 px-2 text-xs">
                <div className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3 text-orange-600" />
                  <span className="text-orange-600 font-semibold">
                    {returnItem.return_number}
                  </span>
                </div>
                {returnItem.order && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    Sipariş: {returnItem.order.order_number}
                  </div>
                )}
              </TableCell>
              <TableCell className="py-1 px-2">
                {returnItem.customer ? (
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-medium" title={returnItem.customer.company || returnItem.customer.name}>
                      {shortenText(returnItem.customer.company || returnItem.customer.name, 35)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getTypeBadge(returnItem.return_type)}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getReasonBadge(returnItem.return_reason)}
              </TableCell>
              <TableCell className="text-center py-1 px-1 text-xs">
                {returnItem.request_date ? (
                  format(new Date(returnItem.request_date), "dd MMM yyyy", { locale: tr })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right py-1 px-2 text-xs font-medium">
                {returnItem.refund_amount > 0 ? (
                  <span className="text-green-600">
                    {formatCurrency(returnItem.refund_amount, returnItem.currency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center py-1 px-1">
                {getStatusBadge(returnItem.status)}
              </TableCell>
              <TableCell className="py-1 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReturn(returnItem);
                    }}
                    className="h-8 w-8"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8"
                        title="Daha Fazla"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Detayları Görüntüle</DropdownMenuItem>
                      <DropdownMenuItem>Durumu Güncelle</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ReturnsTable;
