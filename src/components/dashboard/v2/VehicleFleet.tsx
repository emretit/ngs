import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Car,
  Wrench,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";

interface VehicleFleetProps {
  data?: {
    totalVehicles: number;
    activeVehicles: number;
    inMaintenance: number;
    maintenanceDue: number;
    monthlyFuelCost: number;
    averageFuelEfficiency: number; // km/L
    vehicles: Array<{
      id: string;
      plateNumber: string;
      brand: string;
      model: string;
      status: 'aktif' | 'pasif' | 'bakım' | 'satıldı' | 'hasar';
      nextMaintenanceDate?: string;
      nextMaintenanceMileage?: number;
      currentMileage?: number;
      fuelType: string;
      monthlyFuelCost: number;
    }>;
    upcomingMaintenances: Array<{
      id: string;
      vehiclePlate: string;
      vehicleName: string;
      maintenanceType: string;
      dueDate: string;
      dueMileage?: number;
      currentMileage?: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'aktif':
      return { label: 'Aktif', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 };
    case 'bakım':
      return { label: 'Bakımda', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: Wrench };
    case 'hasar':
      return { label: 'Hasar', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle };
    default:
      return { label: 'Pasif', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', icon: Clock };
  }
};

export const VehicleFleet = memo(({ data, isLoading }: VehicleFleetProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    totalVehicles: 12,
    activeVehicles: 10,
    inMaintenance: 2,
    maintenanceDue: 3,
    monthlyFuelCost: 45000,
    averageFuelEfficiency: 12.5,
    vehicles: [
      {
        id: '1',
        plateNumber: '34ABC123',
        brand: 'Ford',
        model: 'Transit',
        status: 'aktif' as const,
        nextMaintenanceDate: '2024-01-25',
        nextMaintenanceMileage: 50000,
        currentMileage: 48500,
        fuelType: 'dizel',
        monthlyFuelCost: 8500
      },
      {
        id: '2',
        plateNumber: '34XYZ456',
        brand: 'Mercedes',
        model: 'Sprinter',
        status: 'bakım' as const,
        nextMaintenanceDate: '2024-01-15',
        fuelType: 'dizel',
        monthlyFuelCost: 12000
      },
      {
        id: '3',
        plateNumber: '06DEF789',
        brand: 'Renault',
        model: 'Master',
        status: 'aktif' as const,
        nextMaintenanceDate: '2024-02-10',
        fuelType: 'dizel',
        monthlyFuelCost: 7500
      }
    ],
    upcomingMaintenances: [
      {
        id: '1',
        vehiclePlate: '34ABC123',
        vehicleName: 'Ford Transit',
        maintenanceType: 'Periyodik Bakım',
        dueDate: '2024-01-25',
        dueMileage: 50000,
        currentMileage: 48500,
        priority: 'high' as const
      },
      {
        id: '2',
        vehiclePlate: '34XYZ456',
        vehicleName: 'Mercedes Sprinter',
        maintenanceType: 'Yağ Değişimi',
        dueDate: '2024-01-15',
        priority: 'high' as const
      },
      {
        id: '3',
        vehiclePlate: '06DEF789',
        vehicleName: 'Renault Master',
        maintenanceType: 'Filtre Değişimi',
        dueDate: '2024-02-10',
        priority: 'medium' as const
      }
    ]
  };

  const { totalVehicles, activeVehicles, inMaintenance, maintenanceDue, monthlyFuelCost, averageFuelEfficiency, vehicles, upcomingMaintenances } = mockData;
  const urgentMaintenances = upcomingMaintenances.filter(m => {
    if (!m.dueDate) return false;
    const daysUntil = differenceInDays(new Date(m.dueDate), new Date());
    return daysUntil <= 7 && daysUntil >= 0;
  }).length;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
              <Car className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Araç Filosu</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Aktif araçlar, bakım takibi, yakıt giderleri
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="h-3 w-3 text-teal-600" />
              <p className="text-[9px] uppercase tracking-wide text-teal-600 dark:text-teal-400 font-semibold">
                Toplam
              </p>
            </div>
            <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{totalVehicles}</p>
            <p className="text-[9px] text-teal-600/70 dark:text-teal-400/70">
              {activeVehicles} aktif
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Wrench className="h-3 w-3 text-amber-600" />
              <p className="text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                Bakım
              </p>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{inMaintenance}</p>
            <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">
              {maintenanceDue} yaklaşıyor
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Fuel className="h-3 w-3 text-orange-600" />
              <p className="text-[9px] uppercase tracking-wide text-orange-600 dark:text-orange-400 font-semibold">
                Yakıt
              </p>
            </div>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(monthlyFuelCost)}
            </p>
            <p className="text-[9px] text-orange-600/70 dark:text-orange-400/70">
              Bu ay
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Verimlilik
              </p>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {averageFuelEfficiency.toFixed(1)}
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              km/L ortalama
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Upcoming Maintenances */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Yaklaşan Bakımlar</h4>
            {urgentMaintenances > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {urgentMaintenances} Acil
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vehicles/maintenance')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {upcomingMaintenances.length > 0 ? (
              upcomingMaintenances.slice(0, 3).map((maintenance) => {
                const daysUntil = maintenance.dueDate 
                  ? differenceInDays(new Date(maintenance.dueDate), new Date())
                  : null;
                const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;
                const priorityConfig = {
                  high: { color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: AlertTriangle },
                  medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Clock },
                  low: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', icon: Clock }
                };
                const priority = priorityConfig[maintenance.priority];
                const PriorityIcon = priority.icon;

                return (
                  <div
                    key={maintenance.id}
                    onClick={() => navigate(`/vehicles/maintenance?id=${maintenance.id}`)}
                    className={cn(
                      "group p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                      isUrgent 
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Car className="h-4 w-4 text-teal-600 shrink-0" />
                          <h5 className="text-sm font-semibold text-foreground truncate">
                            {maintenance.vehicleName}
                          </h5>
                          <Badge className={cn("h-4 px-1.5 text-[9px]", priority.color)}>
                            <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                            {maintenance.priority === 'high' ? 'Yüksek' : maintenance.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Badge>
                          {isUrgent && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                              Acil!
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {maintenance.maintenanceType}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {daysUntil !== null 
                                ? daysUntil === 0 
                                  ? 'Bugün' 
                                  : daysUntil === 1 
                                    ? 'Yarın'
                                    : `${daysUntil} gün sonra`
                                : 'Tarih belirtilmemiş'}
                            </span>
                          </div>
                          {maintenance.dueMileage && maintenance.currentMileage && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {maintenance.currentMileage.toLocaleString('tr-TR')} / {maintenance.dueMileage.toLocaleString('tr-TR')} km
                              </span>
                            </div>
                          )}
                        </div>
                        {maintenance.dueMileage && maintenance.currentMileage && (
                          <div className="mt-2">
                            <Progress 
                              value={(maintenance.currentMileage / maintenance.dueMileage) * 100} 
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center border border-border/50 rounded-lg bg-muted/30">
                <Wrench className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Yaklaşan bakım yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Vehicles Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Aktif Araçlar</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vehicles')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {vehicles.slice(0, 4).map((vehicle) => {
              const status = getStatusConfig(vehicle.status);
              const StatusIcon = status.icon;
              const daysUntilMaintenance = vehicle.nextMaintenanceDate
                ? differenceInDays(new Date(vehicle.nextMaintenanceDate), new Date())
                : null;

              return (
                <div
                  key={vehicle.id}
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  className={cn(
                    "group p-2.5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                    status.bg,
                    status.border
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <p className="text-xs font-semibold text-foreground truncate">
                      {vehicle.plateNumber}
                    </p>
                    <Badge className={cn("h-3.5 px-1 text-[8px]", status.bg, status.color)}>
                      <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mb-1">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>{formatCurrency(vehicle.monthlyFuelCost)}/ay</span>
                    {daysUntilMaintenance !== null && daysUntilMaintenance <= 30 && (
                      <span className={cn(
                        "font-semibold",
                        daysUntilMaintenance <= 7 ? "text-red-600" : "text-amber-600"
                      )}>
                        {daysUntilMaintenance}gün
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {urgentMaintenances > 0 && (
              <span className="text-red-600 font-semibold">{urgentMaintenances} acil bakım var!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vehicles/costs')}
            className="gap-1.5 h-7 text-xs"
          >
            Maliyet Analizi
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

VehicleFleet.displayName = "VehicleFleet";

