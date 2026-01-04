import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface CurrencyConversionDialog {
  open: boolean;
  oldCurrency: string;
  newCurrency: string;
  oldRate?: number;
  newRate?: number;
  pendingField?: string;
}

interface ProposalEditDialogsProps {
  currencyConversionDialog: CurrencyConversionDialog;
  onCurrencyConversionConfirm: () => void;
  onCurrencyConversionCancel: () => void;
  exchangeRatesMap: Record<string, number>;
  isDeleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  isDeleting: boolean;
  isCustomerSelectDialogOpen: boolean;
  onCustomerSelectDialogOpenChange: (open: boolean) => void;
  selectedCustomerId: string;
  onSelectedCustomerIdChange: (id: string) => void;
  onConfirmCopyDifferentCustomer: () => void;
  customers: any[];
  isCopying: boolean;
}

export const ProposalEditDialogs: React.FC<ProposalEditDialogsProps> = ({
  currencyConversionDialog,
  onCurrencyConversionConfirm,
  onCurrencyConversionCancel,
  exchangeRatesMap,
  isDeleteDialogOpen,
  onDeleteDialogOpenChange,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
  isCustomerSelectDialogOpen,
  onCustomerSelectDialogOpenChange,
  selectedCustomerId,
  onSelectedCustomerIdChange,
  onConfirmCopyDifferentCustomer,
  customers,
  isCopying
}) => {
  const { t } = useTranslation();
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);

  const getCurrencyConversionDescription = () => {
    if (currencyConversionDialog.pendingField === 'currency') {
      const marketRate = currencyConversionDialog.oldCurrency === "TRY" 
        ? 1 
        : (exchangeRatesMap[currencyConversionDialog.oldCurrency] || 1);
      const isCustomRate = currencyConversionDialog.oldRate && 
        currencyConversionDialog.oldRate !== marketRate;
      
      return `Tüm kalemler ${currencyConversionDialog.oldCurrency} para biriminden ${currencyConversionDialog.newCurrency} para birimine dönüştürülecek.\n\n` +
        (currencyConversionDialog.oldCurrency !== "TRY"
          ? `Kullanılacak kur: 1 ${currencyConversionDialog.oldCurrency} = ${currencyConversionDialog.oldRate?.toFixed(4) || 'N/A'} TRY` +
            (isCustomRate
              ? `\n(Girilen özel kur kullanılacak)`
              : '') +
            `\n\n`
          : '') +
        (currencyConversionDialog.newCurrency !== "TRY" && currencyConversionDialog.newRate
          ? `Hedef kur: 1 ${currencyConversionDialog.newCurrency} = ${currencyConversionDialog.newRate.toFixed(4)} TRY\n\n`
          : '') +
        `Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`;
    } else {
      return `Tüm kalemler yeni döviz kuru ile dönüştürülecek.\n\n` +
        `Eski kur: 1 ${currencyConversionDialog.oldCurrency} = ${currencyConversionDialog.oldRate?.toFixed(4) || 'N/A'} TRY\n` +
        `Yeni kur: 1 ${currencyConversionDialog.newCurrency} = ${currencyConversionDialog.newRate?.toFixed(4) || 'N/A'} TRY\n\n` +
        `Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`;
    }
  };

  return (
    <>
      {/* Currency Conversion Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={currencyConversionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            onCurrencyConversionCancel();
          }
        }}
        title="Para Birimi / Döviz Kuru Değişikliği"
        description={getCurrencyConversionDescription()}
        confirmText="Evet, Dönüştür"
        cancelText="İptal"
        variant="default"
        onConfirm={onCurrencyConversionConfirm}
        onCancel={onCurrencyConversionCancel}
      />

      {/* Müşteri Seçim Dialog - Farklı Müşteri İçin Kopyalama */}
      <Dialog open={isCustomerSelectDialogOpen} onOpenChange={onCustomerSelectDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Müşteri Seçin</DialogTitle>
            <DialogDescription>
              Teklifi kopyalamak için bir müşteri seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="customer-select">Müşteri</Label>
            <Popover open={customerSelectOpen} onOpenChange={setCustomerSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSelectOpen}
                  className={cn(
                    "w-full justify-between mt-2",
                    !selectedCustomerId && "text-muted-foreground"
                  )}
                >
                  {selectedCustomerId && customers
                    ? (() => {
                        const selected = customers.find(c => c.id === selectedCustomerId);
                        return selected
                          ? selected.company 
                            ? `${selected.name} (${selected.company})`
                            : selected.name
                          : "Müşteri seçin...";
                      })()
                    : "Müşteri seçin..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Müşteri ara..." />
                  <CommandList>
                    <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      {customers?.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name} ${customer.company || ''}`}
                          onSelect={() => {
                            onSelectedCustomerIdChange(customer.id);
                            setCustomerSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {customer.company && (
                              <span className="text-sm text-muted-foreground">{customer.company}</span>
                            )}
                            {customer.email && (
                              <span className="text-xs text-muted-foreground">{customer.email}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onCustomerSelectDialogOpenChange(false);
                onSelectedCustomerIdChange("");
              }}
              disabled={isCopying}
            >
              İptal
            </Button>
            <Button
              onClick={onConfirmCopyDifferentCustomer}
              disabled={isCopying || !selectedCustomerId}
            >
              {isCopying ? "Kopyalanıyor..." : "Kopyala"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
        title="Teklifi Sil"
        description="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
};

