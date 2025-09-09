
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

export const ImageUpload = ({ onFileChange, selectedFile }: ImageUploadProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="avatar">Profile Picture</Label>
      <div className="flex items-center space-x-4">
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="flex-1"
        />
        {selectedFile && (
          <div className="text-sm text-gray-500">
            {selectedFile.name}
          </div>
        )}
      </div>
    </div>
  );
};
