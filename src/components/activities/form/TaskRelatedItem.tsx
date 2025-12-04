
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./types";

interface TaskRelatedItemProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

const TaskRelatedItem = ({ watch, setValue }: TaskRelatedItemProps) => {
  const relatedItemType = watch("related_item_type");
  const relatedItemId = watch("related_item_id");
  const relatedItemTitle = watch("related_item_title");

  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">İlişkili Öğe (Opsiyonel)</h3>
      
      <div className="grid gap-2">
        <Label htmlFor="related_item_type">İlişkili Öğe Türü</Label>
        <Select 
          value={relatedItemType || "none"} 
          onValueChange={(value) => {
            if (value === "none") {
              setValue("related_item_type", undefined);
              setValue("related_item_id", undefined);
              setValue("related_item_title", undefined);
            } else {
              setValue("related_item_type", value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="İlişkili öğe türü seçin" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]">
            <SelectItem value="none">İlişkili öğe yok</SelectItem>
            <SelectItem value="customer">Müşteri</SelectItem>
            <SelectItem value="opportunity">Fırsat</SelectItem>
            <SelectItem value="proposal">Teklif</SelectItem>
            <SelectItem value="service_request">Servis Talebi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {relatedItemType && relatedItemType !== "none" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="related_item_id">İlişkili Öğe ID</Label>
            <Input
              id="related_item_id"
              placeholder="İlişkili öğe ID"
              value={relatedItemId || ""}
              onChange={(e) => setValue("related_item_id", e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="related_item_title">İlişkili Öğe Başlığı</Label>
            <Input
              id="related_item_title"
              placeholder="İlişkili öğe başlığı"
              value={relatedItemTitle || ""}
              onChange={(e) => setValue("related_item_title", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TaskRelatedItem;
