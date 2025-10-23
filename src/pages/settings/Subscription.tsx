import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Check, Calendar, AlertCircle, Sparkles } from "lucide-react";
import { IyzicoPaymentForm } from "@/components/payments/IyzicoPaymentForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

// Paket bilgileri - bu bilgiler backend'den de gelebilir
const subscriptionPlans = [
  {
    id: "free",
    name: "Ücretsiz",
    monthlyPrice: 0,
    yearlyPrice: 0,
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
    monthlyPrice: 999,
    yearlyPrice: 9999,
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
    monthlyPrice: null,
    yearlyPrice: null,
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

const Subscription = ({ isCollapsed, setIsCollapsed }: SubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  
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
    console.log("Payment successful:", paymentId);
    setShowPaymentDialog(false);
    // Backend'e bildir ve aboneliği güncelle
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  const selectedPlanData = subscriptionPlans.find(p => p.id === selectedPlan);
  const selectedPlanPrice = selectedPlanData 
    ? (isYearly ? selectedPlanData.yearlyPrice : selectedPlanData.monthlyPrice) 
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
          
          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center gap-3 p-1 bg-muted rounded-full">
            <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-background shadow-sm' : ''}`}>
              Aylık
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-red-500"
            />
            <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isYearly ? 'bg-background shadow-sm' : ''}`}>
              Yıllık
            </span>
            {isYearly && (
              <Badge className="bg-red-500 text-white animate-pulse">
                2 Ay Ücretsiz
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan, index) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = currentSubscription.planId === plan.id;
            
            return (
              <div
                key={plan.id}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card 
                  className={`relative h-full transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                    plan.popular 
                      ? 'border-2 border-red-500 shadow-2xl shadow-red-500/20' 
                      : 'border border-border hover:border-red-300 hover:shadow-xl'
                  } ${
                    isCurrentPlan ? 'bg-gradient-to-br from-red-50 to-white' : 'bg-card'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 text-sm font-semibold shadow-lg animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1 inline" />
                        En Popüler
                      </Badge>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300">
                        Mevcut Paketiniz
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    
                    {/* Price Container */}
                    <div className="mt-6 flex items-baseline gap-2">
                      {price !== null ? (
                        <>
                          <span className="text-5xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                            ₺{price.toLocaleString('tr-TR')}
                          </span>
                          <span className="text-muted-foreground text-lg">
                            /{isYearly ? 'yıl' : 'ay'}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-foreground">
                          Özel Fiyat
                        </span>
                      )}
                    </div>
                    
                    {isYearly && price && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Aylık ₺{Math.round(price / 12).toLocaleString('tr-TR')} (₺{((plan.monthlyPrice! * 12) - price).toLocaleString('tr-TR')} tasarruf)
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 group/item">
                          <div className="mt-0.5 rounded-full bg-red-100 p-1 transition-all group-hover/item:bg-red-200">
                            <Check className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Action Button */}
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button 
                          variant="outline" 
                          className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50" 
                          disabled
                        >
                          Mevcut Paket
                        </Button>
                      ) : price === null ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all"
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          Teklif Al
                        </Button>
                      ) : (
                        <Button 
                          className={`w-full transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                              : 'border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
                          }`}
                          onClick={() => handleUpgrade(plan.id)}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          Bu Pakete Geç
                        </Button>
                      )}
                    </div>
                  </CardContent>

                  {/* Bottom Accent */}
                  {plan.popular && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-b-lg" />
                  )}
                </Card>
              </div>
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
              basketId={`subscription-${selectedPlanData.id}-${isYearly ? 'yearly' : 'monthly'}-${Date.now()}`}
              basketItems={[
                {
                  id: selectedPlanData.id,
                  name: `${selectedPlanData.name} Paketi - ${isYearly ? 'Yıllık' : 'Aylık'} Abonelik`,
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
