import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Control, useWatch, useFormContext } from "react-hook-form";
import { localAddressService, AddressOption } from "@/services/localAddressService";

interface AddressSectionProps {
  control: Control<any>;
}

export const AddressSection = ({ control }: AddressSectionProps) => {
  const { setValue } = useFormContext();
  
  // State for dynamic data
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<AddressOption[]>([]);

  // Watch form değerleri
  const watchCountry = useWatch({ control, name: "country" }) || "";
  const watchCity = useWatch({ control, name: "city" }) || "";
  const watchDistrict = useWatch({ control, name: "district" }) || "";

  const isTurkey = watchCountry === "Turkey";

  // Load cities when Turkey is selected (instant from local data)
  useEffect(() => {
    if (isTurkey) {
      setCities(localAddressService.getCitiesForSelect());
    } else {
      setCities([]);
      setDistricts([]);
      setNeighborhoods([]);
    }
  }, [isTurkey]);

  // Load districts when city changes (instant from local data)
  useEffect(() => {
    if (isTurkey && watchCity) {
      const selectedCity = cities.find(c => c.value === watchCity);
      if (selectedCity?.id) {
        setDistricts(localAddressService.getDistrictsByCityId(selectedCity.id));
      }
    } else {
      setDistricts([]);
      setNeighborhoods([]);
    }
  }, [watchCity, isTurkey, cities]);

  // Load neighborhoods when district changes (instant from local data)
  useEffect(() => {
    if (isTurkey && watchDistrict) {
      const selectedDistrict = districts.find(d => d.value === watchDistrict);
      if (selectedDistrict?.id) {
        setNeighborhoods(localAddressService.getNeighborhoodsByDistrictIdForSelect(selectedDistrict.id));
      }
    } else {
      setNeighborhoods([]);
    }
  }, [watchDistrict, isTurkey, districts]);

  return (
    <Card className="shadow-md border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-lg">
      <CardHeader className="pb-2 pt-2 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-0.5 rounded-sm bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <MapPin className="h-3 w-3 text-green-600" />
          </div>
          Adres ve Kişisel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0 px-3 pb-3">
        <div className="grid grid-cols-3 gap-2.5">
          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Ülke</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("city", "");
                    setValue("district", "");
                    setValue("neighborhood", "");
                    setValue("postal_code", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Turkey">Türkiye</SelectItem>
                    <SelectItem value="Other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Şehir</FormLabel>
                {isTurkey ? (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("district", "");
                      setValue("neighborhood", "");
                      setValue("postal_code", "");
                    }}
                    value={field.value}
                    disabled={cities.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Şehir seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="Şehir" className="h-7 text-xs" {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">İlçe</FormLabel>
                {isTurkey && districts.length > 0 ? (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("neighborhood", "");
                      setValue("postal_code", "");
                    }}
                    value={field.value}
                    disabled={!watchCity}
                  >
                    <FormControl>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="İlçe seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.value} value={district.value}>
                          {district.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="İlçe" className="h-7 text-xs" {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mahalle - Dropdown veya text input */}
          <FormField
            control={control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Mahalle/Semt</FormLabel>
                {isTurkey && neighborhoods.length > 0 ? (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const neighborhood = neighborhoods.find(n => n.value === value);
                      if (neighborhood?.postalCode) {
                        setValue("postal_code", neighborhood.postalCode);
                      }
                    }}
                    value={field.value}
                    disabled={!watchDistrict}
                  >
                    <FormControl>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Mahalle seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {neighborhoods.map((neighborhood) => (
                        <SelectItem key={neighborhood.value} value={neighborhood.value}>
                          {neighborhood.label} {neighborhood.postalCode && `- ${neighborhood.postalCode}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="Mahalle/Semt" className="h-7 text-xs" {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Posta Kodu */}
          <FormField
            control={control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Posta Kodu</FormLabel>
                <FormControl>
                  <Input
                    placeholder={isTurkey && neighborhoods.length > 0 ? "Mahalle seçildiğinde otomatik doldurulur" : "Posta kodu"}
                    className={`h-7 text-xs ${isTurkey && neighborhoods.length > 0 ? 'bg-gray-50' : ''}`}
                    readOnly={isTurkey && neighborhoods.length > 0}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Detaylı Adres</FormLabel>
              <FormControl>
                <Textarea placeholder="Kapı no, apartman adı, kat, daire no vb. detaylar..." className="min-h-[50px] resize-none text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Kişisel Bilgiler */}
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Kişisel Bilgiler</h4>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">Doğum Tarihi</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-7 text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
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
                      <SelectItem value="single">Bekar</SelectItem>
                      <SelectItem value="married">Evli</SelectItem>
                      <SelectItem value="divorced">Boşanmış</SelectItem>
                      <SelectItem value="widowed">Dul</SelectItem>
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
        </div>
      </CardContent>
    </Card>
  );
};