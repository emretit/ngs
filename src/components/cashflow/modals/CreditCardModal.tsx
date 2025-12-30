import { useState, useEffect, useRef } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogCancelButton, UnifiedDialogActionButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  cardId?: string;
}

interface CreditCardFormData {
  card_name: string;
  bank_name: string;
  card_number: string;
  card_type: string;
  expiry_date: string;
  expiry_date_date?: Date;
  credit_limit: string;
  currency: string;
  notes: string;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i);

// Sadece ay/yıl seçici component
const MonthYearPicker = ({ 
  date, 
  onSelect, 
  placeholder = "Ay/Yıl seçin",
  label,
  className 
}: { 
  date?: Date; 
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const currentDate = date || new Date();
  const selectedMonth = getMonth(currentDate);
  const selectedYear = getYear(currentDate);

  // Dışarı tıklanınca dropdown'ları kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    onSelect?.(newDate);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentDate, year);
    onSelect?.(newDate);
    setShowYearPicker(false);
  };

  const displayText = date 
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : placeholder;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label className="text-xs font-medium text-gray-700">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-9 justify-between text-left font-normal text-xs",
              "border-border/50 hover:border-primary/50 hover:bg-accent/30",
              "transition-all duration-200",
              "group",
              !date && "text-muted-foreground"
            )}
          >
            <span className="truncate text-left flex-1">
              {displayText}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-4",
            "bg-popover/95 backdrop-blur-xl",
            "border-border/50",
            "shadow-2xl shadow-black/20",
            "z-[9999] pointer-events-auto",
            "rounded-xl"
          )} 
          align="start"
          sideOffset={8}
        >
          <div className="flex items-center gap-3">
            {/* Ay Seçici */}
            <div className="relative" ref={monthRef}>
              <Label className="text-xs text-muted-foreground mb-2 block">Ay</Label>
              <button
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 w-32",
                  "hover:bg-primary/10 hover:text-primary border border-border",
                  showMonthPicker && "bg-primary/10 text-primary border-primary"
                )}
              >
                {MONTHS[selectedMonth]}
              </button>
              
              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-auto">
                  <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-2 grid grid-cols-3 gap-1 min-w-[200px]">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => handleMonthSelect(index)}
                        className={cn(
                          "px-2 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                          "hover:bg-primary/15 hover:text-primary hover:scale-105",
                          selectedMonth === index 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                            : "text-foreground/80"
                        )}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Yıl Seçici */}
            <div className="relative" ref={yearRef}>
              <Label className="text-xs text-muted-foreground mb-2 block">Yıl</Label>
              <button
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 w-24",
                  "hover:bg-primary/10 hover:text-primary border border-border",
                  showYearPicker && "bg-primary/10 text-primary border-primary"
                )}
              >
                {selectedYear}
              </button>
              
              {showYearPicker && (
                <div className="absolute top-full left-0 mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-auto">
                  <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-2 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <div className="grid grid-cols-3 gap-1 min-w-[150px]">
                      {YEARS.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleYearSelect(year)}
                          className={cn(
                            "px-2 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                            "hover:bg-primary/15 hover:text-primary hover:scale-105",
                            selectedYear === year 
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                              : "text-foreground/80"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const CreditCardModal = ({ isOpen, onClose, onSuccess, mode = 'create', cardId }: CreditCardModalProps) => {
  const [formData, setFormData] = useState<CreditCardFormData>({
    card_name: "",
    bank_name: "",
    card_number: "",
    card_type: "credit",
    expiry_date: "",
    credit_limit: "",
    currency: "TRY",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const formatCardNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return "";
    // 4'lü gruplar halinde formatla
    const formatted = numbers.replace(/(.{4})/g, '$1-');
    // Son tire'yi kaldır
    return formatted.endsWith('-') ? formatted.slice(0, -1) : formatted;
  };

  // Edit modunda formu Supabase'den doldur
  useEffect(() => {
    const prefill = async () => {
      if (!isOpen || mode !== 'edit' || !cardId) return;
      setIsPrefilling(true);
      try {
        const { data, error } = await supabase
          .from('credit_cards')
          .select('card_name, bank_name, card_number, card_type, expiry_date, credit_limit, currency, notes')
          .eq('id', cardId)
          .single();

        if (error) throw error;
        if (data) {
          // Veritabanından gelen tarihi parse et (YYYY-MM-DD formatından ay/yıl çıkar)
          let expiryDate: Date | undefined;
          if (data.expiry_date) {
            const dateParts = data.expiry_date.split('-');
            if (dateParts.length >= 2) {
              const year = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]);
              // Ayın ilk gününü kullan (kullanıcı sadece ay/yıl seçiyor)
              expiryDate = new Date(year, month - 1, 1);
            }
          }
          setFormData({
            card_name: data.card_name || "",
            bank_name: data.bank_name || "",
            card_number: data.card_number ? formatCardNumber(data.card_number) : "",
            card_type: data.card_type || 'credit',
            expiry_date: data.expiry_date || "",
            expiry_date_date: expiryDate,
            credit_limit: data.credit_limit ? String(data.credit_limit) : "",
            currency: data.currency || 'TRY',
            notes: data.notes || ""
          });
        }
      } catch (e) {
        console.error('Error pre-filling credit card:', e);
        toast.error("Kart bilgileri yüklenirken hata oluştu");
      } finally {
        setIsPrefilling(false);
      }
    };
    prefill();
  }, [isOpen, mode, cardId]);

  const handleInputChange = (field: keyof CreditCardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    handleInputChange('card_number', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.card_name.trim() || !formData.bank_name.trim()) {
      toast.error("Kart adı ve banka adı zorunludur");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Company ID'yi al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const creditLimit = formData.credit_limit ? parseFloat(formData.credit_limit) : 0;
      
      if (mode === 'edit' && cardId) {
        const { error } = await supabase
          .from('credit_cards')
          .update({
            card_name: formData.card_name.trim(),
            bank_name: formData.bank_name.trim(),
            card_number: formData.card_number.replace(/-/g, '') || null,
            card_type: formData.card_type,
            expiry_date: formData.expiry_date || null,
            credit_limit: creditLimit > 0 ? creditLimit : null,
            currency: formData.currency,
            notes: formData.notes.trim() || null
          })
          .eq('id', cardId);

        if (error) throw error;
        toast.success("Kredi kartı güncellendi");
      } else {
        const { error } = await supabase
          .from('credit_cards')
          .insert({
            card_name: formData.card_name.trim(),
            bank_name: formData.bank_name.trim(),
            card_number: formData.card_number.replace(/-/g, '') || null,
            card_type: formData.card_type,
            expiry_date: formData.expiry_date || null,
            credit_limit: creditLimit > 0 ? creditLimit : null,
            available_limit: creditLimit > 0 ? creditLimit : null,
            current_balance: 0,
            currency: formData.currency,
            notes: formData.notes.trim() || null,
            company_id: profile.company_id
          });

        if (error) throw error;
        toast.success("Kredi kartı oluşturuldu");
      }

      onSuccess();
      onClose();
      setFormData({
        card_name: "",
        bank_name: "",
        card_number: "",
        card_type: "credit",
        expiry_date: "",
        expiry_date_date: undefined,
        credit_limit: "",
        currency: "TRY",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating credit card:', error);
      toast.error("Kredi kartı oluşturulurken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? "Kredi Kartını Düzenle" : "Yeni Kredi Kartı"}
      maxWidth="md"
      headerColor="purple"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card_name" className="text-sm font-medium text-gray-700">
              Kart Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="card_name"
              value={formData.card_name}
              onChange={(e) => handleInputChange('card_name', e.target.value)}
              placeholder="Örn: İş Bankası Kredi Kartı"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name" className="text-sm font-medium text-gray-700">
              Banka Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="Örn: Türkiye İş Bankası"
              required
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card_number" className="text-sm font-medium text-gray-700">Kart Numarası</Label>
          <Input
            id="card_number"
            type="text"
            value={formData.card_number}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="1234-5678-9012-3456"
            maxLength={19}
            className="h-9"
            disabled={isLoading || isPrefilling}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card_type" className="text-sm font-medium text-gray-700">Kart Türü</Label>
            <Select value={formData.card_type} onValueChange={(value) => handleInputChange('card_type', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Kredi Kartı</SelectItem>
                <SelectItem value="debit">Banka Kartı</SelectItem>
                <SelectItem value="corporate">Kurumsal Kart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <MonthYearPicker
            label="Son Kullanma Tarihi"
            date={formData.expiry_date_date}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                // Ayın son gününü hesapla (veritabanı date tipi için)
                const lastDayOfMonth = new Date(year, month, 0).getDate();
                const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
                handleInputChange('expiry_date', fullDate);
                // Görüntüleme için ayın ilk gününü kullan (kullanıcı sadece ay/yıl seçiyor)
                const displayDate = new Date(year, month - 1, 1);
                setFormData(prev => ({ ...prev, expiry_date_date: displayDate }));
              } else {
                handleInputChange('expiry_date', '');
                setFormData(prev => ({ ...prev, expiry_date_date: undefined }));
              }
            }}
            placeholder="Ay/Yıl seçin"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="credit_limit" className="text-sm font-medium text-gray-700">Kredi Limiti</Label>
            <Input
              id="credit_limit"
              type="number"
              value={formData.credit_limit}
              onChange={(e) => handleInputChange('credit_limit', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Para Birimi</Label>
            <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Kart hakkında notlar"
            rows={3}
            className="resize-none"
          />
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading} />
          <UnifiedDialogActionButton
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={isLoading || isPrefilling}
            loading={isLoading || isPrefilling}
            variant="primary"
          >
            {mode === 'edit' ? 'Kaydet' : 'Oluştur'}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default CreditCardModal;
