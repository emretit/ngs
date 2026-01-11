import { useState, useCallback } from "react";
import { logger } from '@/utils/logger';
import { Building, Plus, Check, ChevronRight } from "lucide-react";
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
import { toast } from "sonner";
import { useUserCompanies, useSwitchCompany, useCreateUserCompany } from "@/hooks/useUserCompanies";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CompanySwitcher = ({ open, onOpenChange }: CompanySwitcherProps) => {
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  
  const { data: userCompanies, isLoading } = useUserCompanies();
  const { companyId: currentCompanyId } = useCurrentCompany();
  const switchCompany = useSwitchCompany();
  const createCompany = useCreateUserCompany();

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === currentCompanyId) {
      onOpenChange(false);
      return;
    }
    
    try {
      // Loading toast göster
      const loadingToast = toast.loading("Şirket değiştiriliyor...");
      
      await switchCompany.mutateAsync(companyId);
      
      // Başarı mesajı göster ve sayfa yenilenecek
      toast.success("Şirket değiştirildi, sayfa yenileniyor...", { id: loadingToast });
      onOpenChange(false);
      
      // Sayfa yenilenecek (useSwitchCompany hook'unda)
    } catch (error: any) {
      const errorMessage = error?.message || "Şirket değiştirilemedi";
      toast.error(errorMessage);
      logger.error("Firma değiştirme hatası:", error);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Şirket adı gerekli");
      return;
    }
    
    try {
      // Loading toast göster
      const loadingToast = toast.loading("Yeni şirket oluşturuluyor...");
      
      await createCompany.mutateAsync(newCompanyName.trim());
      
      // Başarı mesajı göster ve sayfa yenilenecek
      toast.success("Yeni şirket oluşturuldu, sayfa yenileniyor...", { id: loadingToast });
      setNewCompanyName("");
      setShowNewCompanyForm(false);
      onOpenChange(false);
      
      // Sayfa yenilenecek (useCreateUserCompany hook'unda)
    } catch (error: any) {
      const errorMessage = error?.message || "Şirket oluşturulamadı";
      toast.error(errorMessage);
      logger.error("Şirket oluşturma hatası:", error);
    }
  };

  // Optimized close handler with mutation guard and state batching
  const handleClose = useCallback((isOpen: boolean) => {
    // Pending mutation varsa kapanmayı engelle
    if (!isOpen && (switchCompany.isPending || createCompany.isPending)) {
      return;
    }
    
    if (!isOpen) {
      // State güncellemelerini batch olarak yap
      requestAnimationFrame(() => {
        setShowNewCompanyForm(false);
        setNewCompanyName("");
      });
    }
    onOpenChange(isOpen);
  }, [switchCompany.isPending, createCompany.isPending, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => {
          // Pending mutation varsa ESC ile kapanmayı engelle
          if (switchCompany.isPending || createCompany.isPending) {
            e.preventDefault();
          }
        }}
        onCloseAutoFocus={(e) => {
          // Focus trap sorunlarını önle
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {showNewCompanyForm ? "Yeni Şirket Ekle" : "Şirket Seç"}
          </DialogTitle>
          <DialogDescription>
            {showNewCompanyForm 
              ? "Yeni bir şirket oluşturun" 
              : "Çalışmak istediğiniz şirketi seçin veya yeni bir şirket ekleyin"
            }
          </DialogDescription>
        </DialogHeader>

        {showNewCompanyForm ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Şirket Adı</Label>
              <Input
                id="company-name"
                placeholder="Şirket adını girin..."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCompany();
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowNewCompanyForm(false)}>
                Geri
              </Button>
              <Button 
                onClick={handleCreateCompany}
                disabled={createCompany.isPending || !newCompanyName.trim()}
              >
                {createCompany.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {userCompanies && userCompanies.length > 0 ? (
                  userCompanies.map((uc) => (
                    <button
                      key={uc.id}
                      onClick={() => handleSwitchCompany(uc.company_id)}
                      disabled={switchCompany.isPending}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                        uc.company_id === currentCompanyId
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {uc.company?.logo_url ? (
                          <img 
                            src={uc.company.logo_url} 
                            alt={uc.company.name || ''} 
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-sm">{uc.company?.name || 'İsimsiz Şirket'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{uc.role}</p>
                        </div>
                      </div>
                      {uc.company_id === currentCompanyId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Henüz bir şirkete bağlı değilsiniz
                  </p>
                )}
                
                <button
                  onClick={() => setShowNewCompanyForm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-border hover:bg-muted transition-colors mt-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">Yeni Şirket Ekle</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanySwitcher;
