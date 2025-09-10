// ButtonGroup kullanım örnekleri
import React, { useState } from "react";
import {
  StyledButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  ButtonGroup,
  ActionButtonGroup,
  QuickActionButton,
  IconButton,
} from "../index";
import { 
  Save, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Users,
  Package,
  DollarSign,
  Calendar,
  Bell
} from "lucide-react";

export function ButtonGroupExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSave = () => {
    setSaveLoading(true);
    setTimeout(() => setSaveLoading(false), 2000);
  };

  const handleAction = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ButtonGroup Bileşenleri Örneği
        </h1>
        <p className="text-gray-600">
          Ortak buton yapısı ve farklı kullanım senaryoları
        </p>
      </div>

      {/* Temel Buton Türleri */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">1. Temel Buton Türleri</h2>
        <div className="p-6 border rounded-lg bg-gray-50">
          <ButtonGroup spacing="normal">
            <PrimaryButton 
              icon={Save} 
              loading={isLoading} 
              onClick={handleAction}
            >
              Primary Button
            </PrimaryButton>
            <SecondaryButton icon={Edit}>
              Secondary Button
            </SecondaryButton>
            <DangerButton icon={Trash2}>
              Danger Button
            </DangerButton>
            <GhostButton icon={MoreHorizontal}>
              Ghost Button
            </GhostButton>
          </ButtonGroup>
        </div>
      </section>

      {/* Primary Button Varyantları */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">2. Primary Button Varyantları</h2>
        <div className="p-6 border rounded-lg bg-gray-50">
          <ButtonGroup spacing="normal">
            <PrimaryButton variant="default" icon={Save}>
              Default
            </PrimaryButton>
            <PrimaryButton variant="success" icon={Plus}>
              Success
            </PrimaryButton>
            <PrimaryButton variant="warning" icon={Bell}>
              Warning
            </PrimaryButton>
            <PrimaryButton variant="info" icon={FileText}>
              Info
            </PrimaryButton>
          </ButtonGroup>
        </div>
      </section>

      {/* Action Button Group */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">3. Form Action Buttons</h2>
        <div className="p-6 border rounded-lg bg-white">
          <div className="min-h-[200px] flex items-center justify-center text-gray-500">
            Form içeriği burada olacak...
          </div>
          
          <ActionButtonGroup
            onSave={handleSave}
            onCancel={() => console.log("Cancel clicked")}
            onDelete={() => console.log("Delete clicked")}
            saveLoading={saveLoading}
            showDelete={true}
            saveText="Kaydet ve Devam Et"
            deleteText="Kalıcı Olarak Sil"
          />
        </div>
      </section>

      {/* Vertical Button Group */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">4. Vertical Button Layout</h2>
        <div className="p-6 border rounded-lg bg-gray-50 flex justify-center">
          <ButtonGroup orientation="vertical" spacing="tight" align="center">
            <PrimaryButton icon={Download} size="sm">
              Excel İndir
            </PrimaryButton>
            <SecondaryButton icon={Upload} size="sm">
              Excel Yükle
            </SecondaryButton>
            <GhostButton icon={Filter} size="sm">
              Filtrele
            </GhostButton>
          </ButtonGroup>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">5. Dashboard Quick Actions</h2>
        <div className="p-6 border rounded-lg bg-gray-50">
          <ButtonGroup spacing="normal" align="center">
            <QuickActionButton
              label="Teklifler"
              count={24}
              icon={FileText}
              color="blue"
              onClick={() => console.log("Teklifler clicked")}
            />
            <QuickActionButton
              label="Müşteriler"
              count={156}
              icon={Users}
              color="green"
              onClick={() => console.log("Müşteriler clicked")}
            />
            <QuickActionButton
              label="Ürünler"
              count={89}
              icon={Package}
              color="orange"
              onClick={() => console.log("Ürünler clicked")}
            />
            <QuickActionButton
              label="Satışlar"
              count={12}
              icon={DollarSign}
              color="purple"
              onClick={() => console.log("Satışlar clicked")}
            />
            <QuickActionButton
              label="Takvim"
              icon={Calendar}
              color="gray"
              onClick={() => console.log("Takvim clicked")}
            />
          </ButtonGroup>
        </div>
      </section>

      {/* Icon Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">6. Icon Buttons</h2>
        <div className="p-6 border rounded-lg bg-gray-50">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Small Icons</h3>
              <ButtonGroup spacing="tight">
                <IconButton icon={Edit} size="sm" tooltip="Düzenle" />
                <IconButton icon={Trash2} size="sm" tooltip="Sil" />
                <IconButton icon={Search} size="sm" tooltip="Ara" />
                <IconButton icon={Download} size="sm" tooltip="İndir" />
              </ButtonGroup>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Medium Icons</h3>
              <ButtonGroup spacing="tight">
                <IconButton icon={Edit} size="md" tooltip="Düzenle" />
                <IconButton icon={Trash2} size="md" tooltip="Sil" />
                <IconButton icon={Search} size="md" tooltip="Ara" />
                <IconButton icon={Download} size="md" tooltip="İndir" />
              </ButtonGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Large Icons</h3>
              <ButtonGroup spacing="tight">
                <IconButton icon={Edit} size="lg" tooltip="Düzenle" />
                <IconButton icon={Trash2} size="lg" tooltip="Sil" />
                <IconButton icon={Search} size="lg" tooltip="Ara" />
                <IconButton icon={Download} size="lg" tooltip="İndir" />
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Farklı Düzenlemeler */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">7. Farklı Hizalama Örnekleri</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Start Aligned</h3>
            <ButtonGroup align="start" spacing="normal">
              <PrimaryButton size="sm">Kaydet</PrimaryButton>
              <SecondaryButton size="sm">İptal</SecondaryButton>
            </ButtonGroup>
          </div>

          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Center Aligned</h3>
            <ButtonGroup align="center" spacing="normal">
              <PrimaryButton size="sm">Kaydet</PrimaryButton>
              <SecondaryButton size="sm">İptal</SecondaryButton>
            </ButtonGroup>
          </div>

          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-sm font-medium text-gray-700 mb-3">End Aligned</h3>
            <ButtonGroup align="end" spacing="normal">
              <PrimaryButton size="sm">Kaydet</PrimaryButton>
              <SecondaryButton size="sm">İptal</SecondaryButton>
            </ButtonGroup>
          </div>
        </div>
      </section>
    </div>
  );
}
