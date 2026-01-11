import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Settings, Save, MoreHorizontal, Eye, FileText } from "lucide-react";
import { useProduction } from "@/hooks/useProduction";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BOMInfoCard from "@/components/production/cards/BOMInfoCard";
import BOMItemsCard from "@/components/production/cards/BOMItemsCard";

interface BOMItem {
  id: string;
  row_number: number;
  item_name: string;
  quantity: number;
  unit: string;
}

interface BOMFormData {
  name: string;
  description?: string;
  product_id?: string;
  product_name?: string;
}

const ProductionBOMNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { createBOM, isCreating } = useProduction();
  const isEditMode = !!id;
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<BOMFormData>({
    name: "",
    description: "",
    product_id: undefined,
    product_name: undefined,
  });

  // Reçete kalemleri
  const [items, setItems] = useState<BOMItem[]>([
    { 
      id: Date.now().toString(), 
      row_number: 1, 
      item_name: "", 
      quantity: 1, 
      unit: "adet" 
    }
  ]);

  // Fetch existing BOM if editing
  const { data: existingBOM, isLoading: isLoadingBOM } = useQuery({
    queryKey: ["bom", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("boms")
        .select(`
          *,
          items:bom_items(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when editing
  React.useEffect(() => {
    if (existingBOM) {
      setFormData({
        name: existingBOM.name || "",
        description: existingBOM.description || "",
        product_id: existingBOM.product_id || undefined,
        product_name: existingBOM.product_name || undefined,
      });

      if (existingBOM.items && existingBOM.items.length > 0) {
        setItems(
          existingBOM.items.map((item: any, index: number) => ({
            id: item.id || Date.now().toString() + index,
            row_number: index + 1,
            item_name: item.item_name || "",
            quantity: item.quantity || 1,
            unit: item.unit || "adet",
          }))
        );
      }
    }
  }, [existingBOM]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = useCallback((index: number, field: keyof BOMItem, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems(prevItems => {
      const newItem: BOMItem = {
        id: Date.now().toString(),
        row_number: prevItems.length + 1,
        item_name: "",
        quantity: 1,
        unit: "adet"
      };
      return [...prevItems, newItem];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prevItems => {
      if (prevItems.length > 1) {
        const updatedItems = prevItems.filter((_, i) => i !== index);
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const moveItemUp = useCallback((index: number) => {
    setItems(prevItems => {
      if (index > 0) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index - 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const moveItemDown = useCallback((index: number) => {
    setItems(prevItems => {
      if (index < prevItems.length - 1) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index + 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push("Reçete adı gereklidir");
    }
    
    // Boş satırları filtrele
    const validItems = items.filter(item => item.item_name.trim() !== "");
    
    if (validItems.length === 0) {
      errors.push("En az bir malzeme eklenmelidir");
    }
    
    // Her item için validasyon
    validItems.forEach((item, index) => {
      if (!item.item_name.trim()) {
        errors.push(`${index + 1}. satırda malzeme adı gereklidir`);
      }
      if (item.quantity <= 0) {
        errors.push(`${index + 1}. satırda miktar 0'dan büyük olmalıdır`);
      }
    });
    
    return errors;
  };

  const handleSave = async () => {
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      setSaving(true);

      // Boş satırları filtrele
      const validItems = items
        .filter(item => item.item_name.trim() !== "")
        .map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit
        }));

      if (isEditMode && id) {
        // Update existing BOM
        const { error: bomError } = await supabase
          .from("boms")
          .update({
            name: formData.name,
            description: formData.description || undefined,
            product_id: formData.product_id || undefined,
            product_name: formData.product_name || undefined,
          })
          .eq("id", id);

        if (bomError) throw bomError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("bom_items")
          .delete()
          .eq("bom_id", id);

        if (deleteError) throw deleteError;

        // Insert new items
        if (validItems.length > 0) {
          const itemsToInsert = validItems.map(item => ({
            bom_id: id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit: item.unit
          }));

          const { error: itemsError } = await supabase
            .from("bom_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        toast.success("Reçete başarıyla güncellendi");
      } else {
        // Create new BOM
        await createBOM({
          name: formData.name,
          description: formData.description || undefined,
          product_id: formData.product_id || undefined,
          product_name: formData.product_name || undefined,
          items: validItems
        });
        toast.success("Reçete başarıyla oluşturuldu");
      }

      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["production_stats"] });
      
      navigate("/production/boms");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Reçete kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    toast.info("Önizleme özelliği yakında eklenecek");
  };

  if (isLoadingBOM && isEditMode) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Reçete yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/production/boms")}
              variant="ghost"
              size="sm"
            >
              Ürün Reçeteleri
            </BackButton>
            
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {isEditMode ? "Ürün Reçetesi Düzenle" : "Yeni Ürün Reçetesi Oluştur"}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Üretim reçetesi ve malzeme listesi yönetimi
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSave}
              disabled={saving || isCreating}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving || isCreating ? "Kaydediliyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Önizle</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Card-based layout */}
      <div className="space-y-4">
        {/* BOM Info Card */}
        <BOMInfoCard
          formData={formData}
          onFieldChange={handleFieldChange}
          errors={{}}
        />

        {/* BOM Items Card - Full Width */}
        <BOMItemsCard
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onMoveItemUp={moveItemUp}
          onMoveItemDown={moveItemDown}
          onItemChange={handleItemChange}
          showMoveButtons={true}
          inputHeight="h-8"
        />
      </div>
    </div>
  );
};

export default ProductionBOMNew;

