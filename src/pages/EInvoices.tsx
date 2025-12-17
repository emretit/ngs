import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import EInvoiceHeader from "@/components/einvoice/EInvoiceHeader";
import EInvoiceFilterBar from "@/components/einvoice/EInvoiceFilterBar";
import EInvoiceContent from "@/components/einvoice/EInvoiceContent";
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IntegratorService } from '@/services/integratorService';
interface EInvoicesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const EInvoices = ({ isCollapsed, setIsCollapsed }: EInvoicesProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Date range filter states - Default to last 7 days (test için)
  const getDefaultDateRange = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return {
      start: sevenDaysAgo,
      end: now
    };
  };
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState<Date | undefined>(defaultRange.start);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultRange.end);
  
  // Convert Date to string for API
  const startDateString = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateString = endDate ? endDate.toISOString().split('T')[0] : undefined;
  
  const { incomingInvoices, isLoading, refetch } = useIncomingInvoices({ 
    startDate: startDateString, 
    endDate: endDateString 
  });
  
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
    const matchesType = typeFilter === 'all' || invoice.invoiceProfile === typeFilter;
    return matchesSearch && matchesType;
  });
  const handleRefresh = async () => {
    try {
      // Get selected integrator for dynamic message
      const integrator = await IntegratorService.getSelectedIntegrator();
      const integratorNames: Record<string, string> = {
        'nilvera': 'Nilvera',
        'elogo': 'e-Logo',
        'veriban': 'Veriban'
      };
      const integratorName = integratorNames[integrator] || 'Entegratör';
      
      toast.loading(`${integratorName}'dan faturalar çekiliyor...`, { id: 'fetching-invoices' });
      
      // Cache'i invalidate et - bu sayede fresh data çeker
      await queryClient.invalidateQueries({ queryKey: ['incoming-invoices'] });
      await refetchProcessedIds(); // İşlenmiş faturalar listesini de yenile
      
      toast.success("E-faturalar başarıyla güncellendi", { id: 'fetching-invoices' });
    } catch (error: any) {
      toast.error(error.message || "Faturalar güncellenirken hata oluştu", { id: 'fetching-invoices' });
    }
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
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        <EInvoiceContent
          invoices={filteredInvoices}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          searchTerm={searchTerm}
        />
      </div>
  );
};
export default EInvoices;