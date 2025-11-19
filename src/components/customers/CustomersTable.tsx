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
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  totalCount?: number;
  error?: any;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerSelectToggle?: (customer: Customer) => void;
  selectedCustomers?: Customer[];
  setSelectedCustomers?: (customers: Customer[]) => void;
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
}

const CustomersTable = ({ 
  customers, 
  isLoading, 
  totalCount,
  error,
  onCustomerSelect, 
  onCustomerSelectToggle,
  selectedCustomers = [],
  setSelectedCustomers,
  searchQuery,
  statusFilter,
  typeFilter
}: CustomersTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [columns] = useState([
    { id: "company", label: "Şirket", visible: true, sortable: true },
    { id: "name", label: "Yetkili Kişi", visible: true, sortable: true },
    { id: "contact", label: "İletişim", visible: true, sortable: false },
    { id: "type", label: "Tip", visible: true, sortable: true },
    { id: "status", label: "Durum", visible: true, sortable: true },
    { id: "representative", label: "Temsilci", visible: true, sortable: true },
    { id: "balance", label: "Bakiye", visible: true, sortable: true },
    { id: "created_at", label: "Oluşturma Tarihi", visible: true, sortable: true },
    { id: "actions", label: "İşlemler", visible: true, sortable: false },
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

  const handleDeleteCustomerClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCustomerConfirm = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Add actual delete API call here
      // await deleteCustomer(customerToDelete.id);
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
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleDeleteCustomerCancel = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
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

  // Not: Boş durumda da başlıkların görünmesi için tablo render'ını sürdür.

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

  // Filter customers based on search query, status, and type
  const filteredCustomers = sortedCustomers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobile_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.office_phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || customer.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || customer.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="-mx-4">
      <div className="px-4">
        <Table>
        <CustomersTableHeader 
          columns={columns} 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          hasSelection={true}
          onSelectAll={(checked) => {
            if (setSelectedCustomers) {
              if (checked) {
                setSelectedCustomers(filteredCustomers);
              } else {
                setSelectedCustomers([]);
              }
            }
          }}
          isAllSelected={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
        />
        <TableBody>
          {!isLoading && filteredCustomers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Bu kriterlere uygun müşteri bulunamadı
              </TableCell>
            </TableRow>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, index) => (
              <CustomersTableRow
                key={customer.id}
                customer={customer}
                index={index}
                formatMoney={formatMoney}
                onSelect={onCustomerSelect}
                onSelectToggle={onCustomerSelectToggle}
                onStatusChange={handleStatusUpdate}
                onDelete={handleDeleteCustomerClick}
                isSelected={selectedCustomers.some(c => c.id === customer.id)}
              />
            ))
          ) : null}
        </TableBody>
        </Table>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Müşteriyi Sil"
        description={`"${customerToDelete?.company || customerToDelete?.name || 'Bu müşteri'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteCustomerConfirm}
        onCancel={handleDeleteCustomerCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CustomersTable;
