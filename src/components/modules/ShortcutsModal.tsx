import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Search, Maximize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ open, onClose }) => {
  const shortcuts = [
    {
      category: 'Genel',
      icon: <Keyboard className="h-4 w-4" />,
      items: [
        { keys: ['?'], description: 'Bu yardım penceresini aç/kapat' },
        { keys: ['Esc'], description: 'Seçimi temizle / Modal kapat' },
      ]
    },
    {
      category: 'Arama & Filtreleme',
      icon: <Search className="h-4 w-4" />,
      items: [
        { keys: ['Ctrl', 'F'], description: 'Arama kutusuna odaklan' },
        { keys: ['Cmd', 'F'], description: 'Arama kutusuna odaklan (Mac)' },
      ]
    },
    {
      category: 'Görünüm Kontrolü',
      icon: <Maximize className="h-4 w-4" />,
      items: [
        { keys: ['F'], description: 'Görünümü tüm modüllere sığdır' },
        { keys: ['0'], description: 'Zoom\'u sıfırla (100%)' },
        { keys: ['+'], description: 'Yakınlaştır' },
        { keys: ['-'], description: 'Uzaklaştır' },
      ]
    },
    {
      category: 'Etkileşim',
      icon: <RotateCcw className="h-4 w-4" />,
      items: [
        { keys: ['Tıkla'], description: 'Modül seç ve detayları göster' },
        { keys: ['Sürükle'], description: 'Haritayı hareket ettir' },
        { keys: ['Scroll'], description: 'Yakınlaştır/Uzaklaştır' },
      ]
    }
  ];

  const KeyBadge = ({ keyname }: { keyname: string }) => (
    <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
      {keyname}
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Klavye Kısayolları
          </DialogTitle>
          <DialogDescription>
            Modül ağacında daha hızlı gezinmek için bu kısayolları kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                {category.icon}
                {category.category}
              </h3>
              
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <span className="text-sm">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="text-xs text-muted-foreground mx-1">+</span>}
                          <KeyBadge keyname={key} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {categoryIndex < shortcuts.length - 1 && <Separator />}
            </div>
          ))}

          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              İpuçları
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Arama yaparken hem modül adları hem de etiketler taranır</li>
              <li>• Filtreler birbirleriyle kombine edilebilir</li>
              <li>• Seviye kontrolü ile ağacın derinliğini sınırlayabilirsiniz</li>
              <li>• Mini harita üzerinden hızlıca farklı bölgelere geçebilirsiniz</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};