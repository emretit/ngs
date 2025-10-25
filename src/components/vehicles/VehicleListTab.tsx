import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Vehicle } from "@/types/vehicle";
import { useVehicles, useVehicleStats } from "@/hooks/useVehicles";
import VehiclesHeader from "./VehiclesHeader";
import VehiclesFilterBar from "./VehiclesFilterBar";
import VehiclesContent from "./VehiclesContent";

export default function VehicleListTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFuelType, setSelectedFuelType] = useState("all");
  const [activeView, setActiveView] = useState<"list" | "grid">("grid");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();

  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: stats } = useVehicleStats();

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleCloseDetail = () => {
    setSelectedVehicle(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Araçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <VehiclesHeader 
          activeView={activeView} 
          setActiveView={setActiveView}
          stats={stats}
        />

        {/* Filters */}
        <VehiclesFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedFuelType={selectedFuelType}
          setSelectedFuelType={setSelectedFuelType}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {/* Content */}
        <VehiclesContent
          vehicles={vehicles}
          isLoading={isLoading}
          onVehicleSelect={handleVehicleClick}
          activeView={activeView}
          searchQuery={searchQuery}
          statusFilter={selectedStatus}
          fuelTypeFilter={selectedFuelType}
        />
      </div>

      {/* Detail Sheet - Bu kısım gelecekte eklenebilir */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Araç Detayları</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedVehicle.plate_number} - {selectedVehicle.brand} {selectedVehicle.model}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  navigate(`/vehicles/${selectedVehicle.id}`);
                  handleCloseDetail();
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
              >
                Detayları Görüntüle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
