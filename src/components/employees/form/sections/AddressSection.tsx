import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Control, useWatch, useFormContext } from "react-hook-form";
import { AddressSelectorTR } from "@/components/forms/AddressSelectorTR";

interface AddressSectionProps {
  control: Control<any>;
}

export const AddressSection = ({ control }: AddressSectionProps) => {
  const { setValue } = useFormContext();

  return (
    <div className="space-y-4">
      {/* Adres Seçici */}
      <AddressSelectorTR 
        control={control}
        fieldPrefix=""
        showCard={true}
      />

      {/* Kişisel Bilgiler */}
      <Card className="shadow-md border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-lg">
        <CardHeader className="pb-2 pt-2 px-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-0.5 rounded-sm bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <MapPin className="h-3 w-3 text-green-600" />
            </div>
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0 px-3 pb-3">
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
        </CardContent>
      </Card>
    </div>
  );
};