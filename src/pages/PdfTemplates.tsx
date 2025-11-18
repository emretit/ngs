import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PdfTemplate } from '@/types/pdf-template';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { ConfirmationDialogComponent } from '@/components/ui/confirmation-dialog';
import { QuickPreviewModal } from '@/components/pdf-templates/QuickPreviewModal';
import { PdfTemplatesFilterBar } from '@/components/pdf-templates/PdfTemplatesFilterBar';
import PdfTemplatesHeader from '@/components/pdf-templates/PdfTemplatesHeader';
import PdfTemplatesContent from '@/components/pdf-templates/PdfTemplatesContent';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'updated' | 'created';

interface PdfTemplatesProps {
  showHeader?: boolean;
}

const PdfTemplates: React.FC<PdfTemplatesProps> = ({ showHeader = true }) => {
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const navigate = useNavigate();

  // View options
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PdfTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<PdfTemplate | null>(null);
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter and sort templates with useMemo for performance
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(template => template.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'tr');
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, typeFilter, sortBy]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templates = await PdfExportService.getTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateTemplate = () => {
    navigate('/pdf-templates/new');
  };
  const handleEditTemplate = (templateId: string) => {
    navigate(`/pdf-templates/edit/${templateId}`);
  };
  const handleDuplicateTemplate = async (template: PdfTemplate) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} - Kopya`,
        is_default: false,
        version: 1,
      };
      delete (newTemplate as any).id;
      delete (newTemplate as any).created_at;
      delete (newTemplate as any).updated_at;
      await PdfExportService.saveTemplate(newTemplate);
      toast.success('Şablon başarıyla kopyalandı');
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Şablon kopyalanırken hata oluştu');
    }
  };
  const handleSetAsDefault = async (templateId: string) => {
    try {
      await PdfExportService.setAsDefault(templateId, 'quote');
      toast.success('Varsayılan şablon güncellendi');
      loadTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Varsayılan şablon ayarlanırken hata oluştu');
    }
  };
  const handleDeleteTemplateClick = (template: PdfTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      await PdfExportService.deleteTemplate(templateToDelete.id);
      toast.success('Şablon başarıyla silindi');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Şablon silinirken hata oluştu');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDeleteTemplateCancel = () => {
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleCreateDefaultTemplates = async () => {
    setIsCreatingDefaults(true);
    try {
      await PdfExportService.ensureDefaultTemplates();
      toast.success('Varsayılan şablonlar başarıyla oluşturuldu');
      loadTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
      toast.error('Varsayılan şablonlar oluşturulurken hata oluştu');
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  const handlePreviewTemplate = (template: PdfTemplate) => {
    setTemplateToPreview(template);
    setIsPreviewModalOpen(true);
  };

  // Helper function to get template type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'quote':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'invoice':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'proposal':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Helper function to get template type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quote':
        return 'Teklif';
      case 'invoice':
        return 'Fatura';
      case 'proposal':
        return 'Öneri';
      default:
        return type;
    }
  };

  // Calculate statistics - MUST be before any early returns
  const statistics = useMemo(() => {
    return {
      totalCount: templates.length,
      quoteCount: templates.filter(t => t.type === 'quote').length,
      invoiceCount: templates.filter(t => t.type === 'invoice').length,
      proposalCount: templates.filter(t => t.type === 'proposal').length,
      defaultCount: templates.filter(t => t.is_default).length,
    };
  }, [templates]);

  return (
    <div className="space-y-2">
      {/* Header */}
      {showHeader && (
        <PdfTemplatesHeader
          templates={templates}
          activeView={viewMode}
          setActiveView={setViewMode}
          totalCount={templates.length}
          statistics={statistics}
          onCreateTemplate={handleCreateTemplate}
          onCreateDefaults={handleCreateDefaultTemplates}
          isCreatingDefaults={isCreatingDefaults}
        />
      )}

      {/* Filters */}
      <PdfTemplatesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Content */}
      <PdfTemplatesContent
        templates={templates}
        filteredTemplates={filteredTemplates}
        viewMode={viewMode}
        isLoading={isLoading}
        onPreview={handlePreviewTemplate}
        onEdit={handleEditTemplate}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplateClick}
        onSetAsDefault={handleSetAsDefault}
        onCreateTemplate={handleCreateTemplate}
        onCreateDefaults={handleCreateDefaultTemplates}
        isCreatingDefaults={isCreatingDefaults}
        getTypeBadgeColor={getTypeBadgeColor}
        getTypeLabel={getTypeLabel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setTypeFilter={setTypeFilter}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Şablonu Sil"
        description={`"${templateToDelete?.name || 'Bu şablon'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteTemplateConfirm}
        onCancel={handleDeleteTemplateCancel}
        isLoading={isDeleting}
      />

      {/* Quick Preview Modal */}
      <QuickPreviewModal
        template={templateToPreview}
        open={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        onEdit={handleEditTemplate}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplateClick}
      />
    </div>
  );
};
export default PdfTemplates;
