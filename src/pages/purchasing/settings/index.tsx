import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function PurchasingSettings() {
  const [settings, setSettings] = useState({
    pr_prefix: 'PR',
    rfq_prefix: 'RFQ',
    po_prefix: 'PO',
    grn_prefix: 'GRN',
    inv_prefix: 'INV',
    pr_numbering_format: '{PREFIX}-{YYYY}-{####}',
    rfq_numbering_format: '{PREFIX}-{YYYY}-{####}',
    po_numbering_format: '{PREFIX}-{YYYY}-{####}',
    grn_numbering_format: '{PREFIX}-{YYYY}-{####}',
    approval_threshold_level1: 50000,
    approval_threshold_level2: 100000,
    default_tax_rate: 20,
    default_currency: 'TRY',
    auto_create_grn: false,
    require_3way_match: true,
    e_invoice_enabled: false,
  });

  const handleSave = () => {
    // TODO: Implement save to database
    toast({
      title: "Başarılı",
      description: "Ayarlar kaydedildi",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Satın Alma Ayarları
          </h1>
          <p className="text-muted-foreground">Modül ayarlarını yapılandırın</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <h3 className="font-semibold">Belge Numaralandırma</h3>
          
          <div className="space-y-2">
            <Label htmlFor="pr_prefix">PR Prefix</Label>
            <Input
              id="pr_prefix"
              value={settings.pr_prefix}
              onChange={(e) => setSettings({ ...settings, pr_prefix: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfq_prefix">RFQ Prefix</Label>
            <Input
              id="rfq_prefix"
              value={settings.rfq_prefix}
              onChange={(e) => setSettings({ ...settings, rfq_prefix: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="po_prefix">PO Prefix</Label>
            <Input
              id="po_prefix"
              value={settings.po_prefix}
              onChange={(e) => setSettings({ ...settings, po_prefix: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grn_prefix">GRN Prefix</Label>
            <Input
              id="grn_prefix"
              value={settings.grn_prefix}
              onChange={(e) => setSettings({ ...settings, grn_prefix: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv_prefix">Fatura Prefix</Label>
            <Input
              id="inv_prefix"
              value={settings.inv_prefix}
              onChange={(e) => setSettings({ ...settings, inv_prefix: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numbering_format">Numara Formatı</Label>
            <Input
              id="numbering_format"
              value={settings.po_numbering_format}
              onChange={(e) => setSettings({ ...settings, po_numbering_format: e.target.value })}
              placeholder="{PREFIX}-{YYYY}-{####}"
            />
            <p className="text-xs text-muted-foreground">
              Kullanılabilir değişkenler: {'{PREFIX}'}, {'{YYYY}'}, {'{####}'}
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-semibold">Onay Eşikleri</h3>
            
            <div className="space-y-2">
              <Label htmlFor="threshold1">Seviye 1 Onay Eşiği (TRY)</Label>
              <Input
                id="threshold1"
                type="number"
                value={settings.approval_threshold_level1}
                onChange={(e) => setSettings({ ...settings, approval_threshold_level1: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold2">Seviye 2 Onay Eşiği (TRY)</Label>
              <Input
                id="threshold2"
                type="number"
                value={settings.approval_threshold_level2}
                onChange={(e) => setSettings({ ...settings, approval_threshold_level2: Number(e.target.value) })}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h3 className="font-semibold">Varsayılan Değerler</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Varsayılan KDV Oranı (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={settings.default_tax_rate}
                onChange={(e) => setSettings({ ...settings, default_tax_rate: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Varsayılan Para Birimi</Label>
              <Input
                id="currency"
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h3 className="font-semibold">İşlem Ayarları</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_grn">Otomatik GRN Oluştur</Label>
                <p className="text-xs text-muted-foreground">
                  PO onaylandığında otomatik GRN oluştur
                </p>
              </div>
              <Switch
                id="auto_grn"
                checked={settings.auto_create_grn}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_create_grn: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require_match">3-Way Match Zorunlu</Label>
                <p className="text-xs text-muted-foreground">
                  Fatura onayı için eşleştirme gerekli
                </p>
              </div>
              <Switch
                id="require_match"
                checked={settings.require_3way_match}
                onCheckedChange={(checked) => setSettings({ ...settings, require_3way_match: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="e_invoice">E-Fatura Entegrasyonu</Label>
                <p className="text-xs text-muted-foreground">
                  E-Fatura sistemi ile entegrasyon
                </p>
              </div>
              <Switch
                id="e_invoice"
                checked={settings.e_invoice_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, e_invoice_enabled: checked })}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
