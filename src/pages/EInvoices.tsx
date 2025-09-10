import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  FileText, 
  Calendar, 
  Eye,
  Edit,
  CreditCard,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import EInvoiceList from "@/components/purchase/e-invoices/EInvoiceList";

interface EInvoicesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const EInvoices = ({ isCollapsed, setIsCollapsed }: EInvoicesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const safeRange = range || { from: undefined, to: undefined };
    setDateRange(safeRange);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
                E-Faturalar
              </h1>
              <p className="text-gray-600">
                Gelen işlenmemiş e-faturaların yönetimi
              </p>
            </div>
            <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600">
              <RefreshCw className="h-4 w-4" />
              <span>E-Fatura Çek</span>
            </Button>
          </div>

          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <EInvoiceList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EInvoices;