
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Proposal } from "@/types/proposal";

interface OrderPaymentInfoProps {
  proposal: Proposal | null;
}

const OrderPaymentInfo: React.FC<OrderPaymentInfoProps> = ({ proposal }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Ödeme ve Teslimat Bilgileri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Ödeme Yöntemi</Label>
              <Select defaultValue={proposal?.payment_method || "bank-transfer"}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Ödeme yöntemi seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Banka Transferi</SelectItem>
                  <SelectItem value="credit-card">Kredi Kartı</SelectItem>
                  <SelectItem value="cash">Nakit</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Ödeme Koşulları</Label>
              <Textarea 
                id="payment-terms" 
                placeholder="Ödeme koşullarını giriniz"
                defaultValue={proposal?.payment_terms || ""}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-method">Teslimat Yöntemi</Label>
              <Select defaultValue={proposal?.delivery_method || "standard"}>
                <SelectTrigger id="delivery-method">
                  <SelectValue placeholder="Teslimat yöntemi seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standart Kargo</SelectItem>
                  <SelectItem value="express">Hızlı Kargo</SelectItem>
                  <SelectItem value="pickup">Şubeden Teslim</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delivery-terms">Teslimat Koşulları</Label>
              <Textarea 
                id="delivery-terms" 
                placeholder="Teslimat koşullarını giriniz"
                defaultValue={proposal?.delivery_terms || ""}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderPaymentInfo;
