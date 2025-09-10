import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  MoreVertical, 
  FileText, 
  Calendar,
  Star,
  StarOff
} from 'lucide-react';
import { PdfTemplate } from '@/types/pdf-template';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const PdfTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await PdfExportService.deleteTemplate(templateId);
      toast.success('Şablon başarıyla silindi');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Şablon silinirken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Şablonlar yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">PDF Şablonları</h1>
            <p className="text-muted-foreground mt-1">
              Teklif, fatura ve diğer belgeler için PDF şablonlarını yönetin
            </p>
          </div>
          
          <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Yeni Şablon
          </Button>
        </div>



        {/* Templates List */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Henüz şablon bulunmuyor
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                İlk PDF şablonunuzu oluşturarak belgelerinizi özelleştirmeye başlayın.
              </p>
              <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                İlk Şablonunuzu Oluşturun
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Şablon Listesi</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Toplam {templates.length} şablon bulunuyor
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.is_default && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Varsayılan
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {template.type === 'quote' ? 'Teklif' : 
                             template.type === 'invoice' ? 'Fatura' : 'Diğer'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Sürüm: v{template.version}</span>
                          <span>
                            Son güncelleme: {formatDistanceToNow(new Date(template.updated_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!template.is_default ? (
                            <DropdownMenuItem onClick={() => handleSetAsDefault(template.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Varsayılan Yap
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled>
                              <StarOff className="h-4 w-4 mr-2" />
                              Zaten Varsayılan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PdfTemplates;
