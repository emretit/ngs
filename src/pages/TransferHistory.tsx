import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  ArrowRight, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TransferHistoryProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

interface Transfer {
  id: string;
  from_account_type: string;
  from_account_id: string;
  to_account_type: string;
  to_account_id: string;
  amount: number;
  currency: string;
  description?: string;
  transfer_date: string;
  created_at: string;
  updated_at: string;
  from_account_name?: string;
  to_account_name?: string;
}

const TransferHistory = memo(({ isCollapsed, setIsCollapsed }: TransferHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Transfer verilerini çek
  const { data: transfers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['all-transfers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      const { data, error } = await supabase
        .from('account_transfers')
        .select(`
          *,
          from_cash:from_account_id!from_account_type(cash_accounts.name),
          from_bank:from_account_id!from_account_type(bank_accounts.account_name),
          from_credit:from_account_id!from_account_type(credit_cards.card_name),
          from_partner:from_account_id!from_account_type(partner_accounts.partner_name),
          to_cash:to_account_id!to_account_type(cash_accounts.name),
          to_bank:to_account_id!to_account_type(bank_accounts.account_name),
          to_credit:to_account_id!to_account_type(credit_cards.card_name),
          to_partner:to_account_id!to_account_type(partner_accounts.partner_name)
        `)
        .eq('company_id', profile.company_id)
        .order('transfer_date', { ascending: false });

      if (error) throw error;

      // Hesap isimlerini birleştir
      const transfersWithNames = data?.map(transfer => ({
        ...transfer,
        from_account_name: getAccountName(transfer, 'from'),
        to_account_name: getAccountName(transfer, 'to')
      })) || [];

      return transfersWithNames as Transfer[];
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1,
    retryDelay: 500,
  });

  const getAccountName = (transfer: any, direction: 'from' | 'to') => {
    const prefix = direction === 'from' ? 'from_' : 'to_';
    const accountType = direction === 'from' ? transfer.from_account_type : transfer.to_account_type;
    
    switch (accountType) {
      case 'cash':
        return transfer[`${prefix}cash`]?.[0]?.name || 'Bilinmeyen Nakit Kasa';
      case 'bank':
        return transfer[`${prefix}bank`]?.[0]?.account_name || 'Bilinmeyen Banka Hesabı';
      case 'credit_card':
        return transfer[`${prefix}credit`]?.[0]?.card_name || 'Bilinmeyen Kredi Kartı';
      case 'partner':
        return transfer[`${prefix}partner`]?.[0]?.partner_name || 'Bilinmeyen Ortak Hesabı';
      default:
        return 'Bilinmeyen Hesap';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Nakit Kasa';
      case 'bank': return 'Banka Hesabı';
      case 'credit_card': return 'Kredi Kartı';
      case 'partner': return 'Ortak Hesabı';
      default: return type;
    }
  };

  // Filtrelenmiş transferler
  const filteredTransfers = useMemo(() => {
    let filtered = transfers;

    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter(transfer =>
        transfer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.from_account_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.to_account_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Hesap tipi filtresi
    if (selectedAccountType !== "all") {
      filtered = filtered.filter(transfer =>
        transfer.from_account_type === selectedAccountType ||
        transfer.to_account_type === selectedAccountType
      );
    }

    // Tarih filtresi
    if (startDate && endDate) {
      filtered = filtered.filter(transfer => {
        const transferDate = new Date(transfer.transfer_date);
        return transferDate >= startDate && transferDate <= endDate;
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        comparison = new Date(a.transfer_date).getTime() - new Date(b.transfer_date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [transfers, searchQuery, selectedAccountType, startDate, endDate, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAccountType("all");
    setSelectedDateRange("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Transfer geçmişi yenilendi");
  };

  const handleExport = () => {
    // CSV export functionality
    toast.info("Export özelliği yakında eklenecek");
  };

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hata Oluştu</h2>
          <p className="text-gray-600 mb-4">Transfer geçmişi yüklenirken bir hata oluştu.</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2">
      {/* Header */}
      <div className="p-4 rounded-lg bg-white border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50">
              <ArrowUpDown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Transfer Geçmişi</h1>
              <p className="text-sm text-gray-600">Tüm hesaplar arası transfer işlemleri</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-lg bg-white border border-gray-200 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Transfer ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Hesap Tipi</label>
            <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Hesap tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="cash">Nakit Kasa</SelectItem>
                <SelectItem value="bank">Banka Hesabı</SelectItem>
                <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                <SelectItem value="partner">Ortak Hesabı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
            <DatePicker
              date={startDate}
              onSelect={(date) => setStartDate(date || new Date())}
              placeholder="Başlangıç tarihi"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bitiş Tarihi</label>
            <DatePicker
              date={endDate}
              onSelect={(date) => setEndDate(date || new Date())}
              placeholder="Bitiş tarihi"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: "date" | "amount") => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tarih</SelectItem>
                <SelectItem value="amount">Tutar</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
          <Button onClick={clearFilters} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Temizle
          </Button>
        </div>
      </div>

      {/* Transfer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Transfer İşlemleri ({filteredTransfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Transfer Bulunamadı</h3>
              <p className="text-gray-600">Henüz hiç transfer işlemi yapılmamış.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transfer.from_account_name} → {transfer.to_account_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getAccountTypeLabel(transfer.from_account_type)} → {getAccountTypeLabel(transfer.to_account_type)}
                        </p>
                        {transfer.description && (
                          <p className="text-xs text-gray-400 mt-1">{transfer.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {formatCurrency(transfer.amount, transfer.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transfer.transfer_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

TransferHistory.displayName = "TransferHistory";

export default TransferHistory;
