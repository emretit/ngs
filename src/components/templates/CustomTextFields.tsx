import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { CustomTextField } from '@/types/pdf-template';

interface CustomTextFieldsProps {
  fields: CustomTextField[];
  onFieldsChange: (fields: CustomTextField[]) => void;
}

export const CustomTextFields: React.FC<CustomTextFieldsProps> = ({ fields, onFieldsChange }) => {
  const [newField, setNewField] = useState<Partial<CustomTextField>>({
    label: '',
    text: '',
    position: 'before-table',
    style: {
      fontSize: 12,
      align: 'left',
      bold: false,
      color: '#000000',
    },
  });

  const addField = () => {
    if (!newField.label || !newField.text) {
      return;
    }

    const field: CustomTextField = {
      id: crypto.randomUUID(),
      label: newField.label,
      text: newField.text,
      position: newField.position || 'before-table',
      style: {
        fontSize: newField.style?.fontSize || 12,
        align: newField.style?.align || 'left',
        bold: newField.style?.bold || false,
        color: newField.style?.color || '#000000',
      },
    };

    onFieldsChange([...fields, field]);
    setNewField({
      label: '',
      text: '',
      position: 'before-table',
      style: {
        fontSize: 12,
        align: 'left',
        bold: false,
        color: '#000000',
      },
    });
  };

  const updateField = (id: string, updates: Partial<CustomTextField>) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    );
    onFieldsChange(updatedFields);
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    onFieldsChange(updatedFields);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    onFieldsChange(updatedFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Özel Metin Alanları</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={!newField.label || !newField.text}
        >
          <Plus className="h-4 w-4 mr-2" />
          Alan Ekle
        </Button>
      </div>

      {/* Add New Field Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Yeni Alan Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Etiket</Label>
              <Input
                placeholder="Alan etiketi"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              />
            </div>
            <div>
              <Label>Pozisyon</Label>
              <Select
                value={newField.position}
                onValueChange={(value) => setNewField({ ...newField, position: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Başlık Altı</SelectItem>
                  <SelectItem value="before-table">Tablo Öncesi</SelectItem>
                  <SelectItem value="after-table">Tablo Sonrası</SelectItem>
                  <SelectItem value="footer">Alt Bilgi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Metin İçeriği</Label>
            <Textarea
              placeholder="Metin içeriğini girin"
              value={newField.text}
              onChange={(e) => setNewField({ ...newField, text: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Font Boyutu</Label>
              <Input
                type="number"
                min="8"
                max="24"
                value={newField.style?.fontSize || 12}
                onChange={(e) => setNewField({
                  ...newField,
                  style: { ...newField.style, fontSize: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Hizalama</Label>
              <Select
                value={newField.style?.align || 'left'}
                onValueChange={(value) => setNewField({
                  ...newField,
                  style: { ...newField.style, align: value as any }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sol</SelectItem>
                  <SelectItem value="center">Orta</SelectItem>
                  <SelectItem value="right">Sağ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Renk</Label>
              <Input
                type="color"
                value={newField.style?.color || '#000000'}
                onChange={(e) => setNewField({
                  ...newField,
                  style: { ...newField.style, color: e.target.value }
                })}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="new-field-bold"
              checked={newField.style?.bold || false}
              onCheckedChange={(checked) => setNewField({
                ...newField,
                style: { ...newField.style, bold: checked }
              })}
            />
            <Label htmlFor="new-field-bold">Kalın</Label>
          </div>
        </CardContent>
      </Card>

      {/* Existing Fields */}
      {fields.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Mevcut Alanlar</Label>
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-2">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Etiket</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pozisyon</Label>
                        <Select
                          value={field.position}
                          onValueChange={(value) => updateField(field.id, { position: value as any })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Başlık Altı</SelectItem>
                            <SelectItem value="before-table">Tablo Öncesi</SelectItem>
                            <SelectItem value="after-table">Tablo Sonrası</SelectItem>
                            <SelectItem value="footer">Alt Bilgi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Metin</Label>
                      <Textarea
                        value={field.text}
                        onChange={(e) => updateField(field.id, { text: e.target.value })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Font Boyutu</Label>
                        <Input
                          type="number"
                          min="8"
                          max="24"
                          value={field.style?.fontSize || 12}
                          onChange={(e) => updateField(field.id, {
                            style: { ...field.style, fontSize: parseInt(e.target.value) }
                          })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hizalama</Label>
                        <Select
                          value={field.style?.align || 'left'}
                          onValueChange={(value) => updateField(field.id, {
                            style: { ...field.style, align: value as any }
                          })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Sol</SelectItem>
                            <SelectItem value="center">Orta</SelectItem>
                            <SelectItem value="right">Sağ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Renk</Label>
                        <Input
                          type="color"
                          value={field.style?.color || '#000000'}
                          onChange={(e) => updateField(field.id, {
                            style: { ...field.style, color: e.target.value }
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`field-${field.id}-bold`}
                        checked={field.style?.bold || false}
                        onCheckedChange={(checked) => updateField(field.id, {
                          style: { ...field.style, bold: checked }
                        })}
                      />
                      <Label htmlFor={`field-${field.id}-bold`} className="text-xs">Kalın</Label>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};