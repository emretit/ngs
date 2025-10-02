import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import EInvoiceHeader from "@/components/einvoice/EInvoiceHeader";
import EInvoiceFilterBar from "@/components/einvoice/EInvoiceFilterBar";
import EInvoiceContent from "@/components/einvoice/EInvoiceContent";
import { useIncomingInvoices } from '@/hooks/useIncomingInvoices';
import { useToast } from '@/hooks/use-toast';
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
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  // Date filters değiştiğinde otomatik refetch yapılmaz
  // React Query otomatik olarak queryKey değişikliğini algılar
  // Apply filters
  const filteredInvoices = incomingInvoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierTaxNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || typeFilter === 'TEMELFATURA';
    return matchesSearch && matchesType;
  });
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Yenilendi",
      description: "E-fatura listesi güncellendi"
    });
  };
  const handleFilter = () => {
    // React Query otomatik olarak date filters değişikliğini algılar
    // Manuel refetch gerekmez
  };
  return (
    <div className="space-y-2">
        <EInvoiceHeader 
          totalCount={filteredInvoices.length}
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