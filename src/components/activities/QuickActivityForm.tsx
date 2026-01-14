import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Star, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { handleError, handleSuccess } from "@/utils/errorHandler";

interface QuickActivityFormProps {
  opportunityId: string;
  customerId?: string;
  customerName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const QuickActivityForm: React.FC<QuickActivityFormProps> = ({
  opportunityId,
  customerId,
  customerName,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      handleError(new Error("Başlık gereklidir"), {
        operation: "validateQuickActivityForm"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          title: title.trim(),
          status,
          priority: isImportant ? 'high' : 'medium',
          is_important: isImportant,
          type: 'opportunity',
          company_id: user?.company_id || null,
          opportunity_id: opportunityId,
          related_item_id: customerId || opportunityId,
          related_item_type: customerId ? 'customer' : 'opportunity',
          related_item_title: customerName || null,
        });

      if (error) throw error;

      handleSuccess("Aktivite başarıyla oluşturuldu", "createQuickActivity");
      onSuccess();
    } catch (error) {
      handleError(error, {
        operation: "createQuickActivity",
        metadata: { title }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
  };

  return (
    <div className="space-y-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* Başlık */}
      <div className="space-y-1.5">
        <Label htmlFor="quick-title" className="text-xs font-medium text-gray-700">
          Başlık *
        </Label>
        <Input
          id="quick-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aktivite başlığını girin"
          className="h-9 text-xs"
          required
          autoFocus
        />
      </div>

      {/* Durum */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Durum</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 bg-white border-gray-200 hover:border-primary/50 transition-colors text-xs">
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Yapılacak</span>
              </div>
            </SelectItem>
            <SelectItem value="in_progress">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Devam Ediyor</span>
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Tamamlandı</span>
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>İptal Edildi</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Önemli */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-700">Önem</Label>
        <div className={cn(
          "flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors cursor-pointer h-9",
          isImportant
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white border-gray-200 hover:border-yellow-300"
        )}>
          <Label htmlFor="quick-important" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium flex-1">
            <Star className={cn(
              "h-3.5 w-3.5 transition-all duration-200",
              isImportant ? "text-yellow-500 fill-yellow-500 scale-110" : "text-gray-400"
            )} />
            <span className={isImportant ? "text-yellow-700" : "text-gray-600"}>Önemli</span>
          </Label>
          <Switch
            id="quick-important"
            checked={isImportant}
            onCheckedChange={setIsImportant}
            className="scale-75"
          />
        </div>
      </div>

      {/* Bilgi Notu */}
      <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>Fırsat:</strong> {customerId && customerName ? `${customerName} için ` : ''}Otomatik bağlanacak
        </p>
      </div>

      {/* Butonlar */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-9 text-xs"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          İptal
        </Button>
        <Button
          type="button"
          onClick={handleFormSubmit}
          disabled={isLoading}
          className="flex-1 h-9 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            "Oluşturuluyor..."
          ) : (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Oluştur
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuickActivityForm;
