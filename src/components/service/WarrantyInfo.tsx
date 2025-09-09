
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format, differenceInDays } from "date-fns";
import { AlertTriangle, Check, Shield, Calendar } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  warranty_start?: string;
  warranty_end?: string;
  specifications?: Record<string, any>;
  maintenance_schedule?: Record<string, any>;
}

interface WarrantyInfoProps {
  equipmentId?: string;
}

export function WarrantyInfo({ equipmentId }: WarrantyInfoProps) {
  const { data: equipment } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null;

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (error) throw error;
      return data as Equipment;
    },
    enabled: !!equipmentId
  });

  if (!equipment || !equipment.warranty_end) {
    return null;
  }

  const warrantyEndDate = new Date(equipment.warranty_end);
  const daysUntilExpiration = differenceInDays(warrantyEndDate, new Date());
  const isExpired = daysUntilExpiration < 0;
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Garanti Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium mr-2">Başlangıç:</span>
            {equipment.warranty_start && format(new Date(equipment.warranty_start), 'dd.MM.yyyy')}
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="font-medium mr-2">Bitiş:</span>
            {format(warrantyEndDate, 'dd.MM.yyyy')}
          </div>
        </div>

        {isExpired ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Garanti Süresi Dolmuş</AlertTitle>
            <AlertDescription>
              Bu cihazın garanti süresi {format(warrantyEndDate, 'dd.MM.yyyy')} tarihinde dolmuştur.
            </AlertDescription>
          </Alert>
        ) : isExpiringSoon ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Garanti Süresi Yakında Dolacak</AlertTitle>
            <AlertDescription>
              Bu cihazın garanti süresi {daysUntilExpiration} gün sonra dolacak.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Garanti Aktif</AlertTitle>
            <AlertDescription>
              Garanti süresi devam ediyor. Kalan süre: {daysUntilExpiration} gün
            </AlertDescription>
          </Alert>
        )}

        {equipment.specifications && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Garanti Kapsamı:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(equipment.specifications).map(([key, value]) => (
                <li key={key}>{`${key}: ${value}`}</li>
              ))}
            </ul>
          </div>
        )}

        {equipment.maintenance_schedule && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Bakım Planı:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(equipment.maintenance_schedule).map(([key, value]) => (
                <li key={key}>{`${key}: ${value}`}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
