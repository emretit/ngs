import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CreditCard, FileText, Receipt, MoreHorizontal, Edit, FileSpreadsheet, ArrowLeftRight } from "lucide-react";
import IncomingCheckDialog from "@/components/cashflow/checks/IncomingCheckDialog";
import OutgoingCheckDialog from "@/components/cashflow/checks/OutgoingCheckDialog";
import BalanceAdjustmentDialog from "./BalanceAdjustmentDialog";
import ReceiptVoucherDialog from "./ReceiptVoucherDialog";
import CariVirmanDialog from "./CariVirmanDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "hesap" | "cek" | "senet" | "bakiye_duzelt" | "fis_olustur" | "cari_virman";
}

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  customerId?: string;  // Müşteri sayfasında kullanılıyorsa
  supplierId?: string;  // Tedarikçi sayfasında kullanılıyorsa
  calculatedBalance?: number;  // Hesaplanan gerçek bakiye (opsiyonel)
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "hesap",
    label: "Hesap Ödemesi",
    description: "Nakit, Banka ve ya Kredi Kartı",
    icon: <CreditCard className="h-4 w-4 text-blue-500" />,
    type: "hesap"
  },
  {
    id: "cek",
    label: "Çek",
    description: "Çek ile ödeme",
    icon: <FileText className="h-4 w-4 text-green-500" />,
    type: "cek"
  },
  {
    id: "senet",
    label: "Senet",
    description: "Senet ile ödeme",
    icon: <Receipt className="h-4 w-4 text-purple-500" />,
    type: "senet"
  }
];

const balanceActions: PaymentMethod[] = [
  {
    id: "bakiye_duzelt",
    label: "Bakiye Düzelt",
    description: "Bakiye düzeltme işlemi",
    icon: <Edit className="h-4 w-4 text-orange-500" />,
    type: "bakiye_duzelt"
  },
  {
    id: "fis_olustur",
    label: "Alacak-Borç Fişi Oluştur",
    description: "Ödeme fişi oluştur",
    icon: <FileSpreadsheet className="h-4 w-4 text-indigo-500" />,
    type: "fis_olustur"
  },
  {
    id: "cari_virman",
    label: "Cari Virman",
    description: "Cari virman işlemi",
    icon: <ArrowLeftRight className="h-4 w-4 text-teal-500" />,
    type: "cari_virman"
  }
];

export function PaymentMethodSelector({ onMethodSelect, disabled = false, customerId, supplierId, calculatedBalance }: PaymentMethodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [incomingCheckDialogOpen, setIncomingCheckDialogOpen] = useState(false);
  const [outgoingCheckDialogOpen, setOutgoingCheckDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [cariVirmanDialogOpen, setCariVirmanDialogOpen] = useState(false);

  // Müşteri bilgilerini çek
  const { data: customerData } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, balance")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // Tedarikçi bilgilerini çek
  const { data: supplierData } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company, balance")
        .eq("id", supplierId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const handleMethodSelect = (method: PaymentMethod) => {
    // Çek seçildiğinde dialog aç
    if (method.type === "cek") {
      // Müşteri varsa gelen çek, tedarikçi varsa giden çek
      if (customerId) {
        setIncomingCheckDialogOpen(true);
      } else if (supplierId) {
        setOutgoingCheckDialogOpen(true);
      } else {
        // Varsayılan olarak gelen çek
        setIncomingCheckDialogOpen(true);
      }
      setOpen(false);
      return;
    }

    // Bakiye düzelt seçildiğinde dialog aç
    if (method.type === "bakiye_duzelt") {
      setBalanceDialogOpen(true);
      setOpen(false);
      return;
    }

    // Fiş oluştur seçildiğinde dialog aç
    if (method.type === "fis_olustur") {
      setVoucherDialogOpen(true);
      setOpen(false);
      return;
    }

    // Cari virman seçildiğinde dialog aç
    if (method.type === "cari_virman") {
      setCariVirmanDialogOpen(true);
      setOpen(false);
      return;
    }

    // Diğer seçenekler için callback'i çağır
    onMethodSelect(method);
    setOpen(false);
  };

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="gap-2 h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 transition-all duration-200 hover:shadow-sm"
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4 text-white" />
          <span className="font-medium text-white">Ödeme Ekle</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ödeme Türü</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {paymentMethods.map((method) => (
          <DropdownMenuItem
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className="gap-2 cursor-pointer"
          >
            <div className="flex-shrink-0">
              {method.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {method.id === "hesap" 
                  ? method.description
                  : method.label
                }
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Bakiye</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {balanceActions.map((method) => (
          <DropdownMenuItem
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className="gap-2 cursor-pointer"
          >
            <div className="flex-shrink-0">
              {method.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{method.label}</div>
              {method.id !== "bakiye_duzelt" && method.id !== "fis_olustur" && (
                <div className="text-xs text-muted-foreground mt-1">
                  {method.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Gelen Çek Dialogu */}
    <IncomingCheckDialog
      open={incomingCheckDialogOpen}
      onOpenChange={setIncomingCheckDialogOpen}
      defaultCustomerId={customerId}
      onSaved={() => {
        setIncomingCheckDialogOpen(false);
      }}
    />

    {/* Giden Çek Dialogu */}
    <OutgoingCheckDialog
      open={outgoingCheckDialogOpen}
      onOpenChange={setOutgoingCheckDialogOpen}
      defaultSupplierId={supplierId}
      onSaved={() => {
        setOutgoingCheckDialogOpen(false);
      }}
    />

    {/* Bakiye Düzeltme Dialogu */}
    {(customerId || supplierId) && (customerData || supplierData) && (
      <BalanceAdjustmentDialog
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        customerId={customerId}
        supplierId={supplierId}
        currentBalance={
          // Hesaplanan bakiye varsa onu kullan, yoksa database'den gelen değeri kullan
          calculatedBalance !== undefined
            ? calculatedBalance
            : (customerId ? (customerData?.balance || 0) : (supplierData?.balance || 0))
        }
        partnerName={customerId
          ? (customerData?.company || customerData?.name || "")
          : (supplierData?.company || supplierData?.name || "")
        }
        onSaved={() => {
          setBalanceDialogOpen(false);
        }}
      />
    )}

    {/* Alacak-Borç Fişi Dialogu */}
    {(customerId || supplierId) && (customerData || supplierData) && (
      <ReceiptVoucherDialog
        open={voucherDialogOpen}
        onOpenChange={setVoucherDialogOpen}
        customerId={customerId}
        supplierId={supplierId}
        partnerName={customerId
          ? (customerData?.company || customerData?.name || "")
          : (supplierData?.company || supplierData?.name || "")
        }
        onSaved={() => {
          setVoucherDialogOpen(false);
        }}
      />
    )}

    {/* Cari Virman Dialogu */}
    {(customerId || supplierId) && (customerData || supplierData) && (
      <CariVirmanDialog
        open={cariVirmanDialogOpen}
        onOpenChange={setCariVirmanDialogOpen}
        customerId={customerId}
        supplierId={supplierId}
        onSaved={() => {
          setCariVirmanDialogOpen(false);
        }}
      />
    )}
    </>
  );
}
