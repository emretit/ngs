import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Control, useFormContext } from "react-hook-form";
import { EmployeeFormValues } from "../hooks/useEmployeeForm";
import { supabase } from "@/integrations/supabase/client";

interface AddressSectionEditProps {
  control: Control<EmployeeFormValues>;
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

export const AddressSectionEdit = ({ control }: AddressSectionEditProps) => {
  const { setValue, watch } = useFormContext<EmployeeFormValues>();
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  const selectedCityId = watch("city_id");
  const selectedDistrictId = watch("district_id");

  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const { data, error } = await supabase.rpc('get_cities');
        if (error) throw error;
        setCities(data || []);
      } catch (error) {
        console.error('Error loading cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

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
        } catch (error) {
          console.error('Error loading districts:', error);
        } finally {
          setLoadingDistricts(false);
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
      setNeighborhoods([]);
    }
  }, [selectedCityId]);

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
        } catch (error) {
          console.error('Error loading neighborhoods:', error);
        } finally {
          setLoadingNeighborhoods(false);
        }
      };

      loadNeighborhoods();
    } else {
      setNeighborhoods([]);
    }
  }, [selectedDistrictId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adres Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="city_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şehir</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const cityId = parseInt(value);
                    field.onChange(cityId);
                    setValue("district_id", undefined);
                    setValue("neighborhood_id", undefined);
                  }}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>İlçe</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const districtId = parseInt(value);
                    field.onChange(districtId);
                    setValue("neighborhood_id", undefined);
                  }}
                  value={field.value?.toString() || ""}
                  disabled={!selectedCityId || loadingDistricts}
                >
                  <FormControl>
                    <SelectTrigger>
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
            name="neighborhood_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mahalle</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={!selectedDistrictId || loadingNeighborhoods}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedDistrictId 
                          ? "Önce ilçe seçin" 
                          : loadingNeighborhoods 
                            ? "Yükleniyor..." 
                            : "Mahalle seçin"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {neighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                        {neighborhood.name}
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
                <FormLabel>Posta Kodu</FormLabel>
                <FormControl>
                  <Input placeholder="Posta kodu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="address_line"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Adres Detayı</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Mahalle, sokak, cadde, bina no, daire no vb." 
                    className="resize-none" 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
