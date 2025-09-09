
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  technicianFilter: string;
  setTechnicianFilter: (value: string) => void;
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  technicianFilter,
  setTechnicianFilter
}) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Servis talebi ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Durum seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="new">Yeni</SelectItem>
            <SelectItem value="assigned">Atandı</SelectItem>
            <SelectItem value="in_progress">Devam Ediyor</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="cancelled">İptal Edildi</SelectItem>
            <SelectItem value="on_hold">Beklemede</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={technicianFilter}
          onValueChange={(value) => setTechnicianFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Teknisyen seç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
