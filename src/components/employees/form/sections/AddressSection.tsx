import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { MapPin, Home, Building } from "lucide-react";
import { Control, useWatch, useFormContext } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AddressSectionProps {
  control: Control<any>;
}

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

interface Neighborhood {
  id: number;
  name: string;
  postal_code: string;
  district_name: string;
  city_name: string;
}

export const AddressSection = ({ control }: AddressSectionProps) => {
  const { setValue, watch } = useFormContext();
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Watch form values
  const selectedCityId = watch("city_id");
  const selectedDistrictId = watch("district_id");

  // Load cities on component mount
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const { data, error } = await supabase.rpc('get_cities');
        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        logger.error('Error loading cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (selectedCityId) {
      const loadDistricts = async () => {
        setLoadingDistricts(true);
        try {
          const { data, error } = await supabase.rpc('get_districts_by_city', {
            city_id_param: selectedCityId
          });
          if (error) throw error;
          setDistricts(data || []);
          // Reset district and neighborhood selections
          setValue("district_id", undefined);
          setValue("neighborhood_id", undefined);
          setNeighborhoods([]);
        } catch (error) {
          logger.error('Error loading districts:', error);
        } finally {
          setLoadingDistricts(false);
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
      setNeighborhoods([]);
    }
  }, [selectedCityId, setValue]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (selectedDistrictId) {
      const loadNeighborhoods = async () => {
        setLoadingNeighborhoods(true);
        try {
          const { data, error } = await supabase.rpc('get_neighborhoods_by_district', {
            district_id_param: selectedDistrictId
          });
          if (error) throw error;
          setNeighborhoods(data || []);
          // Reset neighborhood selection
          setValue("neighborhood_id", undefined);
        } catch (error) {
          logger.error('Error loading neighborhoods:', error);
        } finally {
          setLoadingNeighborhoods(false);
        }
      };

      loadNeighborhoods();
    } else {
      setNeighborhoods([]);
    }
  }, [selectedDistrictId, setValue]);

  return (
    <div className="space-y-4">
      {/* Kişisel Bilgiler ve Adres */}
      <Card className="shadow-md border border-border/40 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl flex flex-col h-full">
        <CardHeader className="pb-2 pt-2.5">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <MapPin className="h-3.5 w-3.5 text-green-600" />
            </div>
            Kişisel Bilgiler ve Adres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 px-4 pb-4 flex-1">
          {/* Kişisel Bilgiler */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Doğum Tarihi</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    placeholder="Doğum tarihi seçin"
                    className="h-7 text-xs"
                  />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">Cinsiyet</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="erkek">Erkek</SelectItem>
                    <SelectItem value="kadın">Kadın</SelectItem>
                    <SelectItem value="diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marital_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Medeni Durum</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Medeni durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bekar">Bekar</SelectItem>
                    <SelectItem value="evli">Evli</SelectItem>
                    <SelectItem value="boşanmış">Boşanmış</SelectItem>
                    <SelectItem value="dul">Dul</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="id_ssn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">TC Kimlik No / SSN</FormLabel>
                <FormControl>
                  <Input placeholder="TC Kimlik No veya SSN" className="h-7 text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Adres Bilgileri */}
          <div className="pt-1 border-t border-gray-100 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name="city_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Şehir *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const cityId = parseInt(value);
                        field.onChange(cityId);
                        setValue("city_id", cityId);
                      }}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder={loadingCities ? "Yükleniyor..." : "Şehir seçin"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="district_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">İlçe *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const districtId = parseInt(value);
                        field.onChange(districtId);
                        setValue("district_id", districtId);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={!selectedCityId || loadingDistricts}
                    >
                      <FormControl>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder={
                            !selectedCityId 
                              ? "Önce şehir seçin" 
                              : loadingDistricts 
                                ? "Yükleniyor..." 
                                : "İlçe seçin"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id.toString()}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">Posta Kodu</FormLabel>
                  <FormControl>
                    <Input placeholder="Posta kodu" className="h-7 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="address_line"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">Adres Detayı</FormLabel>
                    <FormControl>
                    <Textarea 
                      placeholder="Mahalle, sokak, cadde, bina no, daire no, adres türü vb." 
                      className="h-7 text-xs resize-none" 
                      {...field} 
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Boş alan ekleme */}
            <div className="flex-1"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};