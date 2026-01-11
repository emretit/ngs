
import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CustomerFormData } from "@/types/customer";
import { Users } from "lucide-react";

interface RepresentativeOption {
  id: string;
  name: string;
}

interface RepresentativeSelectProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const RepresentativeSelect = ({ formData, setFormData }: RepresentativeSelectProps) => {
  const [representatives, setRepresentatives] = useState<RepresentativeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepresentatives = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name")
          .eq("status", "aktif");

        if (error) {
          throw error;
        }

        const formattedData = data.map(rep => ({
          id: rep.id,
          name: `${rep.first_name} ${rep.last_name}`
        }));

        setRepresentatives(formattedData);
      } catch (error) {
        logger.error("Error fetching representatives:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepresentatives();
  }, []);

  const handleChange = (value: string) => {
    setFormData({
      ...formData,
      representative: value === "none" ? "" : value
    });
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Users className="w-3 h-3 text-indigo-500" />
        <span>Temsilci</span>
      </Label>
      <Select
        disabled={isLoading}
        value={formData.representative || "none"}
        onValueChange={handleChange}
      >
        <SelectTrigger>
          <SelectValue 
            placeholder="Temsilci seçiniz"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">❌ Temsilci Yok</SelectItem>
          {representatives.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              👤 {rep.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RepresentativeSelect;
