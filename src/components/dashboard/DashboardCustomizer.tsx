import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Save, X, RotateCcw, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DashboardCustomizerProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onAddWidget?: () => void;
  hasChanges?: boolean;
}

export function DashboardCustomizer({
  isEditMode,
  onToggleEditMode,
  onSaveLayout,
  onResetLayout,
  onAddWidget,
  hasChanges = false,
}: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSaveLayout();
    onToggleEditMode();
    setIsOpen(false);
  };

  const handleCancel = () => {
    onToggleEditMode();
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Edit Mode Toolbar */}
      {isEditMode && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="bg-blue-500">
              Düzenleme Modu
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            {onAddWidget && (
              <Button
                onClick={onAddWidget}
                size="sm"
                variant="outline"
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Widget Ekle
              </Button>
            )}

            <Button
              onClick={handleSave}
              size="sm"
              className="w-full justify-start bg-green-500 hover:bg-green-600"
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>

            <Button
              onClick={onResetLayout}
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>

            <Separator />

            <Button
              onClick={handleCancel}
              size="sm"
              variant="ghost"
              className="w-full justify-start"
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
          </div>
        </div>
      )}

      {/* Settings Button & Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Dashboard Ayarları
          </Button>
        </SheetTrigger>

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Dashboard Özelleştirme</SheetTitle>
            <SheetDescription>
              Dashboard'unuzu ihtiyaçlarınıza göre düzenleyin
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Düzenleme Modu</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Widget'ları sürükleyip bırakarak yeniden düzenleyin, boyutlandırın veya kaldırın.
              </p>
              <Button
                onClick={() => {
                  onToggleEditMode();
                  setIsOpen(false);
                }}
                className="w-full"
                variant={isEditMode ? 'destructive' : 'default'}
              >
                {isEditMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Düzenlemeyi Bitir
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Düzenlemeye Başla
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Hızlı İşlemler</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    onResetLayout();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Varsayılan Düzene Sıfırla
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">İpuçları</h4>
              <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  Widget başlıklarını sürükleyerek taşıyın
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  Widget köşelerinden boyutlandırın
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  X butonuna tıklayarak widget'ları kaldırın
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  Değişikliklerinizi kaydetmeyi unutmayın
                </li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
