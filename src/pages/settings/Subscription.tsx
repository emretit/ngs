import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Check, Calendar, AlertCircle } from "lucide-react";
import { IyzicoPaymentForm } from "@/components/payments/IyzicoPaymentForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

// Paket bilgileri
const subscriptionPlans = [
  {
    id: "free",
    name: "Ücretsiz",
    basePrice: 0,
    features: [
      "1 Kullanıcı",
      "Temel CRM Özellikleri",
      "5 GB Depolama",
      "Email Desteği",
      "Temel Raporlama"
    ]
  },
  {
    id: "business",
    name: "İşletme",
    basePrice: 999,
    popular: true,
    features: [
      "10 Kullanıcı",
      "Gelişmiş CRM",
      "Teklif & Sipariş Yönetimi",
      "E-Fatura Entegrasyonu",
      "50 GB Depolama",
      "Öncelikli Destek",
      "Özel Raporlar"
    ]
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    basePrice: null,
    features: [
      "Sınırsız Kullanıcı",
      "Tüm Özellikler",
      "API Erişimi",
      "Özel Entegrasyonlar",
      "Sınırsız Depolama",
      "7/24 Öncelikli Destek",
      "Özel Eğitim & Danışmanlık"
    ]
  }
];

// Süre seçenekleri ve indirim oranları
const durations = [
  { value: "1", label: "1 Ay", months: 1, discount: 0 },
  { value: "3", label: "3 Ay", months: 3, discount: 0.05 },
  { value: "6", label: "6 Ay", months: 6, discount: 0.10 },
  { value: "12", label: "12 Ay", months: 12, discount: 0.17 }
];

// Fiyat hesaplama fonksiyonu
const calculatePrice = (basePrice: number | null, months: number, discount: number) => {
  if (basePrice === null) return null;
  const totalPrice = basePrice * months;
  return Math.round(totalPrice * (1 - discount));
};

const Subscription = ({ isCollapsed, setIsCollapsed }: SubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [duration, setDuration] = useState("1");
  
  // Şu anki abonelik durumu - backend'den gelecek
  const currentSubscription = {
    planId: "business",
    planName: "İşletme",
    status: "active",
    startDate: "2025-01-01",
    nextBillingDate: "2025-02-01",
    amount: 999,
    isYearly: false
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    logger.debug("Payment successful:", paymentId);
    setShowPaymentDialog(false);
    // Backend'e bildir ve aboneliği güncelle
  };

  const handlePaymentError = (error: string) => {
    logger.error("Payment error:", error);
  };

  const selectedDuration = durations.find(d => d.value === duration)!;
  const selectedPlanData = subscriptionPlans.find(p => p.id === selectedPlan);
  const selectedPlanPrice = selectedPlanData 
    ? calculatePrice(selectedPlanData.basePrice, selectedDuration.months, selectedDuration.discount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Abonelik & Faturalama
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Paket yönetimi ve ödeme bilgileri
            </p>
          </div>
        </div>
      </div>

      {/* Mevcut Abonelik Durumu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mevcut Paketiniz</span>
            <Badge variant={currentSubscription.status === "active" ? "default" : "secondary"}>
              {currentSubscription.status === "active" ? "Aktif" : "Pasif"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Şu anki abonelik durumunuz ve faturalama bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Paket</p>
              <p className="text-lg font-semibold">{currentSubscription.planName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Aylık Tutar</p>
              <p className="text-lg font-semibold">{currentSubscription.amount} TRY</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Sonraki Fatura
              </p>
              <p className="text-lg font-semibold">
                {new Date(currentSubscription.nextBillingDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-900">
              Aboneliğiniz otomatik olarak yenilenecektir. İptal etmek için destek ekibiyle iletişime geçin.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setSelectedPlan(currentSubscription.planId);
                setShowPaymentDialog(true);
              }}
              className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <CreditCard className="h-4 w-4" />
              Ödeme Yap
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paket Seçenekleri */}
      <div>
        <div className="flex flex-col items-center mb-8 space-y-4">
          <h2 className="text-3xl font-bold text-center">Paket Yükseltme</h2>
          
          {/* Duration Tabs */}
          <Tabs value={duration} onValueChange={setDuration} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-4">
              {durations.map(d => (
                <TabsTrigger key={d.value} value={d.value} className="relative">
                  {d.label}
                  {d.discount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 px-1.5 text-[10px] bg-red-500">
                      -{Math.round(d.discount * 100)}%
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const price = calculatePrice(plan.basePrice, selectedDuration.months, selectedDuration.discount);
            const isCurrentPlan = currentSubscription.planId === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-md' 
                    : 'border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      En Popüler
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">
                      Mevcut Paket
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  
                  <div className="mt-4">
                    {price !== null ? (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold">
                            ₺{price.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-muted-foreground">
                            / {selectedDuration.label}
                          </span>
                        </div>
                        {selectedDuration.months > 1 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Aylık ₺{Math.round(price / selectedDuration.months).toLocaleString('tr-TR')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-3xl font-bold">Özel Fiyat</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-2">
                    {isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled
                      >
                        Mevcut Paket
                      </Button>
                    ) : price === null ? (
                      <Button 
                        className="w-full"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Teklif Al
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Bu Pakete Geç
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Fatura Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Fatura Geçmişi</CardTitle>
          <CardDescription>Son ödemeleriniz ve faturalarınız</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "2025-01-01", amount: 599, status: "paid", invoice: "INV-2025-001" },
              { date: "2024-12-01", amount: 599, status: "paid", invoice: "INV-2024-012" },
              { date: "2024-11-01", amount: 599, status: "paid", invoice: "INV-2024-011" },
            ].map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{payment.invoice}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{payment.amount} TRY</span>
                  <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                    {payment.status === "paid" ? "Ödendi" : "Beklemede"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    İndir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ödeme Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paket Yükseltme - {selectedPlanData?.name}</DialogTitle>
            <DialogDescription>
              {selectedPlanData?.name} paketine geçiş yapmak için ödeme bilgilerinizi girin
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlanData && selectedPlanPrice !== null && (
            <IyzicoPaymentForm
              amount={selectedPlanPrice}
              basketId={`subscription-${selectedPlanData.id}-${selectedDuration.months}months-${Date.now()}`}
              basketItems={[
                {
                  id: selectedPlanData.id,
                  name: `${selectedPlanData.name} Paketi - ${selectedDuration.label} Abonelik`,
                  category: "Subscription",
                  price: selectedPlanPrice,
                }
              ]}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
