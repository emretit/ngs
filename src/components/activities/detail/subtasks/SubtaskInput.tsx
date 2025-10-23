
import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface SubtaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isUpdating: boolean;
  placeholder: string;
  autoFocus?: boolean;
}

const SubtaskInput = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel,
  isUpdating,
  placeholder,
  autoFocus
}: SubtaskInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const isDisabled = isUpdating || !value.trim();
  

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        onKeyDown={handleKeyDown}
        disabled={isUpdating}
      />
      <Button 
        size="sm" 
        onClick={onSave}
        disabled={isDisabled}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onCancel}
        disabled={isUpdating}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SubtaskInput;
