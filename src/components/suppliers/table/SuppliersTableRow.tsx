import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Edit2, Trash2, MoreHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Supplier } from "@/types/supplier";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BalanceDisplay from "@/components/shared/BalanceDisplay";
import { useSupplierBalance } from "@/hooks/useSupplierBalance";

interface SuppliersTableRowProps {
  supplier: Supplier;
  index: number;
  formatMoney: (amount: number, currency?: string) => string;
  onSelect: (supplier: Supplier) => void;
  onSelectToggle?: (supplier: Supplier) => void;
  onStatusChange: (supplierId: string, newStatus: 'aktif' | 'pasif' | 'potansiyel') => void;
  onDelete: (supplier: Supplier) => void;
  isSelected?: boolean;
}

const SuppliersTableRow = ({ 
  supplier, 
  index, 
  formatMoney, 
  onSelect, 
  onSelectToggle,
  onStatusChange, 
  onDelete,
  isSelected = false
}: SuppliersTableRowProps) => {
  const navigate = useNavigate();
  const { tryBalance, usdBalance, eurBalance, isLoading: isLoadingBalance } = useSupplierBalance(supplier.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aktif':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'pasif':
        return <XCircle className="h-3 w-3 text-gray-600" />;
      case 'potansiyel':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pasif':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'potansiyel':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'kurumsal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bireysel':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-blue-50 h-8 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => navigate(`/suppliers/${supplier.id}`)}
    >
      {/* Checkbox */}
      {onSelectToggle && (
        <TableCell className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(supplier)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* Şirket */}
      <TableCell className="py-2 px-3">
        <div className="text-xs font-medium text-gray-900">
          {supplier.company || supplier.name}
        </div>
      </TableCell>

      {/* Yetkili Kişi */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {supplier.name}
      </TableCell>

      {/* İletişim */}
      <TableCell className="py-2 px-3">
        <div className="flex flex-col gap-0.5">
          {supplier.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{supplier.email}</span>
            </div>
          )}
          {supplier.mobile_phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{supplier.mobile_phone}</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* Tip */}
      <TableCell className="py-2 px-2 text-center">
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(supplier.type)}`}>
          {supplier.type === 'kurumsal' ? '🏢' : '👤'}
        </span>
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {getStatusIcon(supplier.status)}
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(supplier.status)}`}>
            {supplier.status}
          </span>
        </div>
      </TableCell>

      {/* Temsilci */}
      <TableCell className="py-2 px-2 text-xs text-gray-600">
        {supplier.employees 
          ? `${supplier.employees.first_name} ${supplier.employees.last_name}` 
          : '-'}
      </TableCell>

      {/* Bakiye */}
      <TableCell className="py-2 px-2 text-center text-xs font-medium">
        {isLoadingBalance ? (
          <span className="text-gray-400">...</span>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            {usdBalance !== 0 && (
              <BalanceDisplay 
                amount={usdBalance} 
                currency="USD" 
                showTLEquivalent={false}
                size="sm"
              />
            )}
            {eurBalance !== 0 && (
              <BalanceDisplay 
                amount={eurBalance} 
                currency="EUR" 
                showTLEquivalent={false}
                size="sm"
              />
            )}
            {tryBalance !== 0 && (
              <BalanceDisplay 
                amount={tryBalance} 
                currency="TRY" 
                showTLEquivalent={false}
                size="sm"
              />
            )}
            {(usdBalance === 0 && eurBalance === 0 && tryBalance === 0) && (
              <span className="text-gray-400 text-xs">₺0,00</span>
            )}
          </div>
        )}
      </TableCell>

      {/* Oluşturma Tarihi */}
      <TableCell className="py-2 px-2 text-center text-xs text-gray-600">
        {formatDate(supplier.created_at)}
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-2">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/suppliers/${supplier.id}/edit`);
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
              onDelete(supplier);
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
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(supplier.id, 'aktif');
              }}>
                Aktif Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(supplier.id, 'pasif');
              }}>
                Pasif Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(supplier.id, 'potansiyel');
              }}>
                Potansiyel Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(SuppliersTableRow, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.supplier.id === nextProps.supplier.id &&
    prevProps.supplier.updated_at === nextProps.supplier.updated_at &&
    prevProps.isSelected === nextProps.isSelected
  );
});

