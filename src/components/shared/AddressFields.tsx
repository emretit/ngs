import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface City {
  id: number;
  name: string;
  code: string;
}

interface District {
  id: number;
  name: string;
  city_name: string;
}

interface AddressFieldsProps {
  city: string;
  district: string;
  address: string;
  country: string;
  postal_code: string;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
}

export const AddressFields = ({
  city,
  district,
  address,
  country,
  postal_code,
  onCityChange,
  onDistrictChange,
  onAddressChange,
  onCountryChange,
  onPostalCodeChange
}: AddressFieldsProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Load cities on component mount
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
        try {
          const { data, error } = await supabase.rpc('get_cities');
          if (error) {
            console.error('Supabase error loading cities:', error);
            throw error;
          }
          setCities(data || []);
      } catch (error) {
        console.error('Error loading cities:', error);
        // Fallback: try direct table query
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('cities')
            .select('id, name, code')
            .order('name');
          if (fallbackError) throw fallbackError;
          setCities(fallbackData || []);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (city) {
      const loadDistricts = async () => {
        setLoadingDistricts(true);
        try {
          const { data, error } = await supabase.rpc('get_districts_by_city', {
            city_id_param: parseInt(city)
          });
          if (error) {
            console.error('Supabase error loading districts:', error);
            throw error;
          }
          setDistricts(data || []);
          // Reset district selection when city changes
          onDistrictChange('');
        } catch (error) {
          console.error('Error loading districts:', error);
          // Fallback: try direct table query
          try {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('districts')
              .select('id, name, city_name')
              .eq('city_id', parseInt(city))
              .order('name');
            if (fallbackError) throw fallbackError;
            setDistricts(fallbackData || []);
            onDistrictChange('');
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        } finally {
          setLoadingDistricts(false);
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
    }
  }, [city]); // onDistrictChange'i dependency'den çıkardık

  return (
    <div className="space-y-3">
      {/* İl ve İlçe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-medium text-gray-700">
            İl
          </Label>
          <Select
            value={city}
            onValueChange={onCityChange}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={loadingCities ? "Yükleniyor..." : "İl seçiniz"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((cityItem) => (
                <SelectItem key={cityItem.id} value={cityItem.id.toString()}>
                  {cityItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-xs font-medium text-gray-700">
            İlçe
          </Label>
          <Select
            value={district}
            onValueChange={onDistrictChange}
            disabled={!city || loadingDistricts}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={
                !city 
                  ? "Önce il seçiniz" 
                  : loadingDistricts 
                    ? "Yükleniyor..." 
                    : "İlçe seçiniz"
              } />
            </SelectTrigger>
            <SelectContent>
              {districts.map((districtItem) => (
                <SelectItem key={districtItem.id} value={districtItem.id.toString()}>
                  {districtItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Detaylı Adres */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-medium text-gray-700">
          Detaylı Adres
        </Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Mahalle, sokak, bina no..."
          className="text-xs resize-none min-h-[60px]"
        />
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
    </div>
  );
};

export default AddressFields;
