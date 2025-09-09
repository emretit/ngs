
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paperclip, File, X, FileText, Image, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProposalAttachmentsProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const ProposalAttachments = ({ files, setFiles }: ProposalAttachmentsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (type === 'image') return <Image className="h-6 w-6 text-blue-500" />;
    if (extension === 'pdf') return <FileText className="h-6 w-6 text-red-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Ekler</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddFile}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Dosya Ekle
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {files.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center bg-muted/30">
          <Paperclip className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Teklif ile ilgili dosyaları eklemek için "Dosya Ekle" butonunu kullanın
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[200px] border rounded-lg p-2">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded bg-muted/20 hover:bg-muted/40"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[180px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ProposalAttachments;
