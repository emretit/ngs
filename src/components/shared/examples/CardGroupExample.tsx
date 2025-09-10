// CardGroup kullanım örnekleri
import React, { useState } from "react";
import {
  EnhancedCard,
  StructuredCard,
  SummaryCard,
  InfoCard,
  CardGrid,
  StatsCard,
  ButtonGroup,
  PrimaryButton,
  SecondaryButton,
  IconButton,
} from "../index";
import { CardContent } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";

export function CardGroupExample() {
  const [dismissedCards, setDismissedCards] = useState<string[]>([]);

  const handleDismiss = (cardId: string) => {
    setDismissedCards(prev => [...prev, cardId]);
  };

  const isDismissed = (cardId: string) => dismissedCards.includes(cardId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          CardGroup Bileşenleri Örneği
        </h1>
        <p className="text-gray-600">
          Farklı kart türleri ve kullanım senaryoları
        </p>
      </div>

      {/* Summary Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">1. Dashboard Summary Cards</h2>
        <CardGrid columns={4} gap={4}>
          <SummaryCard
            title="Toplam Müşteri"
            value={1234}
            subtitle="Aktif müşteriler"
            icon={Users}
            color="blue"
            trend={{
              value: 12.5,
              label: "bu ay",
              direction: "up"
            }}
            onClick={() => console.log("Müşteriler clicked")}
          />
          
          <SummaryCard
            title="Ürün Sayısı"
            value={567}
            subtitle="Stokta mevcut"
            icon={Package}
            color="green"
            trend={{
              value: 8.2,
              label: "geçen aya göre",
              direction: "up"
            }}
          />
          
          <SummaryCard
            title="Toplam Satış"
            value="₺485.2K"
            subtitle="Bu ay"
            icon={DollarSign}
            color="purple"
            trend={{
              value: 3.1,
              label: "geçen ay",
              direction: "down"
            }}
          />
          
          <SummaryCard
            title="Bekleyen Siparişler"
            value={89}
            subtitle="İşlem bekliyor"
            icon={ShoppingCart}
            color="orange"
            trend={{
              value: 15.7,
              label: "bu hafta",
              direction: "up"
            }}
          />
        </CardGrid>
      </section>

      {/* Structured Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">2. Structured Cards with Actions</h2>
        <CardGrid columns={2} gap={6}>
          <StructuredCard
            title="Proje Yönetimi"
            description="Aktif projelerinizi yönetin ve takip edin"
            icon={Settings}
            actions={
              <ButtonGroup spacing="tight">
                <IconButton icon={Eye} size="sm" tooltip="Görüntüle" />
                <IconButton icon={Edit} size="sm" tooltip="Düzenle" />
                <IconButton icon={MoreHorizontal} size="sm" tooltip="Daha fazla" />
              </ButtonGroup>
            }
            footer={
              <ButtonGroup align="end">
                <SecondaryButton size="sm">Detaylar</SecondaryButton>
                <PrimaryButton size="sm">Başlat</PrimaryButton>
              </ButtonGroup>
            }
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tamamlanan</span>
                <span className="font-medium">12/15</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="text-xs text-gray-500">Son güncelleme: 2 saat önce</div>
            </div>
          </StructuredCard>

          <StructuredCard
            title="İstatistikler"
            description="Aylık performans özeti"
            icon={TrendingUp}
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+24%</div>
                  <div className="text-sm text-gray-600">Artış</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-600">Yeni Kayıt</div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center">
                  Veriler son 30 gün için hesaplanmıştır
                </div>
              </div>
            </div>
          </StructuredCard>
        </CardGrid>
      </section>

      {/* Info Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">3. Info Cards</h2>
        <div className="space-y-3">
          {!isDismissed('info') && (
            <InfoCard
              type="info"
              title="Bilgilendirme"
              icon={Info}
              dismissible
              onDismiss={() => handleDismiss('info')}
              content={
                <p>
                  Yeni özellikler hakkında bilgi almak için 
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    dokümantasyonu
                  </a> 
                  inceleyin.
                </p>
              }
            />
          )}

          {!isDismissed('warning') && (
            <InfoCard
              type="warning"
              title="Dikkat"
              icon={AlertTriangle}
              dismissible
              onDismiss={() => handleDismiss('warning')}
              content="Bu işlem geri alınamaz. Devam etmeden önce emin olun."
            />
          )}

          {!isDismissed('success') && (
            <InfoCard
              type="success"
              title="Başarılı"
              icon={CheckCircle}
              dismissible
              onDismiss={() => handleDismiss('success')}
              content="İşlem başarıyla tamamlandı. Değişiklikler kaydedildi."
            />
          )}

          {!isDismissed('error') && (
            <InfoCard
              type="error"
              title="Hata"
              icon={XCircle}
              dismissible
              onDismiss={() => handleDismiss('error')}
              content="Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin."
            />
          )}
        </div>
      </section>

      {/* Stats Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">4. Stats Card</h2>
        <StatsCard
          title="Haftalık Performans"
          description="Son 7 günün detaylı analizi"
          stats={[
            {
              label: "Ziyaretçi",
              value: 12534,
              subValue: "+12% artış",
              color: "blue"
            },
            {
              label: "Satış",
              value: "₺84.2K",
              subValue: "+8% artış",
              color: "green"
            },
            {
              label: "Conversion",
              value: "3.24%",
              subValue: "-2% düşüş",
              color: "orange"
            },
            {
              label: "ROI",
              value: "187%",
              subValue: "+15% artış",
              color: "purple"
            },
            {
              label: "Müşteri",
              value: 892,
              subValue: "+24% artış",
              color: "red"
            },
            {
              label: "Geri Dönüş",
              value: "4.1 gün",
              subValue: "-1.2 gün",
              color: "gray"
            }
          ]}
        />
      </section>

      {/* Enhanced Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">5. Enhanced Card Variants</h2>
        <CardGrid columns={3} gap={4}>
          <EnhancedCard variant="default" hoverable>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Default Card</h3>
              <p className="text-sm text-gray-600 mt-1">
                Standard border ve background
              </p>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard variant="outlined" hoverable>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Outlined Card</h3>
              <p className="text-sm text-gray-600 mt-1">
                Kalın border ile vurgu
              </p>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard variant="elevated" hoverable>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Elevated Card</h3>
              <p className="text-sm text-gray-600 mt-1">
                Gölge efekti ile derinlik
              </p>
            </CardContent>
          </EnhancedCard>
        </CardGrid>
      </section>

      {/* Grid Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">6. Farklı Grid Düzenleri</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">2 Kolon Grid</h3>
            <CardGrid columns={2} gap={3}>
              {[1, 2].map(i => (
                <EnhancedCard key={i}>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-semibold">Kart {i}</div>
                  </CardContent>
                </EnhancedCard>
              ))}
            </CardGrid>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">5 Kolon Grid</h3>
            <CardGrid columns={5} gap={2}>
              {[1, 2, 3, 4, 5].map(i => (
                <EnhancedCard key={i} variant="flat">
                  <CardContent className="p-3 text-center">
                    <div className="text-sm font-medium">#{i}</div>
                  </CardContent>
                </EnhancedCard>
              ))}
            </CardGrid>
          </div>
        </div>
      </section>
    </div>
  );
}
