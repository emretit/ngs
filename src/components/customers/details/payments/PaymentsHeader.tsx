import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Calendar } from "lucide-react";
import { PaymentMethodSelector } from "@/components/shared/PaymentMethodSelector";
import { DatePicker } from "@/components/ui/date-picker";
import { TransactionType } from "./utils/paymentUtils";

interface PaymentsHeaderProps {
  paymentStats: {
    currentBalance: number;
    totalIncoming: number;
    totalOutgoing: number;
  };
  typeFilter: TransactionType | 'all';
  onTypeFilterChange: (value: TransactionType | 'all') => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
  customerId: string;
}

export const PaymentsHeader = ({
  paymentStats,
  typeFilter,
  onTypeFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onAddPayment,
  customerId,
}: PaymentsHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">İşlem Geçmişi</h3>
        </div>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Mevcut Bakiye</span>
            <span className={`text-sm font-semibold ${
              paymentStats.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {paymentStats.currentBalance.toLocaleString('tr-TR', { 
                style: 'currency', 
                currency: 'TRY' 
              })}
            </span>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Gelen Ödemeler</span>
            <span className="text-sm font-semibold text-green-600">
              {paymentStats.totalIncoming.toLocaleString('tr-TR', { 
                style: 'currency', 
                currency: 'TRY' 
              })}
            </span>
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Giden Ödemeler</span>
            <span className="text-sm font-semibold text-red-600">
              {paymentStats.totalOutgoing.toLocaleString('tr-TR', { 
                style: 'currency', 
                currency: 'TRY' 
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as TransactionType | 'all')}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="payment">Ödemeler</SelectItem>
            <SelectItem value="sales_invoice">Satış Faturaları</SelectItem>
            <SelectItem value="purchase_invoice">Alış Faturaları</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            date={startDate}
            onSelect={onStartDateChange}
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <DatePicker
            date={endDate}
            onSelect={onEndDateChange}
            placeholder="Bitiş"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-4 w-4 mr-2" />
          Ekstre
        </Button>
        {onAddPayment && (
          <PaymentMethodSelector
            customerId={customerId}
            onMethodSelect={(method) => onAddPayment({ type: method.type })}
          />
        )}
      </div>
    </div>
  );
};

