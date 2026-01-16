import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { Download, Filter, Calendar } from "lucide-react";
import { TransactionType, PaymentStats } from "./types";

interface PaymentsHeaderProps {
  supplierId: string;
  paymentStats: PaymentStats;
  typeFilter: TransactionType | 'all';
  setTypeFilter: (value: TransactionType | 'all') => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

export const PaymentsHeader = ({
  supplierId,
  paymentStats,
  typeFilter,
  setTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onAddPayment,
}: PaymentsHeaderProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Toplam Alacak</div>
          <span className="text-lg font-bold text-green-600">
            {paymentStats.totalIncoming.toLocaleString("tr-TR", { 
              style: 'currency', 
              currency: 'TRY' 
            })}
          </span>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Toplam Borç</div>
          <span className="text-lg font-bold text-red-600">
            {paymentStats.totalOutgoing.toLocaleString("tr-TR", { 
              style: 'currency', 
              currency: 'TRY' 
            })}
          </span>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Güncel Bakiye</div>
          <span className={`text-lg font-bold ${paymentStats.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {paymentStats.currentBalance.toLocaleString("tr-TR", { 
              style: 'currency', 
              currency: 'TRY' 
            })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="payment">Ödemeler</SelectItem>
            <SelectItem value="purchase_invoice">Alış Faturaları</SelectItem>
            <SelectItem value="sales_invoice">Satış Faturaları</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="Bitiş"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-4 w-4 mr-2" />
          Ekstre
        </Button>
        {onAddPayment && (
          <PaymentMethodSelector
            supplierId={supplierId}
            calculatedBalance={paymentStats.currentBalance}
            onMethodSelect={(method) => {
              if (method.type === "hesap" || method.type === "cek" || method.type === "senet") {
                onAddPayment({ type: method.type });
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
