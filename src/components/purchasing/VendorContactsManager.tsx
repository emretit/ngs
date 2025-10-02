import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useVendorContacts,
  useCreateVendorContact,
  useUpdateVendorContact,
  useDeleteVendorContact,
  type VendorContact,
} from '@/hooks/useVendors';

interface VendorContactsManagerProps {
  vendorId: string;
}

export function VendorContactsManager({ vendorId }: VendorContactsManagerProps) {
  const { data: contacts = [], isLoading } = useVendorContacts(vendorId);
  const createContact = useCreateVendorContact();
  const updateContact = useUpdateVendorContact();
  const deleteContact = useDeleteVendorContact();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<VendorContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    is_primary: false,
    notes: '',
  });

  const handleOpenDialog = (contact?: VendorContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        role: contact.role || '',
        is_primary: contact.is_primary,
        notes: contact.notes || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        is_primary: false,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingContact) {
      await updateContact.mutateAsync({
        id: editingContact.id,
        vendorId,
        data: formData,
      });
    } else {
      await createContact.mutateAsync({
        vendor_id: vendorId,
        ...formData,
      });
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu iletişim kişisini silmek istediğinizden emin misiniz?')) {
      await deleteContact.mutateAsync({ id, vendorId });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">İletişim Kişileri</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Kişi Ekle
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Henüz iletişim kişisi eklenmemiş
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Birincil</TableHead>
              <TableHead>İsim</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  {contact.is_primary && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email || '-'}</TableCell>
                <TableCell>{contact.phone || '-'}</TableCell>
                <TableCell>{contact.role || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(contact)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'İletişim Kişisini Düzenle' : 'Yeni İletişim Kişisi'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Örn: Satış Müdürü"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_primary: checked as boolean })
                }
              />
              <Label htmlFor="is_primary">Birincil iletişim kişisi</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                İptal
              </Button>
              <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
                {editingContact ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
