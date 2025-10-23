import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Calendar, AlertCircle } from "lucide-react";
import { IyzicoPaymentForm } from "@/components/payments/IyzicoPaymentForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

// Paket bilgileri - bu bilgiler backend'den de gelebilir
const subscriptionPlans = [
  {
    id: "starter",
    name: "Başlangıç",
    price: 299,
    period: "ay",
    features: [
      "5 Kullanıcı",
      "Temel CRM",
      "Teklif & Sipariş Yönetimi",
      "Email Desteği"
    ]
  },
  {
    id: "professional",
    name: "Profesyonel",
    price: 599,
    period: "ay",
    popular: true,
    features: [
      "15 Kullanıcı",
      "Gelişmiş CRM",
      "Satın Alma Yönetimi",
      "E-Fatura Entegrasyonu",
      "Öncelikli Destek"
    ]
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    price: 999,
    period: "ay",
    features: [
      "Sınırsız Kullanıcı",
      "Tüm Özellikler",
      "API Erişimi",
      "Özel Entegrasyonlar",
      "7/24 Destek"
    ]
  }
];

const Subscription = ({ isCollapsed, setIsCollapsed }: SubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Şu anki abonelik durumu - backend'den gelecek
  const currentSubscription = {
    planId: "professional",
    planName: "Profesyonel",
    status: "active",
    startDate: "2025-01-01",
    nextBillingDate: "2025-02-01",
    amount: 599
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
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
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-900">
              Aboneliğiniz otomatik olarak yenilenecektir. İptal etmek için destek ekibiyle iletişime geçin.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setSelectedPlan(currentSubscription.planId);
                setShowPaymentDialog(true);
              }}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Ödeme Yap
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paket Seçenekleri */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Paket Yükseltme</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${
                currentSubscription.planId === plan.id ? 'bg-muted' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">En Popüler</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price} TRY</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {currentSubscription.planId === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Mevcut Paket
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Bu Pakete Geç
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
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
          
          {selectedPlanData && (
            <IyzicoPaymentForm
              amount={selectedPlanData.price}
              basketId={`subscription-${selectedPlanData.id}-${Date.now()}`}
              basketItems={[
                {
                  id: selectedPlanData.id,
                  name: `${selectedPlanData.name} Paketi - Aylık Abonelik`,
                  category: "Subscription",
                  price: selectedPlanData.price,
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
