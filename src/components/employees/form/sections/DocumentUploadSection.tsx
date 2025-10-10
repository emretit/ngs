import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  employeeId?: string;
  onDocumentsChange?: (documents: DocumentFile[]) => void;
}

export interface DocumentFile {
  id?: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
  uploaded_at?: string;
}

export const DocumentUploadSection = ({ employeeId, onDocumentsChange }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newDocuments: DocumentFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // File validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Dosya Boyutu Hatası",
          description: `${file.name} dosyası çok büyük. Maksimum 10MB olmalıdır.`,
          variant: "destructive",
        });
        continue;
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Dosya Türü Hatası",
          description: `${file.name} desteklenmeyen dosya türü.`,
          variant: "destructive",
        });
        continue;
      }

      const document: DocumentFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
      };

      newDocuments.push(document);
    }

    setDocuments(prev => [...prev, ...newDocuments]);
    onDocumentsChange?.([...documents, ...newDocuments]);
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    setDocuments(newDocuments);
    onDocumentsChange?.(newDocuments);
  };

  const handleDownload = async (document: DocumentFile) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else if (document.file) {
      const url = URL.createObjectURL(document.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePreview = (document: DocumentFile) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else if (document.file) {
      const url = URL.createObjectURL(document.file);
      window.open(url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📁';
  };

  const getFileTypeColor = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-100 text-red-800 border-red-200';
    if (type.includes('image')) return 'bg-green-100 text-green-800 border-green-200';
    if (type.includes('word')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type.includes('excel') || type.includes('sheet')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Özlük Dosyaları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Belge yüklemek için tıklayın veya sürükleyip bırakın
          </p>
          <p className="text-xs text-gray-500">
            PDF, Word, Excel, resim dosyaları (Max: 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Dosyalar yükleniyor...
            </div>
          </div>
        )}

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Yüklenen Belgeler ({documents.length})</h4>
            <div className="space-y-2">
              {documents.map((document, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(document.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{document.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getFileTypeColor(document.type)}`}
                        >
                          {document.type.split('/')[1].toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(document.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(document)}
                      className="h-8 w-8 p-0"
                      title="Önizle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="h-8 w-8 p-0"
                      title="İndir"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Sil"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && !isUploading && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Henüz belge yüklenmedi</p>
            <p className="text-xs text-gray-400 mt-1">
              Sözleşme, kimlik fotokopisi, diploma gibi belgeleri yükleyebilirsiniz
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
