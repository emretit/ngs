import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Package, Shield, Search } from "lucide-react";

interface ServiceEquipmentCardProps {
  formData: {
    equipment_id: string | null;
    warranty_info: {
      is_under_warranty: boolean;
      warranty_start?: string;
      warranty_end?: string;
      warranty_notes?: string;
    } | null;
  };
  handleInputChange: (field: string, value: any) => void;
  handleEquipmentSelect: (equipmentId: string) => void;
  equipmentList: any[];
  equipmentLoading: boolean;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: Record<string, string>;
}

const ServiceEquipmentCard: React.FC<ServiceEquipmentCardProps> = ({
  formData,
  handleInputChange,
  handleEquipmentSelect,
  equipmentList = [],
  equipmentLoading = false,
  setFormData,
  errors = {}
}) => {
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [equipmentPopoverOpen, setEquipmentPopoverOpen] = useState(false);

  const filteredEquipment = useMemo(() => {
    if (!equipmentList) return [];
    if (!equipmentSearchQuery.trim()) return equipmentList;
    
    const query = equipmentSearchQuery.toLowerCase();
    return equipmentList.filter((eq: any) => {
      const searchableText = [
        eq.name,
        eq.model,
        eq.serial_number,
        eq.category,
        eq.manufacturer
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [equipmentList, equipmentSearchQuery]);

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
          Ekipman Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Ekipman
          </Label>
          <Popover open={equipmentPopoverOpen} onOpenChange={setEquipmentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={equipmentPopoverOpen}
                className="w-full h-10 text-sm justify-between"
              >
                <div className="flex items-center">
                  {formData.equipment_id ? (
                    <>
                      <Package className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      {equipmentList.find((eq: any) => eq.id === formData.equipment_id)?.name || 'Ekipman seçildi'}
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      Ekipman seçin...
                    </>
                  )}
                </div>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] max-w-[90vw] p-0" align="start">
              <div className="p-4 border-b">
                <Input
                  placeholder="Ekipman ara..."
                  value={equipmentSearchQuery}
                  onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[300px]">
                {equipmentLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Yükleniyor...
                  </div>
                ) : filteredEquipment && filteredEquipment.length > 0 ? (
                  <div className="grid gap-1 p-2">
                    {filteredEquipment.map((equipment: any) => (
                      <div
                        key={equipment.id}
                        className={`flex items-start p-2 cursor-pointer rounded-md hover:bg-muted/50 ${
                          equipment.id === formData.equipment_id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          handleEquipmentSelect(equipment.id);
                          setEquipmentPopoverOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3 mt-1">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">
                            {equipment.name}
                          </p>
                          {equipment.model && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Model: {equipment.model}
                            </p>
                          )}
                          {equipment.serial_number && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Seri No: {equipment.serial_number}
                            </p>
                          )}
                          {equipment.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {equipment.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {formData.equipment_id 
                      ? 'Bu müşteriye ait ekipman bulunamadı'
                      : 'Ekipman bulunamadı'}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Garanti Bilgileri */}
        {formData.warranty_info && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Garanti Bilgisi</span>
            </div>
            {formData.warranty_info.warranty_end && (
              <p className="text-xs text-blue-700">
                Garanti Bitiş: {new Date(formData.warranty_info.warranty_end).toLocaleDateString('tr-TR')}
              </p>
            )}
            <div className="mt-2">
              <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Garanti Notları
              </Label>
              <Textarea
                value={formData.warranty_info.warranty_notes || ''}
                onChange={(e) => setFormData((prev: any) => ({
                  ...prev,
                  warranty_info: prev.warranty_info ? {
                    ...prev.warranty_info,
                    warranty_notes: e.target.value
                  } : null
                }))}
                placeholder="Garanti ile ilgili notlar..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceEquipmentCard;

