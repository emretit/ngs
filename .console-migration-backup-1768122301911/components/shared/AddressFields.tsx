import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocationIQAutocomplete } from "@/hooks/useLocationIQAutocomplete";
import { parseLocationIQResult, formatDisplayName } from "@/utils/locationiqUtils";
import { MapPin, Loader2 } from "lucide-react";

interface AddressFieldsProps {
  city: string;
  district: string;
  address: string;
  country: string;
  postal_code: string;
  apartment_number?: string;
  unit_number?: string;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onApartmentNumberChange?: (value: string) => void;
  onUnitNumberChange?: (value: string) => void;
}

export const AddressFields = ({
  city,
  district,
  address,
  country,
  postal_code,
  apartment_number = '',
  unit_number = '',
  onCityChange,
  onDistrictChange,
  onAddressChange,
  onCountryChange,
  onPostalCodeChange,
  onApartmentNumberChange,
  onUnitNumberChange
}: AddressFieldsProps) => {
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
        onAddressChange(fullAddress);
        
        // Set city - directly use city name (not ID)
        if (parsed.city) {
          onCityChange(parsed.city);
        }
        
        // Set district - directly use district name (not ID)
        if (parsed.district) {
          onDistrictChange(parsed.district);
        }
        
        // Set postal code
        if (parsed.postal_code) {
          onPostalCodeChange(parsed.postal_code);
        }
        
        // Set country
        if (parsed.country) {
          onCountryChange(parsed.country);
        }
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

  // Handle address input change
  const handleAddressInputChange = (value: string) => {
    onAddressChange(value);
    setAutocompleteQuery(value);
    updateQuery(value);
    if (value.length >= 3) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Detaylı Adres with Autocomplete - En üstte */}
      <div className="space-y-1.5 relative" ref={autocompleteRef}>
        <Label htmlFor="address" className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-500" />
          Detaylı Adres
          {isAutocompleteLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => handleAddressInputChange(e.target.value)}
          onFocus={() => {
            if (autocompleteQuery.length >= 3) {
              setShowAutocomplete(true);
            }
          }}
          placeholder="Adres aramak için en az 3 karakter girin..."
          className="text-xs resize-none min-h-[60px]"
        />
        
        {/* Autocomplete Dropdown */}
        {showAutocomplete && autocompleteResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
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
        
        <p className="text-xs text-gray-500">
          💡 İpucu: Adres aramak için LocationIQ otomatik tamamlamayı kullanabilirsiniz
        </p>
      </div>

      {/* İl ve İlçe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-medium text-gray-700">
            İl
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="İl adı giriniz"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-xs font-medium text-gray-700">
            İlçe
          </Label>
          <Input
            id="district"
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            placeholder="İlçe adı giriniz"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Ülke ve Posta Kodu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-xs font-medium text-gray-700">
            Ülke
          </Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder="Türkiye"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postal_code" className="text-xs font-medium text-gray-700">
            Posta Kodu
          </Label>
          <Input
            id="postal_code"
            value={postal_code}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder="34000"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Apartman No ve Daire No */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="apartment_number" className="text-xs font-medium text-gray-700">
            Apartman No
          </Label>
          <Input
            id="apartment_number"
            value={apartment_number}
            onChange={(e) => onApartmentNumberChange?.(e.target.value)}
            placeholder="Apartman numarası"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit_number" className="text-xs font-medium text-gray-700">
            Daire No
          </Label>
          <Input
            id="unit_number"
            value={unit_number}
            onChange={(e) => onUnitNumberChange?.(e.target.value)}
            placeholder="Daire numarası"
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressFields;
