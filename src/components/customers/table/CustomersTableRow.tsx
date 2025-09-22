import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Edit2, Trash2, MoreHorizontal, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CustomersTableRowProps {
  customer: Customer;
  index: number;
  formatMoney: (amount: number, currency?: string) => string;
  onSelect: (customer: Customer) => void;
  onSelectToggle?: (customer: Customer) => void;
  onStatusChange: (customerId: string, newStatus: 'aktif' | 'pasif' | 'potansiyel') => void;
  onDelete: (customerId: string) => void;
  isSelected?: boolean;
}

const CustomersTableRow = ({ 
  customer, 
  index, 
  formatMoney, 
  onSelect, 
  onSelectToggle,
  onStatusChange, 
  onDelete,
  isSelected = false
}: CustomersTableRowProps) => {
  const navigate = useNavigate();

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
      onClick={() => navigate(`/contacts/${customer.id}`)}
    >
      {/* Checkbox */}
      {onSelectToggle && (
        <TableCell className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(customer)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* Şirket */}
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {(customer.company || customer.name).charAt(0).toUpperCase()}
          </div>
          <div className="text-xs font-medium text-gray-900">
            {customer.company || customer.name}
          </div>
        </div>
      </TableCell>

      {/* Yetkili Kişi */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {customer.name}
      </TableCell>

      {/* İletişim */}
      <TableCell className="py-2 px-3">
        <div className="flex flex-col gap-0.5">
          {customer.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">{customer.email}</span>
            </div>
          )}
          {customer.mobile_phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{customer.mobile_phone}</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* Tip */}
      <TableCell className="py-2 px-2 text-center">
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(customer.type)}`}>
          {customer.type === 'kurumsal' ? '🏢' : '👤'}
        </span>
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {getStatusIcon(customer.status)}
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(customer.status)}`}>
            {customer.status}
          </span>
        </div>
      </TableCell>

      {/* Temsilci */}
      <TableCell className="py-2 px-2 text-xs text-gray-600">
        {customer.representative || '-'}
      </TableCell>

      {/* Bakiye */}
      <TableCell className="py-2 px-2 text-center text-xs font-medium">
        <span className={`${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatMoney(customer.balance)}
        </span>
      </TableCell>

      {/* Oluşturma Tarihi */}
      <TableCell className="py-2 px-2 text-center text-xs text-gray-600">
        {formatDate(customer.created_at)}
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-2">
        <div className="flex justify-end space-x-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contacts/${customer.id}/edit`);
            }}
            className="h-4 w-4 hover:bg-blue-100"
          >
            <Edit2 className="h-2.5 w-2.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 hover:bg-blue-100"
              >
                <MoreHorizontal className="h-2.5 w-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate(`/contacts/${customer.id}`);
              }}>
                Detayları Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(customer.id, 'aktif');
              }}>
                Aktif Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(customer.id, 'pasif');
              }}>
                Pasif Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(customer.id, 'potansiyel');
              }}>
                Potansiyel Yap
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(customer.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CustomersTableRow;
