import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Plus, Sparkles } from "lucide-react";
import { PdfTemplate } from "@/types/pdf-template";
import { PdfTemplatesList } from "./PdfTemplatesList";

interface PdfTemplatesContentProps {
  templates: PdfTemplate[];
  filteredTemplates: PdfTemplate[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  onPreview: (template: PdfTemplate) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (template: PdfTemplate) => void;
  onDelete: (template: PdfTemplate) => void;
  onCreateTemplate: () => void;
  onCreateDefaults: () => void;
  isCreatingDefaults: boolean;
  getTypeBadgeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setTypeFilter: (value: string) => void;
}

const PdfTemplatesContent = ({
  templates,
  filteredTemplates,
  viewMode,
  isLoading,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateTemplate,
  onCreateDefaults,
  isCreatingDefaults,
  getTypeBadgeColor,
  getTypeLabel,
  searchQuery,
  setSearchQuery,
  setTypeFilter,
}: PdfTemplatesContentProps) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Şablonlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {templates.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed border-2 m-6">
            <CardContent className="p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  Henüz PDF Şablonu Yok
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  İlk PDF şablonunuzu oluşturarak belgelerinizi özelleştirmeye başlayın.
                  Hazır şablonlarla hızlıca başlayabilir veya sıfırdan kendiniz tasarlayabilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={onCreateDefaults}
                    variant="outline"
                    size="lg"
                    disabled={isCreatingDefaults}
                    className="gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    {isCreatingDefaults ? 'Oluşturuluyor...' : 'Hazır Şablonları Yükle'}
                  </Button>
                  <Button onClick={onCreateTemplate} size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Yeni Şablon Oluştur
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          /* No Results State */
          <Card className="m-6">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sonuç Bulunamadı
              </h3>
              <p className="text-muted-foreground mb-4">
                Arama kriterlerinize uygun şablon bulunamadı. Lütfen farklı bir filtre deneyin.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
              >
                Filtreleri Temizle
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Templates List */
          <div className="p-6">
            <PdfTemplatesList
              templates={filteredTemplates}
              viewMode={viewMode}
              onPreview={onPreview}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              getTypeBadgeColor={getTypeBadgeColor}
              getTypeLabel={getTypeLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfTemplatesContent;

