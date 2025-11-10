import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import EInvoiceHeader from "@/components/einvoice/EInvoiceHeader";
import EInvoiceFilterBar from "@/components/einvoice/EInvoiceFilterBar";
import EInvoiceContent from "@/components/einvoice/EInvoiceContent";
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
interface EInvoicesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const EInvoices = ({ isCollapsed, setIsCollapsed }: EInvoicesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Date range filter states - Default to current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };
  const currentMonth = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(currentMonth.start);
  const [endDate, setEndDate] = useState(currentMonth.end);
  const { incomingInvoices, isLoading, refetch } = useIncomingInvoices({ startDate, endDate });
  
  // İşlenmiş e-fatura ID'lerini çek (purchase_invoices tablosundan)
  const { data: processedEinvoiceIds = [], refetch: refetchProcessedIds } = useQuery({
    queryKey: ['processed-einvoice-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('einvoice_id')
        .not('einvoice_id', 'is', null);
      
      if (error) {
        console.error('Error fetching processed einvoice IDs:', error);
        return [];
      }
      
      // null olmayan einvoice_id'leri array olarak döndür
      return (data || [])
        .map(inv => inv.einvoice_id)
        .filter((id): id is string => id !== null && id !== undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    refetchOnWindowFocus: false,
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Apply filters - işlenmiş faturaları hariç tut
  const filteredInvoices = incomingInvoices.filter(invoice => {
    // İşlenmiş faturaları filtrele (einvoice_id kontrolü)
    const isProcessed = processedEinvoiceIds.includes(invoice.id);
    if (isProcessed) {
      return false;
    }
    
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierTaxNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || typeFilter === 'TEMELFATURA';
    return matchesSearch && matchesType;
  });
  const handleRefresh = () => {
    refetch();
    refetchProcessedIds(); // İşlenmiş faturalar listesini de yenile
    toast({
      title: "Yenilendi",
      description: "E-fatura listesi güncellendi"
    });
  };
  const handleFilter = () => {
    // React Query otomatik olarak date filters değişikliğini algılar
    // Manuel refetch gerekmez
  };
  // Calculate total amount for header
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-2">
        <EInvoiceHeader 
          totalCount={filteredInvoices.length}
          totalAmount={totalAmount}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <EInvoiceFilterBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          isFiltering={isLoading}
        />
        <EInvoiceContent
          invoices={filteredInvoices}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          searchTerm={searchTerm}
          dateFilter={dateFilter}
        />
      </div>
  );
};
export default EInvoices;