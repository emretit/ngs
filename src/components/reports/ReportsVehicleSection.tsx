import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Car, Fuel, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsVehicleSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsVehicleSection({ isExpanded, onToggle, searchParams }: ReportsVehicleSectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: costPerKm } = useQuery({
    queryKey: ['vehicleCostPerKm', startDate, endDate],
    queryFn: async () => {
      // Calculate cost per km from fuel and maintenance records
      let fuelQuery = supabase
        .from('vehicle_fuel')
        .select('total_cost, vehicle_id');
        
      let maintenanceQuery = supabase
        .from('vehicle_maintenance')
        .select('cost, vehicle_id');
        
      if (startDate) {
        fuelQuery = fuelQuery.gte('fuel_date', startDate);
        maintenanceQuery = maintenanceQuery.gte('maintenance_date', startDate);
      }
      if (endDate) {
        fuelQuery = fuelQuery.lte('fuel_date', endDate);
        maintenanceQuery = maintenanceQuery.lte('maintenance_date', endDate);
      }
      
      const [fuelData, maintenanceData] = await Promise.all([
        fuelQuery,
        maintenanceQuery
      ]);
      
      const totalFuelCost = (fuelData.data || []).reduce((sum, record) => sum + (record.total_cost || 0), 0);
      const totalMaintenanceCost = (maintenanceData.data || []).reduce((sum, record) => sum + (record.cost || 0), 0);
      const totalCost = totalFuelCost + totalMaintenanceCost;
      
      // Note: This would need actual km data from vehicles
      // For now, using estimated km based on fuel consumption
      const estimatedKm = totalFuelCost / 15; // Rough estimate: ₺15 per liter, avg consumption
      
      return { 
        costPerKm: estimatedKm > 0 ? totalCost / estimatedKm : 0,
        totalCost,
        fuelCost: totalFuelCost,
        maintenanceCost: totalMaintenanceCost
      };
    },
    enabled: isExpanded
  });

  const { data: fuelTrend } = useQuery({
    queryKey: ['fuelTrend', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_fuel')
        .select('fuel_date, total_cost, liters');
        
      if (startDate) query = query.gte('fuel_date', startDate);
      if (endDate) query = query.lte('fuel_date', endDate);
      
      const { data } = await query;
      
      if (!data) return [];
      
      // Group by month
      const monthlyData = data.reduce((acc: Record<string, { cost: number, liters: number }>, record) => {
        const month = new Date(record.fuel_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
        if (!acc[month]) acc[month] = { cost: 0, liters: 0 };
        acc[month].cost += record.total_cost || 0;
        acc[month].liters += record.liters || 0;
        return acc;
      }, {});
      
      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        cost: (data as any).cost,
        liters: (data as any).liters,
        pricePerLiter: (data as any).liters > 0 ? (data as any).cost / (data as any).liters : 0
      }));
    },
    enabled: isExpanded
  });

  const { data: expiringDocs } = useQuery({
    queryKey: ['expiringDocs'],
    queryFn: async () => {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      const { data } = await supabase
        .from('vehicles')
        .select('plate_number, brand, model, insurance_expiry, inspection_expiry')
        .or(`insurance_expiry.lte.${threeMonthsFromNow.toISOString().split('T')[0]},inspection_expiry.lte.${threeMonthsFromNow.toISOString().split('T')[0]}`);
      
      return (data || []).map(vehicle => {
        const expiringItems = [];
        const today = new Date();
        
        if (vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) <= threeMonthsFromNow) {
          const daysUntilExpiry = Math.ceil((new Date(vehicle.insurance_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          expiringItems.push({ type: 'Sigorta', date: vehicle.insurance_expiry, daysUntilExpiry });
        }
        
        if (vehicle.inspection_expiry && new Date(vehicle.inspection_expiry) <= threeMonthsFromNow) {
          const daysUntilExpiry = Math.ceil((new Date(vehicle.inspection_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          expiringItems.push({ type: 'Muayene', date: vehicle.inspection_expiry, daysUntilExpiry });
        }
        
        return {
          vehicle: `${vehicle.plate_number} - ${vehicle.brand} ${vehicle.model}`,
          expiringItems
        };
      }).filter(item => item.expiringItems.length > 0);
    },
    enabled: isExpanded
  });

  const { data: upcomingMaintenance } = useQuery({
    queryKey: ['upcomingMaintenance'],
    queryFn: async () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Note: This would need a proper maintenance schedule system
      // For now, showing recent maintenance that might need follow-up
      const { data } = await supabase
        .from('vehicle_maintenance')
        .select(`
          *,
          vehicles (plate_number, brand, model)
        `)
        .eq('maintenance_type', 'Periyodik Bakım')
        .order('maintenance_date', { ascending: false })
        .limit(5);
      
      return data || [];
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Araç Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Cost per KM */}
            <div>
              <h4 className="font-semibold mb-3">₺/KM Maliyeti</h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ₺{(costPerKm?.costPerKm || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Kilometer başına</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Yakıt:</span>
                    <span>₺{(costPerKm?.fuelCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bakım:</span>
                    <span>₺{(costPerKm?.maintenanceCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fuel Trend */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Yakıt Trend
              </h4>
              <div className="space-y-2">
                {fuelTrend?.slice(-4).map((trend, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{trend.month}</span>
                      <span className="text-sm font-medium">₺{trend.pricePerLiter.toFixed(2)}/L</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trend.liters.toFixed(1)}L - ₺{trend.cost.toLocaleString()}
                    </div>
                  </div>
                ))}
                {!fuelTrend?.length && (
                  <p className="text-sm text-muted-foreground">Yakıt verisi bulunamadı</p>
                )}
              </div>
            </div>

            {/* Expiring Documents */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Süresi Dolan Belgeler
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {expiringDocs?.map((item, index) => (
                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-medium">{item.vehicle}</div>
                    {item.expiringItems.map((doc, docIndex) => (
                      <div key={docIndex} className="text-xs text-red-700">
                        {doc.type}: {new Date(doc.date).toLocaleDateString('tr-TR')}
                        {doc.daysUntilExpiry <= 0 ? ' (Süresi dolmuş)' : ` (${doc.daysUntilExpiry} gün)`}
                      </div>
                    ))}
                  </div>
                ))}
                {!expiringDocs?.length && (
                  <p className="text-sm text-green-600">Yakın zamanda süresi dolacak belge yok</p>
                )}
              </div>
            </div>

            {/* Upcoming Maintenance */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Yaklaşan Bakımlar
              </h4>
              <div className="space-y-2">
                {upcomingMaintenance?.map((maintenance, index) => (
                  <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm font-medium">
                      {maintenance.vehicles?.plate_number}
                    </div>
                    <div className="text-xs text-yellow-700">
                      {maintenance.maintenance_type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Son: {new Date(maintenance.maintenance_date).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                ))}
                {!upcomingMaintenance?.length && (
                  <p className="text-sm text-muted-foreground">Yaklaşan bakım bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}