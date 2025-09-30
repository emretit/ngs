import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  Pencil,
  CreditCard,
  Activity,
  Receipt,
  FileText,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { useCreditCardDetail, useCreditCardTransactions } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditCardDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CreditCardDetail = ({ isCollapsed, setIsCollapsed }: CreditCardDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [activeTab, setActiveTab] = useState("overview");

  // React Query hooks ile optimize edilmiş veri çekme
  const { data: card, isLoading: isLoadingCard, error: cardError } = useCreditCardDetail(id);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useCreditCardTransactions(id);
  
  const loading = isLoadingCard || isLoadingTransactions;

  const handleEdit = () => {
    toast.info("Düzenleme özelliği yakında eklenecek");
  };

  if (loading) {
    return (
          <div className="p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (cardError || !card) {
    return (
          <div className="p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="text-center py-8">
            <p className="text-gray-500">Kart bilgileri yüklenemedi.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Geri Dön</Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Kredi Kartı',
      'debit': 'Banka Kartı',
      'corporate': 'Kurumsal Kart'
    };
    return types[type] || type;
  };

  const formatCardNumber = (number: string) => {
    if (!number) return '****-****-****-****';
    return number.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white shadow-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{card.card_name}</h1>
              <p className="text-gray-600">{card.bank_name} - {getCardTypeLabel(card.card_type)}</p>
            </div>
          </div>
          
          {/* Sağ taraf - Aksiyonlar */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? "Gizle" : "Göster"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Düzenle
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Mevcut Bakiye */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Mevcut Bakiye</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {showBalances ? formatCurrency(card.current_balance, "TRY") : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kredi Limiti */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Kredi Limiti</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {showBalances ? formatCurrency(card.credit_limit, "TRY") : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kullanılabilir Limit */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Kullanılabilir</p>
                  <p className="text-3xl font-bold text-green-900">
                    {showBalances ? formatCurrency(card.available_limit, "TRY") : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Kart Detayları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Kart Numarası</label>
                  <p className="text-lg font-mono">{formatCardNumber(card.card_number)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Son Kullanma Tarihi</label>
                  <p className="text-lg">{card.expiry_date || "••/••"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Kart Türü</label>
                  <p className="text-lg">{getCardTypeLabel(card.card_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <Badge variant={card.status === "active" ? "default" : "secondary"}>
                    {card.status === "active" ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                İşlem Geçmişi
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  Tümü
                </Button>
                <Button
                  variant={filterType === "income" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("income")}
                >
                  Gelirler
                </Button>
                <Button
                  variant={filterType === "expense" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("expense")}
                >
                  Giderler
                </Button>
                        </div>
                      </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Henüz işlem bulunmuyor</p>
                <p className="text-sm text-gray-400 mt-1">İlk işleminizi ekleyerek başlayın</p>
              </div>
            ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tarih</TableHead>
                              <TableHead>Açıklama</TableHead>
                              <TableHead>Kategori</TableHead>
                    <TableHead>Tür</TableHead>
                              <TableHead className="text-right">Tutar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                                </TableCell>
                                <TableCell>
                        <Badge variant="secondary">{transaction.category}</Badge>
                                </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === "income" ? "default" : "destructive"}
                          className={transaction.type === "income" ? "bg-green-100 text-green-800" : ""}
                        >
                          {transaction.type === "income" ? "Gelir" : "Gider"}
                        </Badge>
                                </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "income" ? "+" : "-"}
                          {showBalances ? formatCurrency(transaction.amount, "TRY") : "••••••"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
            )}
          </CardContent>
                </Card>
    </div>
  );
};

export default CreditCardDetail;