import { useState, useEffect } from "react";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Customer } from "@/types/customer";
import CustomersTableHeader from "./table/CustomersTableHeader";
import CustomersTableRow from "./table/CustomersTableRow";
import CustomersTableSkeleton from "./table/CustomersTableSkeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, MoreHorizontal } from "lucide-react";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerSelectToggle?: (customer: Customer) => void;
  selectedCustomers?: Customer[];
}

const CustomersTable = ({ 
  customers, 
  isLoading, 
  onCustomerSelect, 
  onCustomerSelectToggle,
  selectedCustomers = []
}: CustomersTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [columns] = useState([
    { id: "company", label: "Şirket", visible: true, sortable: true },
    { id: "name", label: "Yetkili Kişi", visible: true, sortable: true },
    { id: "contact", label: "İletişim", visible: true, sortable: false },
    { id: "type", label: "Tip", visible: true, sortable: true },
    { id: "status", label: "Durum", visible: true, sortable: true },
    { id: "representative", label: "Temsilci", visible: true, sortable: true },
    { id: "balance", label: "Bakiye", visible: true, sortable: true },
    { id: "created_at", label: "Oluşturma Tarihi", visible: true, sortable: true },
    { id: "actions", label: "İşlemler", visible: true },
  ]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusUpdate = async (customerId: string, newStatus: 'aktif' | 'pasif' | 'potansiyel') => {
    try {
      // TODO: Add actual status update API call here
      // await updateCustomerStatus(customerId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast({
        title: "Durum güncellendi",
        description: "Müşteri durumu başarıyla güncellendi.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast({
        title: "Hata",
        description: "Müşteri durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      // TODO: Add actual delete API call here
      // await deleteCustomer(customerId);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast({
        title: "Müşteri silindi",
        description: "Müşteri başarıyla silindi.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatMoney = (amount: number, currency: string = 'TRY') => {
    if (!amount && amount !== 0) return `${getCurrencySymbol(currency)}0`;
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'TRY': '₺',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  if (isLoading && customers.length === 0) {
    return <CustomersTableSkeleton />;
  }

  if (!customers || customers.length === 0) {
    return <div className="p-4 text-center text-gray-500">Henüz müşteri bulunmamaktadır.</div>;
  }

  // Sort customers based on the sort field and direction
  const sortedCustomers = [...customers].sort((a, b) => {
    if (!a || !b) return 0;
    
    const fieldA = sortField === 'company' 
      ? a.company || a.name || ''
      : sortField === 'representative'
      ? a.representative || ''
      : (a as any)[sortField];
      
    const fieldB = sortField === 'company' 
      ? b.company || b.name || ''
      : sortField === 'representative'
      ? b.representative || ''
      : (b as any)[sortField];
    
    if (!fieldA && !fieldB) return 0;
    if (!fieldA) return sortDirection === 'asc' ? -1 : 1;
    if (!fieldB) return sortDirection === 'asc' ? 1 : -1;
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    
    const valueA = String(fieldA).toLowerCase();
    const valueB = String(fieldB).toLowerCase();
    
    return sortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const filteredCustomers = sortedCustomers;

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {onCustomerSelectToggle && (
              <TableHead className="w-[40px] font-bold text-foreground/80 text-sm tracking-wide text-center">
                <Checkbox
                  checked={selectedCustomers.length === customers.length && customers.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCustomers(customers);
                    } else {
                      setSelectedCustomers([]);
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Şirket</TableHead>
            <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Yetkili Kişi</TableHead>
            <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">📞 İletişim</TableHead>
            <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">🏷️ Tip</TableHead>
            <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-left">🤝 Temsilci</TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Bakiye</TableHead>
            <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturma Tarihi</TableHead>
            <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index} className="h-8">
              {onCustomerSelectToggle && (
                <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
              )}
              <TableCell className="py-2 px-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
              <TableCell className="py-2 px-2"><div className="h-6 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <CustomersTableHeader 
        columns={columns} 
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        hasSelection={true}
        onSelectAll={(checked) => {
          console.log('onSelectAll called:', checked, 'setSelectedCustomers:', setSelectedCustomers);
          if (setSelectedCustomers) {
            if (checked) {
              setSelectedCustomers(customers);
            } else {
              setSelectedCustomers([]);
            }
          }
        }}
        isAllSelected={selectedCustomers.length === customers.length && customers.length > 0}
      />
      <TableBody>
        {filteredCustomers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              Bu kriterlere uygun müşteri bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          filteredCustomers.map((customer, index) => (
            <CustomersTableRow
              key={customer.id}
              customer={customer}
              index={index}
              formatMoney={formatMoney}
              onSelect={onCustomerSelect}
              onSelectToggle={onCustomerSelectToggle}
              onStatusChange={handleStatusUpdate}
              onDelete={handleDeleteCustomer}
              isSelected={selectedCustomers.some(c => c.id === customer.id)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default CustomersTable;
