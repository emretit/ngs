import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, MapPin, Loader2 } from "lucide-react";
import { useLocationIQAutocomplete } from "@/hooks/useLocationIQAutocomplete";
import { parseLocationIQResult, formatDisplayName } from "@/utils/locationiqUtils";

interface ServiceBasicInfoCardProps {
  formData: {
    service_title: string;
    service_type: string;
    slip_number: string;
    service_request_description: string;
    service_location: string;
    service_priority: 'low' | 'medium' | 'high' | 'urgent';
    service_status: 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  };
  handleInputChange: (field: string, value: any) => void;
  priorityConfig: {
    [key: string]: {
      label: string;
      color: string;
      icon: string;
    };
  };
  errors?: Record<string, string>;
}

const ServiceBasicInfoCard: React.FC<ServiceBasicInfoCardProps> = ({
  formData,
  handleInputChange,
  priorityConfig,
  errors = {}
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // LocationIQ autocomplete hook
  const {
    results: autocompleteResults,
    isLoading: isAutocompleteLoading,
    updateQuery,
    clear: clearAutocomplete,
  } = useLocationIQAutocomplete({
    debounceMs: 300,
    minChars: 3,
  });

  // Handle address autocomplete selection
  const handleAutocompleteSelect = async (result: any) => {
    try {
      const parsed = await parseLocationIQResult(result);
      
      if (parsed) {
        // Set address - use display_name if address is empty
        const fullAddress = parsed.address || parsed.display_name || '';
        handleInputChange('service_location', fullAddress);
      }
    } catch (error) {
      console.error('Error processing autocomplete result:', error);
    } finally {
      setShowAutocomplete(false);
      clearAutocomplete();
    }
  };

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle location input change
  const handleLocationInputChange = (value: string) => {
    handleInputChange('service_location', value);
    setAutocompleteQuery(value);
    updateQuery(value);
    if (value.length >= 3) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl relative z-10">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          Temel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="service_title" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Başlığı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="service_title"
              value={formData.service_title}
              onChange={(e) => handleInputChange('service_title', e.target.value)}
              placeholder="Örn: Klima bakımı, Elektrik arızası..."
              className="h-10 text-sm"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="slip_number" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Fişi No
            </Label>
            <Input
              id="slip_number"
              value={formData.slip_number}
              onChange={(e) => handleInputChange('slip_number', e.target.value)}
              placeholder="Fiş numarası (opsiyonel)"
              className="h-10 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="service_type" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Türü
            </Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => handleInputChange('service_type', value)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Servis türü seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bakım">Bakım</SelectItem>
                <SelectItem value="onarım">Onarım</SelectItem>
                <SelectItem value="kurulum">Kurulum</SelectItem>
                <SelectItem value="yazılım">Yazılım</SelectItem>
                <SelectItem value="donanım">Donanım</SelectItem>
                <SelectItem value="ağ">Ağ</SelectItem>
                <SelectItem value="güvenlik">Güvenlik</SelectItem>
                <SelectItem value="diğer">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="service_status" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Servis Durumu
            </Label>
            <Select
              value={formData.service_status}
              onValueChange={(value) => handleInputChange('service_status', value)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Durum seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Yeni</span>
                  </div>
                </SelectItem>
                <SelectItem value="assigned">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Atanmış</span>
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span>Devam Ediyor</span>
                  </div>
                </SelectItem>
                <SelectItem value="on_hold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Beklemede</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Tamamlandı</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>İptal Edildi</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="service_request_description" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Açıklaması <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="service_request_description"
            value={formData.service_request_description}
            onChange={(e) => handleInputChange('service_request_description', e.target.value)}
            placeholder="Servisin detaylarını, yapılması gereken işlemleri ve özel notları açıklayın..."
            rows={4}
            className="resize-none text-sm min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative" ref={autocompleteRef}>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              Lokasyon
              {isAutocompleteLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </Label>
            <Input
              value={formData.service_location}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onFocus={() => {
                if (autocompleteQuery.length >= 3) {
                  setShowAutocomplete(true);
                }
              }}
              placeholder="Adres aramak için en az 3 karakter girin..."
              className="h-10 text-sm"
            />
            
            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute z-[9999] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {autocompleteResults.map((result, index) => (
                  <button
                    key={`${result.place_id}-${index}`}
                    type="button"
                    onClick={() => handleAutocompleteSelect(result)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {formatDisplayName(result)}
                        </div>
                        {result.address?.postcode && (
                          <div className="text-gray-500 text-xs mt-0.5">
                            Posta Kodu: {result.address.postcode}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Öncelik
            </Label>
            <Select
              value={formData.service_priority}
              onValueChange={(value) => handleInputChange('service_priority', value as any)}
            >
              <SelectTrigger className={`h-10 text-sm ${priorityConfig[formData.service_priority].color} border font-medium`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceBasicInfoCard;

