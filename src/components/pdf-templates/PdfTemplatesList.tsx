import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  FileText,
  Calendar,
  Eye,
} from 'lucide-react';
import { PdfTemplate } from '@/types/pdf-template';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Wrench } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type UnifiedTemplate = any; // PdfTemplate | ServiceTemplate

interface PdfTemplatesListProps {
  templates: UnifiedTemplate[];
  viewMode: ViewMode;
  onPreview: (template: UnifiedTemplate) => void;
  onEdit: (templateId: string, templateType?: 'pdf' | 'service') => void;
  onDuplicate: (template: UnifiedTemplate) => void;
  onDelete: (template: UnifiedTemplate) => void;
  getTypeBadgeColor: (type: string, templateType?: 'pdf' | 'service') => string;
  getTypeLabel: (type: string, templateType?: 'pdf' | 'service') => string;
}

const PdfTemplatesList = memo(({
  templates,
  viewMode,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  getTypeBadgeColor,
  getTypeLabel,
}: PdfTemplatesListProps) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
            onClick={() => onPreview(template)}
          >
            <CardContent className="p-0">
              {/* Template Preview Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg overflow-hidden border-b">
                <div className="absolute inset-0 flex items-center justify-center">
                  {template.templateType === 'service' ? (
                    <Wrench className="h-16 w-16 text-gray-300" />
                  ) : (
                    <FileText className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(template);
                    }}
                    className="gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Önizle
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(template.id, template.templateType);
                    }}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(template);
                    }}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Kopyala
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                    {template.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Önizle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(template.id, template.templateType);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(template);
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(template);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Badge className={getTypeBadgeColor(template.type, template.templateType)}>
                    {getTypeLabel(template.type, template.templateType)}
                  </Badge>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(template.updated_at || template.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>

                  {template.templateType === 'pdf' && (
                    <div className="text-xs text-muted-foreground">
                      Sürüm: v{template.version}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative bg-white rounded-xl border border-gray-200/60 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          {/* Gradient accent line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-green-400 to-green-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="flex items-center gap-4 p-5">
            {/* Icon with modern design */}
            <div className="relative flex-shrink-0">
              <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300 ${
                template.templateType === 'service' 
                  ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-100' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
              }`}>
                {template.templateType === 'service' ? (
                  <Wrench className="h-7 w-7 text-orange-600" />
                ) : (
                  <FileText className="h-7 w-7 text-green-600" />
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h4 className="font-semibold text-base text-gray-900 truncate group-hover:text-primary transition-colors">
                      {template.name}
                    </h4>
                    <Badge className={`text-xs font-medium px-2.5 py-0.5 ${getTypeBadgeColor(template.type, template.templateType)} shadow-sm`}>
                      {getTypeLabel(template.type, template.templateType)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(template.updated_at || template.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </span>
                    {template.templateType === 'pdf' && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="font-medium">Sürüm v{template.version}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Modern design */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPreview(template)}
                className="h-9 px-3 gap-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Önizle</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(template.id, template.templateType)}
                className="h-9 px-3 gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Düzenle</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => onDuplicate(template)}
                    className="cursor-pointer"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopyala
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(template)}
                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

PdfTemplatesList.displayName = 'PdfTemplatesList';

export { PdfTemplatesList };
export type { PdfTemplatesListProps };

