import React from "react";
import { Card } from "@/components/ui/card";
import { Warehouse, MapPin, Phone, Mail, User, Info, Building } from "lucide-react";
import { Warehouse as WarehouseType } from "@/types/warehouse";

interface WarehouseInfoProps {
  warehouse: WarehouseType;
  onUpdate?: (updatedWarehouse: WarehouseType) => void;
}

export const WarehouseInfo = ({ warehouse }: WarehouseInfoProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Genel Bilgiler Card */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-background to-muted/20 border shadow-sm">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
          <div className="p-1 bg-primary/10 rounded">
            <Warehouse className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Genel Bilgiler</h2>
        </div>
        
        <div className="px-3 pb-3 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Temel Bilgiler */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Warehouse className="w-2.5 h-2.5 text-primary" />
                <span>Depo Adı</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {warehouse.name}
              </div>
            </div>
            
            {warehouse.code && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Building className="w-2.5 h-2.5 text-purple-500" />
                  <span>Kod</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.code}
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Info className="w-2.5 h-2.5 text-indigo-500" />
                <span>Depo Tipi</span>
              </div>
              <div className="text-xs font-medium text-gray-900 truncate">
                {warehouse.warehouse_type === 'main' ? 'Ana Depo' :
                 warehouse.warehouse_type === 'sub' ? 'Alt Depo' :
                 warehouse.warehouse_type === 'virtual' ? 'Sanal Depo' :
                 warehouse.warehouse_type === 'transit' ? 'Transfer Depo' :
                 warehouse.warehouse_type || <span className="text-gray-400 italic">Belirtilmemiş</span>}
              </div>
            </div>

            {warehouse.capacity && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Warehouse className="w-2.5 h-2.5 text-green-500" />
                  <span>Kapasite</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.capacity} {warehouse.capacity_unit || 'birim'}
                </div>
              </div>
            )}

            {/* Adres Bilgileri */}
            {warehouse.address && (
              <div className="space-y-0.5 col-span-2 md:col-span-3 lg:col-span-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="w-2.5 h-2.5 text-red-500" />
                  <span>Adres</span>
                </div>
                <div className="text-xs font-medium text-gray-900">
                  {warehouse.address}
                </div>
              </div>
            )}

            {warehouse.city && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Building className="w-2.5 h-2.5 text-blue-500" />
                  <span>Şehir</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.city}
                  {warehouse.district && `, ${warehouse.district}`}
                </div>
              </div>
            )}

            {warehouse.postal_code && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="w-2.5 h-2.5 text-purple-500" />
                  <span>Posta Kodu</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.postal_code}
                </div>
              </div>
            )}

            {warehouse.country && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="w-2.5 h-2.5 text-green-500" />
                  <span>Ülke</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.country}
                </div>
              </div>
            )}

            {/* İletişim Bilgileri */}
            {warehouse.phone && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone className="w-2.5 h-2.5 text-green-500" />
                  <span>Telefon</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.phone}
                </div>
              </div>
            )}

            {warehouse.email && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Mail className="w-2.5 h-2.5 text-blue-500" />
                  <span>E-posta</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.email}
                </div>
              </div>
            )}

            {/* Depo Sorumlusu */}
            {warehouse.manager_name && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <User className="w-2.5 h-2.5 text-purple-500" />
                  <span>Sorumlu</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.manager_name}
                </div>
              </div>
            )}

            {warehouse.manager_phone && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone className="w-2.5 h-2.5 text-orange-500" />
                  <span>Sorumlu Tel</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.manager_phone}
                </div>
              </div>
            )}

            {warehouse.manager_email && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Mail className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Sorumlu E-posta</span>
                </div>
                <div className="text-xs font-medium text-gray-900 truncate">
                  {warehouse.manager_email}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Durum ve Ek Bilgiler Card */}
      <Card className="bg-gradient-to-br from-background to-muted/20 border shadow-sm">
        <div className="p-3">
          <h2 className="text-sm font-semibold text-foreground mb-3">Durum</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${warehouse.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs font-medium">
                {warehouse.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            {warehouse.notes && (
              <div className="pt-2 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Notlar</h3>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">
                  {warehouse.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

