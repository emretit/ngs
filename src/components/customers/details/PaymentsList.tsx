
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PaymentsListProps {
  customer: Customer;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed';
  payment_direction: 'incoming' | 'outgoing';
  payment_type: string;
  description: string;
  recipient_name: string;
}

export const PaymentsList = ({ customer }: PaymentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['customer-payments', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      case 'failed':
        return 'Başarısız';
      default:
        return status;
    }
  };

  const filteredAndSortedPayments = payments
    .filter(payment => {
      const matchesSearch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           payment.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesDirection = directionFilter === 'all' || payment.payment_direction === directionFilter;
      
      return matchesSearch && matchesStatus && matchesDirection;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ödemeler yüklenemedi</h3>
        <p className="text-gray-600">Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz ödeme yok</h3>
        <p className="text-gray-600 mb-4">Bu müşteri ile henüz bir ödeme işlemi yapılmamış.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Açıklama veya alıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="pending">Bekliyor</SelectItem>
            <SelectItem value="failed">Başarısız</SelectItem>
          </SelectContent>
        </Select>

        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Yön" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="incoming">Gelen</SelectItem>
            <SelectItem value="outgoing">Giden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
        <div className="flex items-center space-x-4">
          <span>İşlem</span>
        </div>
        <div className="flex items-center space-x-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('date')}
            className="flex items-center gap-1 h-auto p-0 font-medium"
          >
            Tarih
            <ArrowUpDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('amount')}
            className="flex items-center gap-1 h-auto p-0 font-medium"
          >
            Tutar
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-2">
        {filteredAndSortedPayments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                payment.payment_direction === 'incoming' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {payment.payment_direction === 'incoming' ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">
                    {payment.description || payment.recipient_name || 'Ödeme'}
                  </p>
                  {getStatusIcon(payment.status)}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: tr })}
                  </span>
                  {payment.payment_type && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{payment.payment_type}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusColor(payment.status)} border`}>
                {getStatusText(payment.status)}
              </Badge>
              <div className="text-right">
                <p className={`font-semibold ${
                  payment.payment_direction === 'incoming' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {payment.payment_direction === 'incoming' ? '+' : '-'}
                  {payment.amount.toLocaleString('tr-TR', { 
                    style: 'currency', 
                    currency: payment.currency || 'TRY' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedPayments.length === 0 && payments.length > 0 && (
        <div className="text-center py-8">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtreye uygun sonuç bulunamadı</h3>
          <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin.</p>
        </div>
      )}
    </div>
  );
};
