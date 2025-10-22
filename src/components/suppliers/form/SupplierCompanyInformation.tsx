import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { SupplierFormData } from "@/types/supplier";
import { Building2, FileText } from "lucide-react";

interface SupplierCompanyInformationProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierCompanyInformation = ({ formData, setFormData }: SupplierCompanyInformationProps) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
            <Building2 className="h-4 w-4 text-orange-600" />
          </div>
          Şirket Detay Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
        <div className="grid grid-cols-1 gap-3">
          {/* Ticaret Sicil Bilgileri */}
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trade_registry_number" className="text-xs font-medium text-gray-700">
                  Ticaret Sicil No
                </Label>
                <Input
                  id="trade_registry_number"
                  value={formData.trade_registry_number}
                  onChange={(e) => setFormData({ ...formData, trade_registry_number: e.target.value })}
                  placeholder="123456"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mersis_number" className="text-xs font-medium text-gray-700">
                  MERSİS No
                </Label>
                <Input
                  id="mersis_number"
                  value={formData.mersis_number}
                  onChange={(e) => setFormData({ ...formData, mersis_number: e.target.value })}
                  placeholder="0123456789012345"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tedarikçi Detay Bilgileri */}
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="establishment_date" className="text-xs font-medium text-gray-700">
                    Kuruluş Tarihi
                  </Label>
                  <DatePicker
                    date={formData.establishment_date ? new Date(formData.establishment_date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setFormData({ 
                          ...formData, 
                          establishment_date: `${year}-${month}-${day}` 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          establishment_date: "" 
                        });
                      }
                    }}
                    placeholder="Kuruluş tarihi seçiniz"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sector" className="text-xs font-medium text-gray-700">
                    Sektör/Faaliyet Alanı
                  </Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    placeholder="Teknoloji, İnşaat, Ticaret..."
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="supplier_segment" className="text-xs font-medium text-gray-700">
                    Tedarikçi Segmenti
                  </Label>
                  <Input
                    id="supplier_segment"
                    value={formData.supplier_segment}
                    onChange={(e) => setFormData({ ...formData, supplier_segment: e.target.value })}
                    placeholder="Kurumsal, KOBİ, Bireysel..."
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supplier_source" className="text-xs font-medium text-gray-700">
                    Tedarikçi Kaynağı
                  </Label>
                  <Input
                    id="supplier_source"
                    value={formData.supplier_source}
                    onChange={(e) => setFormData({ ...formData, supplier_source: e.target.value })}
                    placeholder="Web sitesi, Referans, Reklam..."
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                  Notlar
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tedarikçi hakkında özel notlar..."
                  className="h-7 text-xs resize-none min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierCompanyInformation;
