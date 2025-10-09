import React from "react";
import { Control } from "react-hook-form";
import { AddressSelectorTR, AddressData } from "@/components/forms/AddressSelectorTR";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User } from "lucide-react";

interface AddressSectionNewProps {
  control: Control<any>;
  onAddressChange?: (address: AddressData) => void;
}

export const AddressSectionNew: React.FC<AddressSectionNewProps> = ({
  control,
  onAddressChange
}) => {
  const handleAddressChange = (addressData: AddressData) => {
    // Bu fonksiyon ile adres verileri otomatik olarak form'a aktarılabilir
    console.log("Address changed:", addressData);
    if (onAddressChange) {
      onAddressChange(addressData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Adres Bilgileri */}
      <AddressSelectorTR
        control={control}
        onChange={handleAddressChange}
        required={true}
        showCard={true}
        fieldPrefix="address"
      />

      {/* Kişisel Bilgiler */}
      <Card className="shadow-md border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-lg">
        <CardHeader className="pb-2 pt-2 px-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-0.5 rounded-sm bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <User className="h-3 w-3 text-purple-600" />
            </div>
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 px-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Doğum Tarihi</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-9 text-sm" {...field} />
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
                  <FormLabel className="text-sm font-medium text-gray-700">Cinsiyet</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
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
                  <FormLabel className="text-sm font-medium text-gray-700">Medeni Durum</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
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
                  <FormLabel className="text-sm font-medium text-gray-700">TC Kimlik No / SSN</FormLabel>
                  <FormControl>
                    <Input placeholder="TC Kimlik No veya SSN" className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressSectionNew;