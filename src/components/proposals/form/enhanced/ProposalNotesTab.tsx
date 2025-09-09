import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, FileText, CreditCard, Truck, MessageSquare, Loader2 } from "lucide-react";

interface ProposalNotesTabProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  validationErrors: Record<string, string[]>;
  onSave: () => void;
  saving: boolean;
}

const ProposalNotesTab: React.FC<ProposalNotesTabProps> = ({
  formData,
  onFieldChange,
  validationErrors,
  onSave,
  saving
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Notlar & Şartlar
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ödeme şartları, teslimat bilgileri ve ek notları ekleyin
          </p>
        </div>
        <Button onClick={onSave} disabled={saving} className="gap-2" size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {saving ? "Kaydediliyor..." : "Teklifi Tamamla"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment & Delivery Terms */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Ödeme Şartları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Ödeme Koşulları</Label>
                <Textarea
                  id="payment_terms"
                  value={formData.payment_terms || ""}
                  onChange={(e) => onFieldChange("payment_terms", e.target.value)}
                  placeholder="Örn: %30 peşin, %70 teslimat sonrası 30 gün vadeli"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Teslimat Şartları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="delivery_terms">Teslimat Koşulları</Label>
                <Textarea
                  id="delivery_terms"
                  value={formData.delivery_terms || ""}
                  onChange={(e) => onFieldChange("delivery_terms", e.target.value)}
                  placeholder="Örn: 15 iş günü içinde, adresinize teslim"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Genel Notlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Müşteri Notları</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => onFieldChange("notes", e.target.value)}
                  placeholder="Müşteriye gösterilecek ek bilgiler ve notlar"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                İç Notlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="internal_notes">Dahili Notlar</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes || ""}
                  onChange={(e) => onFieldChange("internal_notes", e.target.value)}
                  placeholder="Sadece ekibinizin göreceği dahili notlar"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Genel Şartlar ve Koşullar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="terms_and_conditions">Şartlar ve Koşullar</Label>
            <Textarea
              id="terms_and_conditions"
              value={formData.terms_and_conditions || ""}
              onChange={(e) => onFieldChange("terms_and_conditions", e.target.value)}
              placeholder="Hukuki şartlar, garanti koşulları ve diğer önemli maddeler"
              rows={6}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Teklif Hazır!</h4>
                <p className="text-sm text-green-700">
                  Tüm bilgiler tamamlandı. Şimdi teklifinizi kaydedip gönderebilirsiniz.
                </p>
              </div>
            </div>
            <Button onClick={onSave} disabled={saving} size="lg" className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {saving ? "Kaydediliyor..." : "Teklifi Gönder"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalNotesTab; 