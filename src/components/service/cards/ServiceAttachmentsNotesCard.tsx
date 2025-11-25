import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, StickyNote, X, Loader2, FileText } from "lucide-react";

interface ServiceAttachmentsNotesCardProps {
  formData: {
    attachments: Array<{
      name: string;
      path: string;
      type: string;
      size: number;
    }>;
    notes: string[];
    service_result: string;
  };
  handleInputChange: (field: string, value: any) => void;
  handleFileUpload: (files: FileList | null) => Promise<void>;
  handleAddNote: () => void;
  handleRemoveNote: (index: number) => void;
  newNote: string;
  setNewNote: (value: string) => void;
  uploadingFiles: boolean;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors?: Record<string, string>;
}

const ServiceAttachmentsNotesCard: React.FC<ServiceAttachmentsNotesCardProps> = ({
  formData,
  handleInputChange,
  handleFileUpload,
  handleAddNote,
  handleRemoveNote,
  newNote,
  setNewNote,
  uploadingFiles,
  setFormData,
  errors = {}
}) => {
  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-200/50">
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          Servis Açıklaması
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        {/* Servis Sonucu */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Servis Sonucu
          </Label>
          <Textarea
            value={formData.service_result}
            onChange={(e) => handleInputChange('service_result', e.target.value)}
            placeholder="Servis sonucu veya ön görüş (opsiyonel)"
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        {/* Dosya Yükleme */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Dosya Ekle
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="h-10 text-sm"
              disabled={uploadingFiles}
            />
            {uploadingFiles && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {formData.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-1.5 bg-muted rounded text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => setFormData((prev: any) => ({
                      ...prev,
                      attachments: prev.attachments.filter((_: any, i: number) => i !== index)
                    }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Şirket İçi Notlar */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Şirket İçi Notlar
          </Label>
          <div className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Şirket içi not ekle..."
              className="h-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNote}
              className="h-10 text-sm"
              disabled={!newNote.trim()}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>
          {formData.notes.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.notes.map((note, index) => (
                <div key={index} className="flex items-start justify-between p-1.5 bg-muted rounded text-xs">
                  <span className="flex-1">{note}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-2"
                    onClick={() => handleRemoveNote(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceAttachmentsNotesCard;

