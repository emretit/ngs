
import React from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type FileUploadFieldProps = {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export const FileUploadField: React.FC<FileUploadFieldProps> = ({ files, setFiles }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>Dosya Ekle</FormLabel>
      <Input
        type="file"
        multiple
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      {files.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {files.length} dosya seçildi
        </p>
      )}
    </div>
  );
};
