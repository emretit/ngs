import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, CheckCircle, Search, Package, User, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServiceSlipData, ServiceSlipFormData } from "@/types/service-slip";
import { ServiceSlipService } from "@/services/serviceSlipService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import ProductSearchDialog from "@/components/proposals/form/items/product-dialog/ProductSearchDialog";
import { Product } from "@/types/product";

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
    technician_signature: '',
  });

  // Müşteri ve ürün seçimi için state'ler
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [equipmentInfo, setEquipmentInfo] = useState({
    name: '',
    model: '',
    serial_number: '',
    location: ''
  });
  const [serviceType, setServiceType] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('');

  // Müşteri verilerini çek
  const { customers, isLoading: customersLoading } = useCustomerSelect();

  useEffect(() => {
    if (existingSlip) {
      setFormData({
        problem_description: existingSlip.service_details.problem_description,
        work_performed: existingSlip.service_details.work_performed,
        parts_used: existingSlip.service_details.parts_used,
        completion_date: existingSlip.completion_date || '',
        technician_signature: existingSlip.technician_signature,
      });
      
      // Müşteri bilgilerini set et
      if (existingSlip.customer) {
        setSelectedCustomer(existingSlip.customer);
      }
      
      // Ekipman bilgilerini set et
      if (existingSlip.equipment) {
        setEquipmentInfo({
          name: existingSlip.equipment.name || '',
          model: existingSlip.equipment.model || '',
          serial_number: existingSlip.equipment.serial_number || '',
          location: existingSlip.equipment.location || ''
        });
      }
      
      // Servis türü ve garanti durumu
      setServiceType(existingSlip.service_details.service_type || '');
      setWarrantyStatus(existingSlip.service_details.warranty_status || '');
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

  const handleProductSelect = (product: Product, quantity?: number, customPrice?: number, discountRate?: number) => {
    const finalPrice = customPrice !== undefined ? customPrice : (product.price || 0);
    const finalQuantity = quantity || 1;
    
    const newPart = {
      name: product.name,
      quantity: finalQuantity,
      unit_price: finalPrice
    };
    
    setFormData(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, newPart]
    }));
    
    setShowProductDialog(false);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    setSelectedCustomer(customer);
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

      // Form verilerini genişlet
      const extendedFormData = {
        ...formData,
        customer_id: selectedCustomer?.id,
        equipment: equipmentInfo,
        service_type: serviceType,
        warranty_status: warrantyStatus,
      };

      let slip: ServiceSlipData;

      if (existingSlip) {
        slip = await ServiceSlipService.updateServiceSlip(existingSlip.id, extendedFormData);
        toast({
          title: "Başarılı",
          description: "Servis fişi güncellendi.",
        });
      } else {
        slip = await ServiceSlipService.createServiceSlip(serviceRequestId, extendedFormData);
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
        description: "Servis başarıyla tamamlandı.",
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {existingSlip ? 'Servis Fişini Düzenle' : 'Yeni Servis Fişi'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Müşteri Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Müşteri Seç</Label>
                <Select onValueChange={handleCustomerSelect} value={selectedCustomer?.id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.company && `(${customer.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCustomer && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Ad Soyad</Label>
                    <p className="text-sm">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Şirket</Label>
                    <p className="text-sm">{selectedCustomer.company || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefon</Label>
                    <p className="text-sm">{selectedCustomer.mobile_phone || selectedCustomer.office_phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">E-posta</Label>
                    <p className="text-sm">{selectedCustomer.email || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ekipman Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Ekipman Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_name">Ekipman Adı</Label>
                  <Input
                    id="equipment_name"
                    placeholder="Ekipman adı"
                    value={equipmentInfo.name}
                    onChange={(e) => setEquipmentInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_model">Model</Label>
                  <Input
                    id="equipment_model"
                    placeholder="Model"
                    value={equipmentInfo.model}
                    onChange={(e) => setEquipmentInfo(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_serial">Seri No</Label>
                  <Input
                    id="equipment_serial"
                    placeholder="Seri numarası"
                    value={equipmentInfo.serial_number}
                    onChange={(e) => setEquipmentInfo(prev => ({ ...prev, serial_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_location">Lokasyon</Label>
                  <Input
                    id="equipment_location"
                    placeholder="Lokasyon"
                    value={equipmentInfo.location}
                    onChange={(e) => setEquipmentInfo(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servis Türü ve Garanti */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servis Türü</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Servis türü seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bakim">Bakım</SelectItem>
                  <SelectItem value="onarim">Onarım</SelectItem>
                  <SelectItem value="kurulum">Kurulum</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="diger">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Garanti Durumu</Label>
              <Select value={warrantyStatus} onValueChange={setWarrantyStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Garanti durumu seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="garanti_kapsaminda">Garanti Kapsamında</SelectItem>
                  <SelectItem value="garanti_disinda">Garanti Dışında</SelectItem>
                  <SelectItem value="uzatilmis_garanti">Uzatılmış Garanti</SelectItem>
                  <SelectItem value="belirsiz">Belirsiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Kullanılan Parçalar
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductDialog(true)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Ürün Seç
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPart}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manuel Ekle
                  </Button>
                </div>
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
              <Button onClick={handleComplete} disabled={loading} variant="default">
                <CheckCircle className="h-4 w-4 mr-2" />
                Servisi Tamamla
              </Button>
            )}

            <Button onClick={onClose} variant="outline">
              İptal
            </Button>
          </div>
        </div>

        {/* Ürün Seçim Dialogu */}
        <ProductSearchDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
          onSelectProduct={handleProductSelect}
          selectedCurrency="TRY"
        />
      </SheetContent>
    </Sheet>
  );
};