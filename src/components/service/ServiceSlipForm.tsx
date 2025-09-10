import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText, Download, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ServiceSlipData, ServiceSlipFormData } from "@/types/service-slip";
import { ServiceSlipService } from "@/services/serviceSlipService";
import { ServiceSlipPdfService } from "@/services/pdf/serviceSlipPdfService";

interface ServiceSlipFormProps {
  serviceRequestId: string;
  isOpen: boolean;
  onClose: () => void;
  existingSlip?: ServiceSlipData | null;
}

export const ServiceSlipForm: React.FC<ServiceSlipFormProps> = ({
  serviceRequestId,
  isOpen,
  onClose,
  existingSlip
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ServiceSlipFormData>({
    problem_description: '',
    work_performed: '',
    parts_used: [],
    completion_date: '',
  });

  useEffect(() => {
    if (existingSlip) {
      setFormData({
        problem_description: existingSlip.service_details.problem_description,
        work_performed: existingSlip.service_details.work_performed,
        parts_used: existingSlip.service_details.parts_used,
        completion_date: existingSlip.completion_date || '',
        technician_signature: existingSlip.technician_signature,
      });
    }
  }, [existingSlip]);

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, { name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parts_used: prev.parts_used.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.problem_description.trim() || !formData.work_performed.trim()) {
        toast({
          title: "Eksik Bilgi",
          description: "Problem tanımı ve yapılan işlemler alanları zorunludur.",
          variant: "destructive",
        });
        return;
      }

      let slip: ServiceSlipData;

      if (existingSlip) {
        slip = await ServiceSlipService.updateServiceSlip(existingSlip.id, formData);
        toast({
          title: "Başarılı",
          description: "Servis fişi güncellendi.",
        });
      } else {
        slip = await ServiceSlipService.createServiceSlip(serviceRequestId, formData);
        toast({
          title: "Başarılı",
          description: "Servis fişi oluşturuldu.",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving service slip:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Servis fişi kaydedilemedi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      if (!existingSlip) {
        toast({
          title: "Hata",
          description: "Önce servis fişini kaydetmelisiniz.",
          variant: "destructive",
        });
        return;
      }

      await ServiceSlipService.completeService(existingSlip.id, formData.technician_signature);
      
      toast({
        title: "Servis Tamamlandı",
        description: "Servis başarıyla tamamlandı ve PDF oluşturulabilir.",
      });

      onClose();
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Servis tamamlanamadı.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!existingSlip) {
      toast({
        title: "Hata",
        description: "PDF oluşturmak için önce servis fişini kaydetmelisiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ServiceSlipPdfService.downloadPdf(existingSlip);
      toast({
        title: "PDF İndirildi",
        description: "Servis fişi PDF olarak indirildi.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulamadı.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewPdf = async () => {
    if (!existingSlip) {
      toast({
        title: "Hata",
        description: "PDF önizleme için önce servis fişini kaydetmelisiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ServiceSlipPdfService.openPdfInNewTab(existingSlip);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast({
        title: "Hata",
        description: "PDF önizleme açılamadı.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {existingSlip ? 'Servis Fişini Düzenle' : 'Yeni Servis Fişi'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Problem Description */}
          <div className="space-y-2">
            <Label htmlFor="problem_description">Problem Tanımı *</Label>
            <Textarea
              id="problem_description"
              placeholder="Müşterinin bildirdiği problem..."
              value={formData.problem_description}
              onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Work Performed */}
          <div className="space-y-2">
            <Label htmlFor="work_performed">Yapılan İşlemler *</Label>
            <Textarea
              id="work_performed"
              placeholder="Gerçekleştirilen işlemler ve çözümler..."
              value={formData.work_performed}
              onChange={(e) => setFormData(prev => ({ ...prev, work_performed: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Parts Used */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Kullanılan Parçalar
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPart}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Parça Ekle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.parts_used.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Henüz parça eklenmemiş
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.parts_used.map((part, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Parça Adı</Label>
                        <Input
                          placeholder="Parça adı"
                          value={part.name}
                          onChange={(e) => updatePart(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <Label>Miktar</Label>
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Birim Fiyat</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={part.unit_price || ''}
                          onChange={(e) => updatePart(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePart(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Date */}
          <div className="space-y-2">
            <Label htmlFor="completion_date">Tamamlanma Tarihi</Label>
            <Input
              id="completion_date"
              type="datetime-local"
              value={formData.completion_date}
              onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              {existingSlip ? 'Güncelle' : 'Kaydet'}
            </Button>

            {existingSlip && (
              <>
                <Button onClick={handleComplete} disabled={loading} variant="default">
                  Servisi Tamamla
                </Button>
                
                <Button onClick={handlePreviewPdf} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  PDF Önizleme
                </Button>
                
                <Button onClick={handleGeneratePdf} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  PDF İndir
                </Button>
              </>
            )}

            <Button onClick={onClose} variant="outline">
              İptal
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};