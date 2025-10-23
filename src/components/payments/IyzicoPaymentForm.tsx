import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PaymentFormData {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  buyerName: string;
  buyerSurname: string;
  buyerEmail: string;
  buyerPhone: string;
  identityNumber: string;
  address: string;
  city: string;
}

interface IyzicoPaymentFormProps {
  amount: number;
  basketId: string;
  basketItems: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function IyzicoPaymentForm({ 
  amount, 
  basketId, 
  basketItems,
  onSuccess,
  onError 
}: IyzicoPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormData>();

  const onSubmit = async (data: PaymentFormData) => {
    setIsProcessing(true);

    try {
      // Prepare payment request
      const paymentRequest = {
        price: amount.toFixed(2),
        paidPrice: amount.toFixed(2),
        currency: "TRY",
        basketId: basketId,
        paymentCard: {
          cardHolderName: data.cardHolderName,
          cardNumber: data.cardNumber.replace(/\s/g, ''),
          expireMonth: data.expireMonth,
          expireYear: data.expireYear,
          cvc: data.cvc,
        },
        buyer: {
          id: basketId,
          name: data.buyerName,
          surname: data.buyerSurname,
          email: data.buyerEmail,
          identityNumber: data.identityNumber,
          registrationAddress: data.address,
          city: data.city,
          country: "Turkey",
        },
        shippingAddress: {
          contactName: `${data.buyerName} ${data.buyerSurname}`,
          city: data.city,
          country: "Turkey",
          address: data.address,
        },
        billingAddress: {
          contactName: `${data.buyerName} ${data.buyerSurname}`,
          city: data.city,
          country: "Turkey",
          address: data.address,
        },
        basketItems: basketItems.map(item => ({
          id: item.id,
          name: item.name,
          category1: item.category,
          itemType: "PHYSICAL",
          price: item.price.toFixed(2),
        })),
      };

      // Call edge function
      const { data: result, error } = await supabase.functions.invoke('iyzico-payment', {
        body: paymentRequest,
      });

      if (error) throw error;

      if (result.success) {
        toast({
          title: "Ödeme Başarılı",
          description: `Ödeme işleminiz başarıyla tamamlandı. İşlem No: ${result.paymentId}`,
        });
        onSuccess?.(result.paymentId);
      } else {
        throw new Error(result.error || "Ödeme işlemi başarısız");
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || "Ödeme işlemi sırasında bir hata oluştu";
      toast({
        title: "Ödeme Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Güvenli Ödeme
        </CardTitle>
        <CardDescription>
          Ödeme tutarı: {amount.toFixed(2)} TRY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Kart Bilgileri */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Kart Bilgileri
            </h3>
            
            <div>
              <Label htmlFor="cardHolderName">Kart Üzerindeki İsim</Label>
              <Input
                id="cardHolderName"
                {...register("cardHolderName", { required: "Kart sahibi adı gerekli" })}
                placeholder="AD SOYAD"
              />
              {errors.cardHolderName && (
                <p className="text-sm text-red-500 mt-1">{errors.cardHolderName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cardNumber">Kart Numarası</Label>
              <Input
                id="cardNumber"
                {...register("cardNumber", { 
                  required: "Kart numarası gerekli",
                  pattern: {
                    value: /^[\d\s]{16,19}$/,
                    message: "Geçerli bir kart numarası girin"
                  }
                })}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.cardNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expireMonth">Ay</Label>
                <Input
                  id="expireMonth"
                  {...register("expireMonth", { required: true })}
                  placeholder="MM"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="expireYear">Yıl</Label>
                <Input
                  id="expireYear"
                  {...register("expireYear", { required: true })}
                  placeholder="YY"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  {...register("cvc", { required: true })}
                  placeholder="123"
                  maxLength={3}
                  type="password"
                />
              </div>
            </div>
          </div>

          {/* Alıcı Bilgileri */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Alıcı Bilgileri</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">Ad</Label>
                <Input
                  id="buyerName"
                  {...register("buyerName", { required: "Ad gerekli" })}
                />
              </div>
              <div>
                <Label htmlFor="buyerSurname">Soyad</Label>
                <Input
                  id="buyerSurname"
                  {...register("buyerSurname", { required: "Soyad gerekli" })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="buyerEmail">E-posta</Label>
              <Input
                id="buyerEmail"
                type="email"
                {...register("buyerEmail", { required: "E-posta gerekli" })}
              />
            </div>

            <div>
              <Label htmlFor="identityNumber">TC Kimlik No</Label>
              <Input
                id="identityNumber"
                {...register("identityNumber", { required: "TC Kimlik No gerekli" })}
                maxLength={11}
              />
            </div>

            <div>
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                {...register("address", { required: "Adres gerekli" })}
              />
            </div>

            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                {...register("city", { required: "Şehir gerekli" })}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? "İşleminiz Gerçekleştiriliyor..." : `${amount.toFixed(2)} TRY Öde`}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ödeme işleminiz iyzico güvencesi altında gerçekleştirilmektedir.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
