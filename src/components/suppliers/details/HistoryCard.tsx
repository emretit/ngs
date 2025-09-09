
import { Card } from "@/components/ui/card";
import { Supplier } from "@/types/supplier";

interface HistoryCardProps {
  supplier: Supplier;
}

export const HistoryCard = ({ supplier }: HistoryCardProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Geçmiş</h2>
      <div className="text-sm text-gray-500">
        <p>Oluşturulma: {new Date(supplier.created_at).toLocaleDateString('tr-TR')}</p>
        <p>Son Güncelleme: {new Date(supplier.updated_at).toLocaleDateString('tr-TR')}</p>
      </div>
    </Card>
  );
};
