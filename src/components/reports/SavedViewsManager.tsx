/**
 * SavedViewsManager Component
 * Tüm rapor kategorileri için kayıtlı görünümleri yönetir
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, BookmarkCheck, Trash2, Edit } from "lucide-react";
import { useSavedViews } from "@/hooks/useSavedViews";
import type { ReportCategory } from "@/types/salesReports";
import SaveViewModal from "@/components/reports/sales/modals/SaveViewModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SavedViewsManagerProps {
  reportCategory: ReportCategory;
  currentFilters?: Record<string, any>;
  onLoadView?: (filters: Record<string, any>) => void;
  onSaveView?: () => { filters: Record<string, any>; layoutConfig?: any };
}

export default function SavedViewsManager({
  reportCategory,
  currentFilters,
  onLoadView,
  onSaveView,
}: SavedViewsManagerProps) {
  const { views, isLoading, loadView, deleteView, saveView, isDeleting } = useSavedViews(reportCategory);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);

  const handleLoadView = async (viewId: string) => {
    const view = await loadView(viewId);
    if (view && onLoadView) {
      onLoadView(view.filters as Record<string, any>);
      setSelectedViewId(viewId);
    }
  };

  const handleSaveView = async (viewName: string, isDefault: boolean) => {
    if (!onSaveView) return;
    
    const viewData = onSaveView();
    saveView({
      viewName,
      isDefault,
      layoutConfig: viewData.layoutConfig || { reportBlocks: [] },
      filters: viewData.filters as any,
      reportOrder: [],
    });
  };

  const handleDeleteView = async (viewId: string) => {
    if (confirm("Bu görünümü silmek istediğinizden emin misiniz?")) {
      deleteView(viewId);
      if (selectedViewId === viewId) {
        setSelectedViewId(null);
      }
    }
  };

  const defaultView = views.find(v => v.isDefault);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedViewId || defaultView?.id || ""}
        onValueChange={(value) => {
          if (value === "new") {
            setSaveModalOpen(true);
          } else if (value) {
            handleLoadView(value);
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Görünüm seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">
            <div className="flex items-center gap-2">
              <Bookmark className="h-3.5 w-3.5" />
              Yeni Görünüm Kaydet
            </div>
          </SelectItem>
          {views.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Kayıtlı Görünümler
              </div>
              {views.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2 w-full">
                    {view.isDefault && <BookmarkCheck className="h-3.5 w-3.5 text-primary" />}
                    <span className="flex-1">{view.viewName}</span>
                    {view.isDefault && (
                      <span className="text-xs text-muted-foreground">(Varsayılan)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {selectedViewId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleDeleteView(selectedViewId)}
              disabled={isDeleting}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <SaveViewModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveView}
      />
    </div>
  );
}
