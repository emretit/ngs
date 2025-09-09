import React, { useEffect } from "react";
import { ProposalFormData } from "@/types/proposal-form";
import { Proposal } from "@/types/proposal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ProposalItems from "./items/ProposalItems";
import { DatePicker } from "@/components/ui/date-picker";
import CustomerSelector from "./CustomerSelector";
import EmployeeSelector from "./EmployeeSelector";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "react-router-dom";
import { FileText, Calendar, AlertCircle, ShoppingCart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalFormContentProps {
  formData: ProposalFormData;
  formErrors: Record<string, string>;
  isNew: boolean;
  proposal: Proposal | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDateChange: (date: Date | undefined) => void;
  handleItemsChange: (items: any[]) => void;
  formatDate: (dateString?: string | null) => string;
}

const ProposalFormContent: React.FC<ProposalFormContentProps> = ({
  formData,
  formErrors,
  isNew,
  proposal,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  handleItemsChange,
  formatDate,
}) => {
  const [searchParams] = useSearchParams();
  const focusSection = searchParams.get('focus');

  // Auto scroll to items section if focus=items in URL
  useEffect(() => {
    if (focusSection === 'items') {
      setTimeout(() => {
        const itemsSection = document.getElementById('proposal-items-section');
        if (itemsSection) {
          itemsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          // Add a subtle highlight effect
          itemsSection.style.border = '2px solid hsl(var(--primary))';
          itemsSection.style.borderRadius = '0.5rem';
          setTimeout(() => {
            itemsSection.style.border = '';
          }, 3000);
        }
      }, 500); // Small delay to ensure DOM is rendered
    }
  }, [focusSection]);

  // Convert string date to Date object for DatePicker
  const validUntilDate = formData.valid_until ? new Date(formData.valid_until) : undefined;

  return (
    <div className="space-y-8">
      {/* Temel Bilgiler - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol taraf - Ana bilgiler */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 bg-primary rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">Temel Bilgiler</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Teklif Başlığı
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={cn(
                    "transition-all duration-200",
                    formErrors.title && "border-destructive ring-destructive/20"
                  )}
                  placeholder="Teklif başlığını girin"
                />
                {formErrors.title && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  placeholder="Teklif açıklaması girin"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sağ taraf - Meta bilgiler */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-foreground">Detaylar</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valid_until" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Geçerlilik Tarihi
                </Label>
                <DatePicker 
                  date={validUntilDate}
                  onSelect={(date) => handleDateChange(date)}
                />
                {formErrors.valid_until && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.valid_until}
                  </p>
                )}
              </div>
              
              <CustomerSelector
                value={formData.customer_id || ""}
                onChange={(value) => handleSelectChange("customer_id", value)}
                error={formErrors.customer_id}
              />
              
              <EmployeeSelector
                value={formData.employee_id || ""}
                onChange={(value) => handleSelectChange("employee_id", value)}
                error={formErrors.employee_id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Koşullar - İyileştirilmiş Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="payment_terms" className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Ödeme Koşulları
          </Label>
          <Textarea
            id="payment_terms"
            name="payment_terms"
            value={formData.payment_terms || ""}
            onChange={handleInputChange}
            placeholder="Ödeme koşullarını girin"
            rows={4}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="delivery_terms" className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Teslimat Koşulları
          </Label>
          <Textarea
            id="delivery_terms"
            name="delivery_terms"
            value={formData.delivery_terms || ""}
            onChange={handleInputChange}
            placeholder="Teslimat koşullarını girin"
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Teklif Kalemleri - Vurgulanmış Section */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent" id="proposal-items-section">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Teklif Kalemleri</h3>
              <p className="text-sm text-muted-foreground">Teklif edilen ürün ve hizmetleri ekleyin</p>
            </div>
          </div>
          <ProposalItems 
            items={formData.items || []} 
            onItemsChange={handleItemsChange}
            globalCurrency={formData.currency || "TRY"} 
          />
          {formErrors.items && (
            <p className="text-xs text-destructive mt-3 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.items}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notlar - Geliştirilmiş Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Müşteriye Notlar
          </Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            placeholder="Müşteriye gösterilecek notlar"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Bu notlar müşteri tarafından görülebilir</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="internalNotes" className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            İç Notlar
          </Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            value={formData.internalNotes || ""}
            onChange={handleInputChange}
            placeholder="Sadece şirket içi görülebilecek notlar"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Bu notlar sadece ekip üyeleri tarafından görülür</p>
        </div>
      </div>
    </div>
  );
};

export default ProposalFormContent;