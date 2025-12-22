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
import { ServiceTemplateService, ServiceTemplate } from '@/services/serviceTemplateService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TemplateTypeSelectionModal } from '@/components/pdf-templates/TemplateTypeSelectionModal';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'updated' | 'created';

interface PdfTemplatesProps {
  showHeader?: boolean;
}

// Birleşik template tipi
type UnifiedTemplate = (PdfTemplate & { templateType: 'pdf' }) | (ServiceTemplate & { templateType: 'service'; type: 'service' });

const PdfTemplates: React.FC<PdfTemplatesProps> = ({ showHeader = true }) => {
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateTypeModalOpen, setIsTemplateTypeModalOpen] = useState(false);
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  // View options
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<UnifiedTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<PdfTemplate | null>(null);
  useEffect(() => {
    loadTemplates();
  }, []);

  // Birleşik template listesi oluştur
  const unifiedTemplates = useMemo(() => {
    const pdfTemplatesWithType: UnifiedTemplate[] = templates.map(t => ({
      ...t,
      templateType: 'pdf' as const,
    }));
    
    const serviceTemplatesWithType: UnifiedTemplate[] = serviceTemplates.map(t => ({
      ...t,
      templateType: 'service' as const,
      type: 'service' as const,
    }));

    return [...pdfTemplatesWithType, ...serviceTemplatesWithType];
  }, [templates, serviceTemplates]);

  // Filter and sort templates with useMemo for performance
  const filteredTemplates = useMemo(() => {
    let filtered = [...unifiedTemplates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template => {
        const name = template.name?.toLowerCase() || '';
        const description = (template as any).description?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || description.includes(query);
      });
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(template => {
        if (template.templateType === 'service') {
          return typeFilter === 'service';
        }
        return template.type === typeFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '', 'tr');
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [unifiedTemplates, searchQuery, typeFilter, sortBy]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [pdfTemplates, serviceTemplatesData] = await Promise.all([
        PdfExportService.getTemplates(),
        userData?.company_id 
          ? ServiceTemplateService.getTemplates(userData.company_id)
          : Promise.resolve([]),
      ]);
      setTemplates(pdfTemplates);
      setServiceTemplates(serviceTemplatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateTemplate = () => {
    setIsTemplateTypeModalOpen(true);
  };

  const handleTemplateTypeSelect = (type: 'quote' | 'service') => {
    if (type === 'quote') {
      navigate('/pdf-templates/quote/new');
    } else if (type === 'service') {
      navigate('/pdf-templates/service/new');
    }
  };
  const handleEditTemplate = (templateId: string, templateType?: 'pdf' | 'service') => {
    if (templateType === 'service') {
      navigate(`/pdf-templates/service/edit/${templateId}`);
    } else {
      // Quote/Proposal template
      navigate(`/pdf-templates/quote/edit/${templateId}`);
    }
  };
  const handleDuplicateTemplate = async (template: UnifiedTemplate) => {
    try {
      if (template.templateType === 'service') {
        const serviceTemplate = template as ServiceTemplate;
        if (!userData?.company_id || !userData?.id) {
          toast.error('Kullanıcı bilgileri bulunamadı');
          return;
        }
        const newTemplate = {
          name: `${serviceTemplate.name} - Kopya`,
          description: serviceTemplate.description,
          service_details: serviceTemplate.service_details,
        };
        await ServiceTemplateService.createTemplate(
          userData.company_id,
          userData.id,
          newTemplate
        );
        toast.success('Servis şablonu başarıyla kopyalandı');
      } else {
        const pdfTemplate = template as PdfTemplate;
        const newTemplate = {
          ...pdfTemplate,
          name: `${pdfTemplate.name} - Kopya`,
          version: 1,
        };
        delete (newTemplate as any).id;
        delete (newTemplate as any).created_at;
        delete (newTemplate as any).updated_at;
        await PdfExportService.saveTemplate(newTemplate);
        toast.success('PDF şablonu başarıyla kopyalandı');
      }
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Şablon kopyalanırken hata oluştu');
    }
  };
  const handleDeleteTemplateClick = (template: UnifiedTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTemplateConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      if (templateToDelete.templateType === 'service') {
        await ServiceTemplateService.deleteTemplate(templateToDelete.id);
        toast.success('Servis şablonu başarıyla silindi');
      } else {
        await PdfExportService.deleteTemplate(templateToDelete.id);
        toast.success('PDF şablonu başarıyla silindi');
      }
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


  const handlePreviewTemplate = (template: UnifiedTemplate) => {
    if (template.templateType === 'pdf') {
      setTemplateToPreview(template as PdfTemplate);
      setIsPreviewModalOpen(true);
    } else {
      // Servis şablonları için önizleme yok, direkt düzenleme sayfasına yönlendir
      navigate(`/pdf-templates/service/edit/${template.id}`);
    }
  };

  // Helper function to get template type badge color
  const getTypeBadgeColor = (type: string, templateType?: 'pdf' | 'service') => {
    if (templateType === 'service') {
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    }
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
  const getTypeLabel = (type: string, templateType?: 'pdf' | 'service') => {
    if (templateType === 'service') {
      return 'Servis';
    }
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
      totalCount: templates.length + serviceTemplates.length,
      quoteCount: templates.filter(t => t.type === 'quote').length,
      invoiceCount: templates.filter(t => t.type === 'invoice').length,
      proposalCount: templates.filter(t => t.type === 'proposal').length,
      serviceCount: serviceTemplates.length,
    };
  }, [templates, serviceTemplates]);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      {showHeader && (
        <div className="flex-shrink-0 mb-4">
        <PdfTemplatesHeader
          templates={templates}
          activeView={viewMode}
          setActiveView={setViewMode}
          totalCount={templates.length}
          statistics={statistics}
          onCreateTemplate={handleCreateTemplate}
        />
        </div>
      )}

      {/* Filters - Fixed */}
      <div className="flex-shrink-0 mb-4">
      <PdfTemplatesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
      <PdfTemplatesContent
        templates={unifiedTemplates}
        filteredTemplates={filteredTemplates}
        viewMode={viewMode}
        isLoading={isLoading}
        onPreview={handlePreviewTemplate}
        onEdit={handleEditTemplate}
        onDuplicate={handleDuplicateTemplate}
        onDelete={handleDeleteTemplateClick}
        onCreateTemplate={handleCreateTemplate}
        getTypeBadgeColor={getTypeBadgeColor}
        getTypeLabel={getTypeLabel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setTypeFilter={setTypeFilter}
      />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Şablonu Sil"
        description={`"${(templateToDelete as any)?.name || 'Bu şablon'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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
        onEdit={(template) => handleEditTemplate(template as any)}
        onDuplicate={(template) => handleDuplicateTemplate(template as any)}
        onDelete={(template) => handleDeleteTemplateClick(template as any)}
      />

      {/* Template Type Selection Modal */}
      <TemplateTypeSelectionModal
        open={isTemplateTypeModalOpen}
        onOpenChange={setIsTemplateTypeModalOpen}
        onSelectType={handleTemplateTypeSelect}
      />
    </div>
  );
};
export default PdfTemplates;
