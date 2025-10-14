import React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  CreditCard,
  Wifi,
  BadgeDollarSign,
  Landmark,
  FileText,
  ArrowLeftRight,
  ReceiptText,
} from "lucide-react";

type AccountType = "cash" | "bank" | "credit_card" | "partner";
type PaymentType = "nakit" | "kredi_karti" | "havale" | "eft";

export interface PaymentTypeSelection {
  accountType?: AccountType;
  paymentType?: PaymentType;
  meta?: { kind?: string };
}

interface PaymentTypeMenuProps {
  onSelect: (selection: PaymentTypeSelection) => void;
  label?: string;
}

export const PaymentTypeMenu: React.FC<PaymentTypeMenuProps> = ({ onSelect, label = "Tahsilat/Ödeme" }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Ödeme Tipi</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onSelect({ accountType: "cash", paymentType: "nakit" })}
        >
          <Banknote className="mr-2 h-4 w-4" /> Nakit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelect({ accountType: "credit_card", paymentType: "kredi_karti" })}
        >
          <CreditCard className="mr-2 h-4 w-4" /> Kredi Kartı
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelect({ accountType: "bank", paymentType: "havale" })}
        >
          <Landmark className="mr-2 h-4 w-4" /> Banka (Havale)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelect({ accountType: "bank", paymentType: "eft" })}
        >
          <Landmark className="mr-2 h-4 w-4" /> Banka (EFT)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onSelect({ accountType: "credit_card", paymentType: "kredi_karti", meta: { kind: "contactless" } })}
        >
          <Wifi className="mr-2 h-4 w-4" /> Temassız Kredi Kartı
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileText className="mr-2 h-4 w-4" /> Çek (yakında)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <ReceiptText className="mr-2 h-4 w-4" /> Senet İşlemleri (yakında)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <BadgeDollarSign className="mr-2 h-4 w-4" /> Bakiye düzelt (yakında)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <ReceiptText className="mr-2 h-4 w-4" /> Borç-Alacak Fişleri (yakında)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Cari Virman (yakında)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentTypeMenu;


