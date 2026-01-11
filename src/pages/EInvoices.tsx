import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import EInvoiceHeader from "@/components/einvoice/EInvoiceHeader";
import EInvoiceFilterBar from "@/components/einvoice/EInvoiceFilterBar";
import EInvoiceContent from "@/components/einvoice/EInvoiceContent";
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useOutgoingInvoices } from '@/hooks/useOutgoingInvoices';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { IntegratorService } from '@/services/integratorService';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface EInvoicesProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

type InvoiceType = 'incoming' | 'outgoing';

const EInvoices = ({ isCollapsed, setIsCollapsed }: EInvoicesProps) => {
  // Toggle state - gelen/giden faturalar
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('incoming');
  
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
  
  // Müşteri VKN filtresi (sadece giden faturalar için)
  const [customerTaxNumber, setCustomerTaxNumber] = useState<string>('');
  
  // Convert Date to string for API
  const startDateString = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateString = endDate ? endDate.toISOString().split('T')[0] : undefined;
  
  const { incomingInvoices, isLoading: isLoadingIncoming, isSyncing: isSyncingIncoming, refetch: refetchIncoming, forceRefresh: forceRefreshIncoming } = useIncomingInvoices({ 
    startDate: startDateString, 
    endDate: endDateString 
  }, invoiceType === 'incoming');
  
  const { outgoingInvoices, isLoading: isLoadingOutgoing, isSyncing: isSyncingOutgoing, refetch: refetchOutgoing, forceRefresh: forceRefreshOutgoing } = useOutgoingInvoices({ 
    startDate: startDateString, 
    endDate: endDateString,
    customerTaxNumber: customerTaxNumber || undefined
  }, invoiceType === 'outgoing');
  
  // İşlenmiş e-fatura ID'lerini çek (sadece gelen faturalar için)
  const { data: processedEinvoiceIds = [], refetch: refetchProcessedIds } = useQuery({
    queryKey: ['processed-einvoice-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('einvoice_id')
        .not('einvoice_id', 'is', null);
      
      if (error) {
        logger.error('Error fetching processed einvoice IDs:', error);
        return [];
      }
      
      // null olmayan einvoice_id'leri array olarak döndür
      return (data || [])
        .map(inv => inv.einvoice_id)
        .filter((id): id is string => id !== null && id !== undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    refetchOnWindowFocus: false,
    enabled: invoiceType === 'incoming',
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Get current invoices based on type
  const currentInvoices = invoiceType === 'incoming' ? incomingInvoices : outgoingInvoices;
  const isLoading = invoiceType === 'incoming' ? isLoadingIncoming : isLoadingOutgoing;
  const isSyncing = invoiceType === 'incoming' ? isSyncingIncoming : isSyncingOutgoing;
  
  // Apply filters
  const filteredInvoices = currentInvoices.filter(invoice => {
    // Gelen faturalar için: işlenmiş faturaları filtrele
    if (invoiceType === 'incoming') {
      const isProcessed = processedEinvoiceIds.includes(invoice.id);
      if (isProcessed) {
        return false;
      }
    }
    
    // Search filter
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoiceType === 'incoming' 
        ? (invoice as any).supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice as any).supplierTaxNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        : (invoice as any).customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice as any).customerTaxNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Type filter
    const matchesType = typeFilter === 'all' || invoice.invoiceProfile === typeFilter;
    return matchesSearch && matchesType;
  });
  
  const handleRefresh = async () => {
    try {
      const integrator = await IntegratorService.getSelectedIntegrator();
      const integratorNames: Record<string, string> = {
        'nilvera': 'Nilvera',
        'elogo': 'e-Logo',
        'veriban': 'Veriban'
      };
      const integratorName = integratorNames[integrator] || 'Entegratör';
      
      const message = invoiceType === 'outgoing' 
        ? customerTaxNumber 
          ? `${integratorName}'dan müşteri VKN ${customerTaxNumber} için giden faturalar çekiliyor...`
          : `${integratorName}'dan tüm giden faturalar çekiliyor...`
        : `${integratorName}'dan gelen faturalar çekiliyor...`;
      
      toast.loading(message, { id: 'fetching-invoices' });
      
      // Force refresh - API'den yeni faturaları çek ve DB'ye kaydet
      if (invoiceType === 'incoming') {
        await forceRefreshIncoming();
        await refetchProcessedIds();
      } else {
        await forceRefreshOutgoing();
      }
      
      const successMessage = invoiceType === 'outgoing'
        ? `Müşteri VKN ${customerTaxNumber} için giden faturalar başarıyla güncellendi`
        : 'Gelen e-faturalar başarıyla güncellendi';
        
      toast.success(successMessage, { id: 'fetching-invoices' });
    } catch (error: any) {
      toast.error(error.message || "Faturalar güncellenirken hata oluştu", { id: 'fetching-invoices' });
    }
  };
  
  // Calculate total amount for header
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
          <EInvoiceHeader 
            totalCount={filteredInvoices.length}
            totalAmount={totalAmount}
          />
          {/* Toggle - Gelen/Giden Faturalar */}
          <div className="flex items-center gap-2 px-3">
            <ToggleGroup 
              type="single" 
              value={invoiceType} 
              onValueChange={(value) => {
                if (value) setInvoiceType(value as InvoiceType);
              }}
              className="bg-white border border-gray-200 rounded-lg p-1"
            >
              <ToggleGroupItem 
                value="incoming" 
                aria-label="Gelen Faturalar"
                className="data-[state=on]:bg-orange-500 data-[state=on]:text-white"
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Gelen
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="outgoing" 
                aria-label="Giden Faturalar"
                className="data-[state=on]:bg-orange-500 data-[state=on]:text-white"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Giden
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <EInvoiceFilterBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onRefresh={handleRefresh}
          isRefreshing={isLoading || isSyncing}
          invoiceType={invoiceType}
          customerTaxNumber={customerTaxNumber}
          setCustomerTaxNumber={setCustomerTaxNumber}
        />
        <EInvoiceContent
          invoices={filteredInvoices}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          searchTerm={searchTerm}
          invoiceType={invoiceType}
        />
      </div>
  );
};
export default EInvoices;