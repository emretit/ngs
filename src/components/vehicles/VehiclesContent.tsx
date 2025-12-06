import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Gauge, Calendar, AlertCircle, Fuel, Wrench, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Vehicle } from "@/types/vehicle";
import VehiclesContentSkeleton from "./VehiclesContentSkeleton";

interface VehiclesContentProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onVehicleSelect: (vehicle: Vehicle) => void;
  activeView: "list" | "grid";
  searchQuery?: string;
  statusFilter?: string;
  fuelTypeFilter?: string;
}

const VehiclesContent = ({
  vehicles,
  isLoading,
  onVehicleSelect,
  activeView,
  searchQuery = "",
  statusFilter = "all",
  fuelTypeFilter = "all"
}: VehiclesContentProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'aktif': 'bg-green-100 text-green-800',
      'bakım': 'bg-yellow-100 text-yellow-800',
      'pasif': 'bg-red-100 text-red-800',
      'satıldı': 'bg-gray-100 text-gray-800',
      'hasar': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const isInsuranceExpiring = (insuranceEnd: string) => {
    if (!insuranceEnd) return false;
    const today = new Date();
    const insuranceDate = new Date(insuranceEnd);
    const diffTime = insuranceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  // Filter vehicles based on criteria
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchQuery ||
      vehicle.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesFuelType = fuelTypeFilter === "all" || vehicle.fuel_type === fuelTypeFilter;

    return matchesSearch && matchesStatus && matchesFuelType;
  });

  if (isLoading && vehicles.length === 0) {
    return <VehiclesContentSkeleton view={activeView} />;
  }

  if (filteredVehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-12 text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Araç bulunamadı</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" || fuelTypeFilter !== "all"
              ? "Arama kriterlerinize uygun araç bulunamadı."
              : "Henüz hiç araç eklenmemiş."}
          </p>
        </div>
      </div>
    );
  }

  if (activeView === "list") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onVehicleSelect(vehicle)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{vehicle.plate_number}</h3>
                      <Badge className={getStatusBadge(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    <span>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    <span className="capitalize">{vehicle.fuel_type || 'N/A'}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Detayları Görüntüle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card 
              key={vehicle.id} 
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer"
              onClick={() => onVehicleSelect(vehicle)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{vehicle.plate_number}</CardTitle>
                  </div>
                  <Badge className={getStatusBadge(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Kilometre</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Model Yılı</div>
                    </div>
                  </div>
                </div>

                {/* Fuel & Transmission */}
                {vehicle.fuel_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="font-medium capitalize">{vehicle.fuel_type}</span>
                      <span className="text-muted-foreground"> • </span>
                      <span className="capitalize">{vehicle.transmission}</span>
                    </div>
                  </div>
                )}

                {/* Location */}
                {vehicle.location_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">📍</div>
                    <span className="text-muted-foreground truncate">{vehicle.location_address}</span>
                  </div>
                )}

                {/* Alerts */}
                {isInsuranceExpiring(vehicle.insurance_end_date || '') && (
                  <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-100 p-2 rounded-md border border-orange-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Sigorta yakında sona eriyor</span>
                  </div>
                )}

                {vehicle.status === 'bakım' && (
                  <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md border border-yellow-200">
                    <Wrench className="h-4 w-4" />
                    <span className="font-medium">Araç bakımda</span>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/vehicles/${vehicle.id}`);
                  }}
                >
                  Detayları Görüntüle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehiclesContent;
