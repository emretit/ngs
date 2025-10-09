import React, { useState, useEffect, useCallback } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { Control, useFormContext } from "react-hook-form";
import { addressService, AddressOption } from "@/services/addressService";
import { cn } from "@/lib/utils";

export interface AddressData {
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  postalCode: string;
}

interface AddressSelectorTRProps {
  control?: Control<any>;
  onChange?: (value: AddressData) => void;
  defaultValues?: Partial<AddressData>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showCard?: boolean;
  fieldPrefix?: string;
}

export const AddressSelectorTR: React.FC<AddressSelectorTRProps> = ({
  control,
  onChange,
  defaultValues,
  disabled = false,
  required = false,
  className,
  showCard = true,
  fieldPrefix = ""
}) => {
  const { setValue, watch } = useFormContext();

  const [cities, setCities] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState({
    cities: false,
    districts: false,
    neighborhoods: false
  });

  const getFieldName = (field: string) => fieldPrefix ? `${fieldPrefix}.${field}` : field;

  // Watch form values
  const watchCountry = watch?.(getFieldName("country")) || defaultValues?.country || "";
  const watchCity = watch?.(getFieldName("city")) || defaultValues?.city || "";
  const watchDistrict = watch?.(getFieldName("district")) || defaultValues?.district || "";
  const watchNeighborhood = watch?.(getFieldName("neighborhood")) || defaultValues?.neighborhood || "";
  const watchAddressDetail = watch?.(getFieldName("addressDetail")) || defaultValues?.addressDetail || "";
  const watchPostalCode = watch?.(getFieldName("postalCode")) || defaultValues?.postalCode || "";

  const isTurkey = watchCountry === "Türkiye" || watchCountry === "Turkey";

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoading(prev => ({ ...prev, cities: true }));
      const citiesData = await addressService.getCities();
      setCities(citiesData);
      setLoading(prev => ({ ...prev, cities: false }));
    };
    
    if (isTurkey) {
      loadCities();
    }
  }, [isTurkey]);

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!isTurkey || !watchCity) {
        setDistricts([]);
        return;
      }

      setLoading(prev => ({ ...prev, districts: true }));
      const districtsData = await addressService.getDistrictsByCity(watchCity);
      setDistricts(districtsData);
      setLoading(prev => ({ ...prev, districts: false }));
    };

    loadDistricts();
  }, [isTurkey, watchCity]);

  // Load neighborhoods when district changes
  useEffect(() => {
    const loadNeighborhoods = async () => {
      if (!isTurkey || !watchDistrict) {
        setNeighborhoods([]);
        return;
      }

      setLoading(prev => ({ ...prev, neighborhoods: true }));
      const neighborhoodsData = await addressService.getNeighborhoodsByCityAndDistrict(watchCity, watchDistrict);
      setNeighborhoods(neighborhoodsData);
      setLoading(prev => ({ ...prev, neighborhoods: false }));
    };

    loadNeighborhoods();
  }, [isTurkey, watchCity, watchDistrict]);

  // Call onChange when values change
  useEffect(() => {
    if (onChange) {
      const addressData: AddressData = {
        country: watchCountry,
        city: watchCity,
        district: watchDistrict,
        neighborhood: watchNeighborhood,
        addressDetail: watchAddressDetail,
        postalCode: watchPostalCode
      };
      onChange(addressData);
    }
  }, [watchCountry, watchCity, watchDistrict, watchNeighborhood, watchAddressDetail, watchPostalCode, onChange]);

  const handleCountryChange = useCallback((value: string) => {
    setValue(getFieldName("country"), value);
    setValue(getFieldName("city"), "");
    setValue(getFieldName("district"), "");
    setValue(getFieldName("neighborhood"), "");
    setValue(getFieldName("postalCode"), "");
  }, [setValue, getFieldName]);

  const handleCityChange = useCallback((value: string) => {
    setValue(getFieldName("city"), value);
    setValue(getFieldName("district"), "");
    setValue(getFieldName("neighborhood"), "");
    setValue(getFieldName("postalCode"), "");
  }, [setValue, getFieldName]);

  const handleDistrictChange = useCallback((value: string) => {
    setValue(getFieldName("district"), value);
    setValue(getFieldName("neighborhood"), "");
    setValue(getFieldName("postalCode"), "");
  }, [setValue, getFieldName]);

  const handleNeighborhoodChange = useCallback((value: string) => {
    const selectedNeighborhood = neighborhoods.find(neighborhood => neighborhood.value === value);
    setValue(getFieldName("neighborhood"), value);
    if (selectedNeighborhood?.postalCode) {
      setValue(getFieldName("postalCode"), selectedNeighborhood.postalCode);
    }
  }, [setValue, getFieldName, neighborhoods]);

  const renderAddressSummary = () => {
    if (!isTurkey || !watchCity || !watchDistrict || !watchNeighborhood) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-primary font-medium">
          <MapPin className="inline h-3 w-3 mr-1" />
          İl: {watchCity}, İlçe: {watchDistrict}, Mahalle: {watchNeighborhood}
        </p>
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {/* Country Selection */}
      {control ? (
        <FormField
          control={control}
          name={getFieldName("country")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Ülke {required && <span className="text-red-500">*</span>}
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCountryChange(value);
                }}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Ülke seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Türkiye">Türkiye</SelectItem>
                  <SelectItem value="Other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Ülke {required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            onValueChange={handleCountryChange}
            value={watchCountry}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Ülke seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Türkiye">Türkiye</SelectItem>
              <SelectItem value="Other">Diğer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* City Selection */}
      {control ? (
        <FormField
          control={control}
          name={getFieldName("city")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                İl {required && <span className="text-red-500">*</span>}
              </FormLabel>
              {isTurkey ? (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleCityChange(value);
                  }}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm" disabled={loading.cities}>
                      <SelectValue placeholder={loading.cities ? "Yükleniyor..." : "İl seçin"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading.cities ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input placeholder="İl" className="h-9 text-sm" {...field} disabled={disabled} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            İl {required && <span className="text-red-500">*</span>}
          </Label>
          {isTurkey ? (
            <Select
              onValueChange={handleCityChange}
              value={watchCity}
              disabled={disabled || loading.cities}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loading.cities ? "Yükleniyor..." : "İl seçin"} />
              </SelectTrigger>
              <SelectContent>
                {loading.cities ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  cities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="İl"
              className="h-9 text-sm"
              value={watchCity}
              onChange={(e) => setValue(getFieldName("city"), e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* District Selection */}
      {control ? (
        <FormField
          control={control}
          name={getFieldName("district")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                İlçe {required && <span className="text-red-500">*</span>}
              </FormLabel>
              {isTurkey && districts.length > 0 ? (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleDistrictChange(value);
                  }}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm" disabled={loading.districts}>
                      <SelectValue placeholder={loading.districts ? "Yükleniyor..." : "İlçe seçin"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading.districts ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      districts.map((district) => (
                        <SelectItem key={district.value} value={district.value}>
                          {district.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input placeholder="İlçe" className="h-9 text-sm" {...field} disabled={disabled} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            İlçe {required && <span className="text-red-500">*</span>}
          </Label>
          {isTurkey && districts.length > 0 ? (
            <Select
              onValueChange={handleDistrictChange}
              value={watchDistrict}
              disabled={disabled || loading.districts}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loading.districts ? "Yükleniyor..." : "İlçe seçin"} />
              </SelectTrigger>
              <SelectContent>
                {loading.districts ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  districts.map((district) => (
                    <SelectItem key={district.value} value={district.value}>
                      {district.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="İlçe"
              className="h-9 text-sm"
              value={watchDistrict}
              onChange={(e) => setValue(getFieldName("district"), e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Neighborhood Selection */}
      {control ? (
        <FormField
          control={control}
          name={getFieldName("neighborhood")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Mahalle {required && <span className="text-red-500">*</span>}
              </FormLabel>
              {isTurkey && neighborhoods.length > 0 ? (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleNeighborhoodChange(value);
                  }}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm" disabled={loading.neighborhoods}>
                      <SelectValue placeholder={loading.neighborhoods ? "Yükleniyor..." : "Mahalle seçin"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading.neighborhoods ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : neighborhoods.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Mahalle verisi bulunamadı
                      </div>
                    ) : (
                      neighborhoods.map((neighborhood) => (
                        <SelectItem key={neighborhood.value} value={neighborhood.value}>
                          {neighborhood.label} {neighborhood.postalCode && `- ${neighborhood.postalCode}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input placeholder="Mahalle/Semt" className="h-9 text-sm" {...field} disabled={disabled} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Mahalle {required && <span className="text-red-500">*</span>}
          </Label>
          {isTurkey && neighborhoods.length > 0 ? (
            <Select
              onValueChange={handleNeighborhoodChange}
              value={watchNeighborhood}
              disabled={disabled || loading.neighborhoods}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loading.neighborhoods ? "Yükleniyor..." : "Mahalle seçin"} />
              </SelectTrigger>
              <SelectContent>
                {loading.neighborhoods ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : neighborhoods.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Mahalle verisi bulunamadı
                  </div>
                ) : (
                  neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.value} value={neighborhood.value}>
                      {neighborhood.label} {neighborhood.postalCode && `- ${neighborhood.postalCode}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Mahalle/Semt"
              className="h-9 text-sm"
              value={watchNeighborhood}
              onChange={(e) => setValue(getFieldName("neighborhood"), e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Address Summary */}
      {renderAddressSummary()}

      {/* Address Detail - sadece fieldPrefix yoksa göster */}
      {!fieldPrefix && control ? (
        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Adres Detayı</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kapı no, apartman adı, kat, daire no vb. detaylar..."
                  className="min-h-[60px] resize-none text-sm"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : !fieldPrefix ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Adres Detayı</Label>
          <Textarea
            placeholder="Kapı no, apartman adı, kat, daire no vb. detaylar..."
            className="min-h-[60px] resize-none text-sm"
            value={watchAddressDetail}
            onChange={(e) => setValue("address", e.target.value)}
            disabled={disabled}
          />
        </div>
      ) : null}

      {/* Postal Code */}
      {control ? (
        <FormField
          control={control}
          name={getFieldName("postalCode")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Posta Kodu</FormLabel>
              <FormControl>
                <Input
                  placeholder={isTurkey && neighborhoods.length > 0 ? "Mahalle seçildiğinde otomatik doldurulur" : "Posta kodu"}
                  className={`h-9 text-sm ${isTurkey && neighborhoods.length > 0 ? 'bg-gray-50' : ''}`}
                  readOnly={isTurkey && neighborhoods.length > 0}
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Posta Kodu</Label>
          <Input
            placeholder={isTurkey && neighborhoods.length > 0 ? "Mahalle seçildiğinde otomatik doldurulur" : "Posta kodu"}
            className={`h-9 text-sm ${isTurkey && neighborhoods.length > 0 ? 'bg-gray-50' : ''}`}
            readOnly={isTurkey && neighborhoods.length > 0}
            value={watchPostalCode}
            onChange={(e) => setValue(getFieldName("postalCode"), e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return <div className={cn("space-y-4", className)}>{content}</div>;
  }

  return (
    <Card className={cn("shadow-md border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-lg", className)}>
      <CardHeader className="pb-2 pt-2 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-0.5 rounded-sm bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <MapPin className="h-3 w-3 text-blue-600" />
          </div>
          Türkiye Adres Seçici
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        {content}
      </CardContent>
    </Card>
  );
};

export default AddressSelectorTR;