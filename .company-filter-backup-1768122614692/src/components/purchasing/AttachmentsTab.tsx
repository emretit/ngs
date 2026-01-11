import { useState } from "react";
import { logger } from '@/utils/logger';
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, File, Trash2, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/dateUtils";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by: string;
}

interface AttachmentsTabProps {
  objectType: 'purchase_request' | 'purchase_order' | 'rfq' | 'grn' | 'vendor_invoice';
  objectId: string;
}

export function AttachmentsTab({ objectType, objectId }: AttachmentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch attachments
  const { data: attachments, isLoading } = useQuery({
    queryKey: ['attachments', objectType, objectId],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) throw new Error('No company');

      const { data, error } = await supabase
        .from('purchasing_attachments')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('object_type', objectType)
        .eq('object_id', objectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Attachment[];
    },
  });

  // Upload attachment
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Maksimum dosya boyutu 10MB'dir.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) throw new Error('No company');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const filePath = `${profile.company_id}/${objectType}/${objectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('purchasing')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { error: dbError } = await supabase
        .from('purchasing_attachments')
        .insert({
          company_id: profile.company_id,
          object_type: objectType,
          object_id: objectId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['attachments', objectType, objectId] });
      
      toast({
        title: "Başarılı",
        description: "Dosya yüklendi.",
      });

      // Reset input
      e.target.value = '';
    } catch (error: any) {
      logger.error('Upload error:', error);
      toast({
        title: "Hata",
        description: error.message || "Dosya yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (attachment: Attachment) => {
    setAttachmentToDelete(attachment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(attachmentToDelete);
    } catch (error) {
      logger.error('Error deleting attachment:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setAttachmentToDelete(null);
  };

  // Delete attachment
  const deleteMutation = useMutation({
    mutationFn: async (attachment: Attachment) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('purchasing')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('purchasing_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', objectType, objectId] });
      toast({
        title: "Başarılı",
        description: "Dosya silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Dosya silinemedi.",
        variant: "destructive",
      });
    },
  });

  // Download attachment
  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('purchasing')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Dosya indirilemedi.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Ek Dosyalar</h3>
            <label htmlFor="file-upload">
              <Button type="button" size="sm" disabled={uploading} asChild>
                <span className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Dosya Ekle
                    </>
                  )}
                </span>
              </Button>
            </label>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>

          {!attachments || attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz ek dosya bulunmuyor
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attachment.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(attachment)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Maksimum dosya boyutu: 10MB
          </p>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Dosyayı Sil"
        description={`"${attachmentToDelete?.file_name || 'Bu dosya'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
}
