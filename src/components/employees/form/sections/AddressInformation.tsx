
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EmployeeFormData } from "../types";

// Define country data
const COUNTRIES = ["Turkey", "United States", "Germany", "United Kingdom", "France"];

interface AddressInformationProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const AddressInformation = ({ formData, onFormChange, errors }: AddressInformationProps) => {
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  // Example city data - in a real app, this would typically come from an API based on country selection
  useEffect(() => {
    if (formData.country === "Turkey") {
      setCities(["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]);
    } else if (formData.country === "United States") {
      setCities(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]);
    } else {
      setCities([]);
    }
  }, [formData.country]);

  // Example district data based on city selection
  useEffect(() => {
    if (formData.city === "Istanbul") {
      setDistricts(["Besiktas", "Kadikoy", "Sisli", "Beyoglu", "Uskudar"]);
    } else if (formData.city === "Ankara") {
      setDistricts(["Cankaya", "Kecioren", "Yenimahalle", "Mamak", "Etimesgut"]);
    } else {
      setDistricts([]);
    }
  }, [formData.city]);

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-4">Address Information</h2>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ""}
          onChange={(e) => onFormChange('address', e.target.value)}
          className="min-h-[80px]"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country || ""}
            onValueChange={(value) => {
              onFormChange('country', value);
              // Reset city and district when country changes
              onFormChange('city', '');
              onFormChange('district', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select
            value={formData.city || ""}
            onValueChange={(value) => {
              onFormChange('city', value);
              // Reset district when city changes
              onFormChange('district', '');
            }}
            disabled={!formData.country}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.country ? "Select city" : "Select country first"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select
            value={formData.district || ""}
            onValueChange={(value) => onFormChange('district', value)}
            disabled={!formData.city}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.city ? "Select district" : "Select city first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={formData.postal_code || ""}
            onChange={(e) => onFormChange('postal_code', e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
