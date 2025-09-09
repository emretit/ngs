
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  isLoading: boolean;
  onClick: (e: React.FormEvent) => void | Promise<void>;
}

export const SaveButton = ({ isLoading, onClick }: SaveButtonProps) => {
  return (
    <Button 
      type="button" 
      className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all" 
      onClick={(e) => onClick(e)}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          Kaydediliyor...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          Kaydet
        </>
      )}
    </Button>
  );
};
