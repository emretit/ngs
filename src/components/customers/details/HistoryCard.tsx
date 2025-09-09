
import { Card } from "@/components/ui/card";
import { Customer } from "@/types/customer";

interface HistoryCardProps {
  customer: Customer;
}

export const HistoryCard = ({ customer }: HistoryCardProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Geçmiş</h2>
      <div className="text-sm text-gray-500">
        <p>Oluşturulma: {new Date(customer.created_at).toLocaleDateString('tr-TR')}</p>
        <p>Son Güncelleme: {new Date(customer.updated_at).toLocaleDateString('tr-TR')}</p>
      </div>
    </Card>
  );
};
