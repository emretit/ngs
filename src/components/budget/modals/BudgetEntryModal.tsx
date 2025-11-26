import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useBudget, BudgetCategory } from "@/hooks/useBudget";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Copy, 
  Save,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  currency: string;
  initialCategory?: string;
  initialMonth?: number;
  onSuccess?: () => void;
}

interface MonthlyBudget {
  month: number;
  budget_amount: number;
  forecast_amount: number;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const BudgetEntryModal = ({
  open,
  onOpenChange,
  year,
  currency,
  initialCategory,
  initialMonth,
  onSuccess,
}: BudgetEntryModalProps) => {
  const { toast } = useToast();
  const { categories, bulkUpsertBudgets, fetchBudgets } = useBudget({ year, currency });
  
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  
  // Single entry state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "");
  const [subcategory, setSubcategory] = useState<string>("");
  const [newSubcategory, setNewSubcategory] = useState<string>("");
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>(
    MONTHS.map((_, i) => ({ month: i + 1, budget_amount: 0, forecast_amount: 0 }))
  );
  const [notes, setNotes] = useState<string>("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [uniformAmount, setUniformAmount] = useState<number>(0);

  // Subcategories for selected category
  const [subcategories, setSubcategories] = useState<string[]>([]);

  // Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        return;
      }

      try {
        // Get existing subcategories from budgets
        const { data } = await supabase
          .from("budgets")
          .select("subcategory")
          .eq("category", selectedCategory)
          .eq("year", year)
          .not("subcategory", "is", null);

        const uniqueSubs = [...new Set(data?.map(d => d.subcategory).filter(Boolean))] as string[];
        setSubcategories(uniqueSubs);
      } catch (error) {
        console.error("Error loading subcategories:", error);
      }
    };

    loadSubcategories();
  }, [selectedCategory, year]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCategory(initialCategory || "");
      setSubcategory("");
      setNewSubcategory("");
      setMonthlyBudgets(MONTHS.map((_, i) => ({ month: i + 1, budget_amount: 0, forecast_amount: 0 })));
      setNotes("");
      setApplyToAll(false);
      setUniformAmount(0);
    }
  }, [open, initialCategory]);

  // Apply uniform amount to all months
  useEffect(() => {
    if (applyToAll && uniformAmount > 0) {
      setMonthlyBudgets(prev =>
        prev.map(m => ({ ...m, budget_amount: uniformAmount, forecast_amount: uniformAmount }))
      );
    }
  }, [applyToAll, uniformAmount]);

  const handleMonthAmountChange = (month: number, field: "budget_amount" | "forecast_amount", value: number) => {
    setMonthlyBudgets(prev =>
      prev.map(m => (m.month === month ? { ...m, [field]: value } : m))
    );
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen bir kategori seçin",
      });
      return;
    }

    const finalSubcategory = newSubcategory || subcategory || null;

    setLoading(true);
    try {
      const budgetsToSave = monthlyBudgets
        .filter(m => m.budget_amount > 0 || m.forecast_amount > 0)
        .map(m => ({
          year,
          month: m.month,
          category: selectedCategory,
          subcategory: finalSubcategory,
          budget_amount: m.budget_amount,
          actual_amount: 0,
          forecast_amount: m.forecast_amount || m.budget_amount,
          currency,
          status: "draft" as const,
          notes,
        }));

      if (budgetsToSave.length === 0) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "En az bir ay için bütçe girmelisiniz",
        });
        return;
      }

      await bulkUpsertBudgets(budgetsToSave);
      
      toast({
        title: "Başarılı",
        description: `${budgetsToSave.length} aylık bütçe kaydedildi`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    if (!selectedCategory) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Önce bir kategori seçin",
      });
      return;
    }

    try {
      const { data } = await supabase
        .from("budgets")
        .select("*")
        .eq("category", selectedCategory)
        .eq("year", year - 1)
        .order("month");

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Veri Bulunamadı",
          description: `${year - 1} yılında bu kategori için bütçe bulunamadı`,
        });
        return;
      }

      setMonthlyBudgets(MONTHS.map((_, i) => {
        const prevBudget = data.find(d => d.month === i + 1);
        return {
          month: i + 1,
          budget_amount: prevBudget?.budget_amount || 0,
          forecast_amount: prevBudget?.budget_amount || 0,
        };
      }));

      toast({
        title: "Başarılı",
        description: `${year - 1} yılı bütçeleri kopyalandı`,
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçeler kopyalanırken hata oluştu",
      });
    }
  };

  const totalBudget = monthlyBudgets.reduce((sum, m) => sum + m.budget_amount, 0);
  const avgMonthly = totalBudget / 12;

  const getCurrencySymbol = () => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toLocaleString("tr-TR")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Bütçe Girişi - {year}
          </DialogTitle>
          <DialogDescription>
            Kategori bazında aylık bütçe değerlerini girin
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "bulk")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Tekli Giriş</TabsTrigger>
            <TabsTrigger value="bulk" disabled>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Toplu İçe Aktarma
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            {/* Category Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => c.type === "expense")
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                          {cat.is_auto_populated && (
                            <Badge variant="outline" className="ml-2 text-[10px]">Auto</Badge>
                          )}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alt Kategori</Label>
                {subcategories.length > 0 ? (
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alt kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Yok</SelectItem>
                      {subcategories.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    placeholder="Yeni alt kategori adı"
                  />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  checked={applyToAll}
                  onCheckedChange={setApplyToAll}
                  id="apply-all"
                />
                <Label htmlFor="apply-all" className="text-sm">
                  Tüm aylara aynı değeri uygula
                </Label>
              </div>
              {applyToAll && (
                <Input
                  type="number"
                  value={uniformAmount || ""}
                  onChange={(e) => setUniformAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Tutar"
                  className="w-32"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFromPrevious}
                className="ml-auto"
              >
                <Copy className="h-4 w-4 mr-1" />
                {year - 1} Yılından Kopyala
              </Button>
            </div>

            {/* Monthly Budget Grid */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-px bg-slate-200">
                {MONTHS.map((month, index) => (
                  <div key={index} className="bg-white p-3">
                    <Label className="text-xs font-medium text-slate-500">{month}</Label>
                    <Input
                      type="number"
                      value={monthlyBudgets[index].budget_amount || ""}
                      onChange={(e) => handleMonthAmountChange(
                        index + 1,
                        "budget_amount",
                        parseFloat(e.target.value) || 0
                      )}
                      className="mt-1 h-9"
                      placeholder="0"
                      disabled={applyToAll}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Toplam Yıllık Bütçe</p>
                    <p className="text-2xl font-bold text-blue-900">{formatAmount(totalBudget)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700 font-medium">Aylık Ortalama</p>
                    <p className="text-lg font-semibold text-blue-800">{formatAmount(avgMonthly)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bütçe ile ilgili notlar..."
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Excel İçe Aktarma</h3>
              <p className="text-sm text-slate-500 mb-4">
                Yakında eklenecek...
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedCategory}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetEntryModal;

