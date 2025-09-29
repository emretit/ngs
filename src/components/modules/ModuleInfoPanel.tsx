import React from 'react';
import { X, ExternalLink, Clock, Users, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModuleInfo {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'development' | 'planned';
  features: string[];
  route?: string;
  users?: number;
  lastUpdated?: string;
}

interface ModuleInfoPanelProps {
  module: ModuleInfo | null;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

const moduleData: Record<string, ModuleInfo> = {
  'root': {
    id: 'root',
    label: 'Pafta.app',
    description: 'Entegre iş yönetim sistemi - CRM, ERP ve HR modüllerini tek platformda birleştiren kapsamlı çözüm.',
    status: 'active',
    features: ['Merkezi Dashboard', 'Kullanıcı Yönetimi', 'Raporlama', 'API Entegrasyonları'],
    users: 150,
    lastUpdated: '2024-01-15'
  },
  'crm': {
    id: 'crm',
    label: 'CRM',
    description: 'Müşteri İlişkileri Yönetimi - Satış süreçlerinizi optimize edin ve müşteri memnuniyetini artırın.',
    status: 'active',
    features: ['Lead Yönetimi', 'Satış Pipeline', 'Müşteri Takibi', 'Rapor ve Analiz'],
    users: 45,
    lastUpdated: '2024-01-10'
  },
  'erp': {
    id: 'erp',
    label: 'ERP',
    description: 'Kurumsal Kaynak Planlama - İş süreçlerinizi entegre edin ve verimliliği artırın.',
    status: 'active',
    features: ['Stok Yönetimi', 'Satın Alma', 'Finansal Kontrol', 'Raporlama'],
    users: 78,
    lastUpdated: '2024-01-12'
  },
  'hr': {
    id: 'hr',
    label: 'HR',
    description: 'İnsan Kaynakları Yönetimi - Çalışan süreçlerinizi dijitalleştirin ve yönetin.',
    status: 'development',
    features: ['Personel Takibi', 'Bordro Yönetimi', 'İzin Planlaması', 'Performans Değerlendirme'],
    users: 25,
    lastUpdated: '2024-01-08'
  },
  'crm-customers': {
    id: 'crm-customers',
    label: 'Müşteri Yönetimi',
    description: 'Müşteri bilgilerini merkezi olarak yönetin, iletişim geçmişini takip edin.',
    status: 'active',
    features: ['Müşteri Profilleri', 'İletişim Geçmişi', 'Segmentasyon', 'Aktivite Takibi'],
    route: '/contacts',
    users: 42,
    lastUpdated: '2024-01-09'
  },
  'crm-opportunities': {
    id: 'crm-opportunities',
    label: 'Fırsatlar',
    description: 'Satış fırsatlarını takip edin, potansiyel geliri analiz edin.',
    status: 'active',
    features: ['Fırsat Pipeline', 'Tahmin Analizi', 'Takım Yönetimi', 'Raporlama'],
    route: '/opportunities',
    users: 35,
    lastUpdated: '2024-01-11'
  },
  'crm-proposals': {
    id: 'crm-proposals',
    label: 'Teklifler',
    description: 'Profesyonel teklifler oluşturun, onay süreçlerini yönetin.',
    status: 'active',
    features: ['Teklif Editörü', 'Şablon Yönetimi', 'Onay Akışı', 'Dijital İmza'],
    route: '/proposals',
    users: 28,
    lastUpdated: '2024-01-07'
  },
  'erp-purchasing': {
    id: 'erp-purchasing',
    label: 'Satın Alma',
    description: 'Satın alma süreçlerinizi optimize edin, tedarikçi ilişkilerini yönetin.',
    status: 'active',
    features: ['Talep Yönetimi', 'Tedarikçi Karşılaştırma', 'Sipariş Takibi', 'Bütçe Kontrolü'],
    route: '/purchase',
    users: 32,
    lastUpdated: '2024-01-13'
  },
  'erp-inventory': {
    id: 'erp-inventory',
    label: 'Stok/Depo',
    description: 'Stok seviyelerini takip edin, depo operasyonlarını yönetin.',
    status: 'planned',
    features: ['Stok Takibi', 'Depo Yönetimi', 'Minimum Stok Uyarıları', 'Hareket Geçmişi'],
    users: 0,
    lastUpdated: '2024-01-01'
  },
  'erp-cashflow': {
    id: 'erp-cashflow',
    label: 'Nakit Akış',
    description: 'Finansal durumunuzu takip edin, nakit akışınızı yönetin.',
    status: 'active',
    features: ['Gelir/Gider Takibi', 'Tahsilat Yönetimi', 'Ödeme Planlaması', 'Finansal Raporlar'],
    route: '/cashflow',
    users: 18,
    lastUpdated: '2024-01-14'
  },
  'hr-employees': {
    id: 'hr-employees',
    label: 'Çalışanlar',
    description: 'Personel bilgilerini yönetin, organizasyon şemanızı oluşturun.',
    status: 'active',
    features: ['Personel Profilleri', 'Organizasyon Şeması', 'Yetkinlik Takibi', 'Dökümanlar'],
    route: '/employees',
    users: 23,
    lastUpdated: '2024-01-06'
  },
  'hr-leaves': {
    id: 'hr-leaves',
    label: 'İzinler',
    description: 'Çalışan izin taleplerini yönetin, izin planlaması yapın.',
    status: 'development',
    features: ['İzin Talepleri', 'Onay Süreçleri', 'İzin Planlaması', 'Raporlama'],
    users: 0,
    lastUpdated: '2024-01-01'
  },
  'hr-payroll': {
    id: 'hr-payroll',
    label: 'Bordro',
    description: 'Maaş hesaplamaları, bordro yönetimi ve ödemeleri takip edin.',
    status: 'planned',
    features: ['Maaş Hesaplama', 'Kesinti Yönetimi', 'Bordro Raporları', 'Ödeme Takibi'],
    users: 0,
    lastUpdated: '2024-01-01'
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'development': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    case 'planned': return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif';
    case 'development': return 'Geliştirme';
    case 'planned': return 'Planlanıyor';
    default: return 'Bilinmiyor';
  }
};

export const ModuleInfoPanel: React.FC<ModuleInfoPanelProps> = ({ module, onClose, onNavigate }) => {
  if (!module) return null;

  const moduleInfo = moduleData[module.id] || module;

  return (
    <div className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-20 animate-scale-in">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{moduleInfo.label}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(moduleInfo.status)}>
            {getStatusText(moduleInfo.status)}
          </Badge>
          {moduleInfo.users !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {moduleInfo.users} kullanıcı
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {moduleInfo.description}
        </p>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Özellikler:</h4>
          <ul className="space-y-1">
            {moduleInfo.features.map((feature, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {moduleInfo.lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Clock className="h-3 w-3" />
            Son güncelleme: {new Date(moduleInfo.lastUpdated).toLocaleDateString('tr-TR')}
          </div>
        )}

        {moduleInfo.route && onNavigate && (
          <Button 
            onClick={() => onNavigate(moduleInfo.route!)} 
            className="w-full"
            size="sm"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Modülü Aç
          </Button>
        )}
      </div>
    </div>
  );
};