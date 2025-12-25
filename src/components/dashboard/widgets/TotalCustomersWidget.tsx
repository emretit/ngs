import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TotalCustomersWidgetProps {
  totalCustomers: number | undefined;
  activeCustomers: number | undefined;
  isLoading: boolean;
}

const TotalCustomersWidget = ({ totalCustomers, activeCustomers, isLoading }: TotalCustomersWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Toplam Müşteriler</CardTitle>
        <Users className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">
            {(totalCustomers || 0).toLocaleString("tr-TR")}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {activeCustomers !== undefined ? `${activeCustomers} aktif` : 'Yükleniyor...'}
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalCustomersWidget;

