import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  useCreateVendor,
  useUpdateVendor,
  useCheckVendorDuplicate,
  type Vendor,
  type VendorFormData,
} from '@/hooks/useVendors';
import { VendorContactsManager } from './VendorContactsManager';

interface VendorFormDrawerProps {
  open: boolean;
  onClose: () => void;
  vendor?: Vendor;
}

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];
const COUNTRIES = ['Turkey', 'Germany', 'USA', 'UK', 'China', 'Italy', 'France'];

export function VendorFormDrawer({ open, onClose, vendor }: VendorFormDrawerProps) {
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const checkDuplicate = useCheckVendorDuplicate();

  const [formData, setFormData] = useState<VendorFormData>({
    code: '',
    name: '',
    tax_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Turkey',
    currency: 'TRY',
    payment_terms: '',
    payment_terms_days: 30,
    rating: 0,
    incoterm: '',
    delivery_lead_days: undefined,
    tags: [],
    is_active: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (vendor) {
      setFormData({
        code: vendor.code || '',
        name: vendor.name,
        tax_number: vendor.tax_number || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        city: vendor.city || '',
        country: vendor.country || 'Turkey',
        currency: vendor.currency || 'TRY',
        payment_terms: vendor.payment_terms || '',
        payment_terms_days: vendor.payment_terms_days || 30,
        rating: vendor.rating || 0,
        incoterm: vendor.incoterm || '',
        delivery_lead_days: vendor.delivery_lead_days || undefined,
        tags: vendor.tags || [],
        is_active: vendor.is_active,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        tax_number: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Turkey',
        currency: 'TRY',
        payment_terms: '',
        payment_terms_days: 30,
        rating: 0,
        incoterm: '',
        delivery_lead_days: undefined,
        tags: [],
        is_active: true,
      });
    }
    setDuplicateWarning('');
    setActiveTab('general');
  }, [vendor, open]);

  const handleCheckDuplicate = async () => {
    if (!formData.name) return;

    const result = await checkDuplicate.mutateAsync({
      tax_number: formData.tax_number,
      name: formData.name,
      excludeId: vendor?.id,
    });

    if (result.length > 0) {
      const warnings = result.map(v => 
        v.tax_number === formData.tax_number 
          ? `Aynı vergi numarasına sahip: ${v.name}`
          : `Benzer isimde: ${v.name}`
      );
      setDuplicateWarning(warnings.join(', '));
    } else {
      setDuplicateWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (vendor) {
      await updateVendor.mutateAsync({
        id: vendor.id,
        data: formData,
      });
    } else {
      await createVendor.mutateAsync(formData);
    }

    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>
            {vendor ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="contacts" disabled={!vendor}>
              İletişim Kişileri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {duplicateWarning && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ {duplicateWarning}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kod</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="TEDARİK-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">İsim *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Vergi No</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    onBlur={handleCheckDuplicate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Değerlendirme (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Ülke</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger id="country" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms_days">Ödeme Vadesi (Gün)</Label>
                  <Input
                    id="payment_terms_days"
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Ödeme Şartları</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="30 gün vade, %2 erken ödeme indirimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incoterm">Incoterm</Label>
                  <Input
                    id="incoterm"
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    placeholder="FOB, CIF, EXW, vb."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_lead_days">Teslimat Süresi (Gün)</Label>
                  <Input
                    id="delivery_lead_days"
                    type="number"
                    value={formData.delivery_lead_days || ''}
                    onChange={(e) => setFormData({ ...formData, delivery_lead_days: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Etiketler</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Etiket ekle ve Enter'a bas"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Ekle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createVendor.isPending || updateVendor.isPending}
                >
                  {vendor ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            {vendor && <VendorContactsManager vendorId={vendor.id} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
