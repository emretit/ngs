import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Star, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/utils/errorHandler";

interface Activity {
  id: string;
  title: string;
  status: string;
  is_important: boolean;
  [key: string]: any;
}

interface EditActivityFormProps {
  activity: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditActivityForm: React.FC<EditActivityFormProps> = ({
  activity,
  onSuccess,
  onCancel
}) => {
  const [title, setTitle] = useState(activity.title);
  const [status, setStatus] = useState(activity.status);
  const [isImportant, setIsImportant] = useState(activity.is_important || false);
  const [isLoading, setIsLoading] = useState(false);

  // Activity değiştiğinde formu güncelle
  useEffect(() => {
    setTitle(activity.title);
    setStatus(activity.status);
    setIsImportant(activity.is_important || false);
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      handleError(new Error("Başlık gereklidir"), {
        operation: "validateEditActivityForm"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          title: title.trim(),
          status,
          priority: isImportant ? 'high' : 'medium',
          is_important: isImportant,
        })
        .eq('id', activity.id);

      if (error) throw error;

      handleSuccess("Aktivite başarıyla güncellendi", "updateActivity");
      onSuccess();
    } catch (error) {
      handleError(error, {
        operation: "updateActivity",
        metadata: { activityId: activity.id, title }
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
    <div className="space-y-3 p-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200 mt-2">
      {/* Başlık */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-title" className="text-xs font-medium text-gray-700">
          Başlık *
        </Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aktivite başlığını girin"
          className="h-9 text-xs bg-white"
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
          <Label htmlFor="edit-important" className="flex items-center gap-1.5 cursor-pointer text-xs font-medium flex-1">
            <Star className={cn(
              "h-3.5 w-3.5 transition-all duration-200",
              isImportant ? "text-yellow-500 fill-yellow-500 scale-110" : "text-gray-400"
            )} />
            <span className={isImportant ? "text-yellow-700" : "text-gray-600"}>Önemli</span>
          </Label>
          <Switch
            id="edit-important"
            checked={isImportant}
            onCheckedChange={setIsImportant}
            className="scale-75"
          />
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-9 text-xs bg-white"
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
            "Kaydediliyor..."
          ) : (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditActivityForm;
