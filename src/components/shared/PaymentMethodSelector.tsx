import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, CreditCard, FileText, Receipt, ChevronDown } from "lucide-react";

interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "hesap" | "cek" | "senet";
}

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "hesap",
    label: "Hesap Ödemesi",
    description: "Nakit, banka veya kredi kartı",
    icon: <CreditCard className="h-4 w-4" />,
    type: "hesap"
  },
  {
    id: "cek",
    label: "Çek",
    description: "Çek ile ödeme",
    icon: <FileText className="h-4 w-4" />,
    type: "cek"
  },
  {
    id: "senet",
    label: "Senet",
    description: "Senet ile ödeme",
    icon: <Receipt className="h-4 w-4" />,
    type: "senet"
  }
];

export function PaymentMethodSelector({ onMethodSelect, disabled = false }: PaymentMethodSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleMethodSelect = (method: PaymentMethod) => {
    onMethodSelect(method);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className="flex items-center gap-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Ödeme Ekle
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {paymentMethods.map((method) => (
          <DropdownMenuItem
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="flex-shrink-0 mt-0.5">
              {method.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{method.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {method.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
