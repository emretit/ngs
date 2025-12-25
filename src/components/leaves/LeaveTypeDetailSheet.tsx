import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  color?: string;
  rules_count: number;
}

interface LeaveTypeRule {
  id: string;
  leave_type_id: string;
  name: string;
  min_years_of_service?: number;
  max_years_of_service?: number;
  days_entitled: number;
  description?: string;
  priority: number;
}

interface LeaveTypeDetailSheetProps {
  leaveType: LeaveType | null;
  rules: LeaveTypeRule[];
  isOpen: boolean;
  onClose: () => void;
  onAddRule: () => void;
}

const LeaveTypeDetailSheet = ({
  leaveType,
  rules,
  isOpen,
  onClose,
  onAddRule
}: LeaveTypeDetailSheetProps) => {
  if (!leaveType) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {leaveType.color && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: leaveType.color }}
              />
            )}
            {leaveType.name}
          </SheetTitle>
          <SheetDescription>
            {leaveType.description || "Bu izin türüne ait kuralları görüntüleyin ve yönetin."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* İzin Türü Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Durum:</span>
                <div className="mt-1">
                  <Badge variant={leaveType.is_active ? "default" : "secondary"}>
                    {leaveType.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Kural Sayısı:</span>
                <div className="mt-1 font-medium">{leaveType.rules_count} kural</div>
              </div>
            </div>
          </div>

          {/* Kurallar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Kurallar</h3>
              <Button size="sm" onClick={onAddRule} className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Kural
              </Button>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-md bg-muted/20">
                <p className="text-sm">Bu izin türü için henüz kural tanımlanmamış.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddRule}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  İlk Kuralı Ekle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{rule.name}</h4>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {(rule.min_years_of_service !== undefined || rule.max_years_of_service !== undefined) && (
                              <span className="text-muted-foreground">
                                <strong>Çalışma Süresi:</strong>{" "}
                                {rule.min_years_of_service !== undefined ? `${rule.min_years_of_service}` : "0"}
                                {" - "}
                                {rule.max_years_of_service !== undefined ? `${rule.max_years_of_service}` : "∞"} yıl
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              <strong>Hak:</strong> {rule.days_entitled} gün
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info("Düzenleme özelliği yakında eklenecek")}>
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Silme özelliği yakında eklenecek")}>
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeaveTypeDetailSheet;
