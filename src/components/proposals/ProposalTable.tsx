
import { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { useProposals } from "@/hooks/useProposals";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { changeProposalStatus } from "@/services/crmService";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { ProposalFilters } from "./types";
import { Column } from "./types";
import { ProposalTableHeader } from "./table/ProposalTableHeader";
import { ProposalTableRow } from "./table/ProposalTableRow";
import { ProposalTableSkeleton } from "./table/ProposalTableSkeleton";

interface ProposalTableProps {
  filters: ProposalFilters;
  onProposalSelect: (proposal: Proposal) => void;
}

const ProposalTable = ({ filters, onProposalSelect }: ProposalTableProps) => {
  // Call useProposals with filters now
  const { data, isLoading, error } = useProposals(filters);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [columns] = useState<Column[]>([
    { id: "number", label: "Teklif No", visible: true, sortable: true },
    { id: "customer", label: "Müşteri", visible: true, sortable: true },
    { id: "status", label: "Durum", visible: true, sortable: true },
    { id: "employee", label: "Satış Temsilcisi", visible: true, sortable: true },
    { id: "total_amount", label: "Toplam Tutar", visible: true, sortable: true },
    { id: "created_at", label: "Oluşturma Tarihi", visible: true, sortable: true },
    { id: "valid_until", label: "Geçerlilik", visible: true, sortable: true },
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

  const handleStatusUpdate = async (proposalId: string, newStatus: ProposalStatus) => {
    try {
      await changeProposalStatus(proposalId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      
      toast({
        title: "Durum güncellendi",
        description: "Teklif durumu başarıyla güncellendi.",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast({
        title: "Hata",
        description: "Teklif durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatMoney = (amount: number) => {
    if (!amount && amount !== 0) return "₺0";
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return <ProposalTableSkeleton />;
  }
  
  if (error) {
    console.error("Error loading proposals:", error);
    return <div className="p-4 text-center text-red-500">Veri yüklenirken bir hata oluştu.</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">Henüz teklif bulunmamaktadır.</div>;
  }

  // Sort proposals based on the sort field and direction
  const sortedProposals = [...data].sort((a, b) => {
    if (!a || !b) return 0;
    
    const fieldA = sortField === 'customer' 
      ? a.customer?.name || ''
      : sortField === 'employee'
      ? a.employee?.first_name || ''
      : (a as any)[sortField];
      
    const fieldB = sortField === 'customer' 
      ? b.customer?.name || ''
      : sortField === 'employee'
      ? b.employee?.first_name || ''
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

  // Filter proposals based on search query from parent filters
  const filteredProposals = filters.search.trim() === "" 
    ? sortedProposals 
    : sortedProposals.filter((proposal) => 
        proposal.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        proposal.number?.toString().includes(filters.search) ||
        proposal.customer?.name?.toLowerCase().includes(filters.search.toLowerCase())
      );

  return (
    <div className="w-full border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <ProposalTableHeader 
            columns={columns} 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {filteredProposals.map((proposal, index) => (
              <ProposalTableRow
                key={proposal.id}
                proposal={proposal}
                index={index}
                formatMoney={formatMoney}
                onSelect={onProposalSelect}
                onStatusChange={handleStatusUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProposalTable;
