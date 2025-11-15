import { useState } from 'react';
import { EmbeddedAIAnalysis } from '@/components/ai/EmbeddedAIAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';

export default function EmbeddedAIDemo() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Gömülü AI Analiz Sistemi
          </CardTitle>
            <CardDescription>
              Supabase verilerinizi Groq AI ile analiz edin.
              Hızlı ve güvenilir AI analizi için Groq API kullanılıyor.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <strong>Özellikler:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>✅ Groq API kullanıyor - çok hızlı yanıtlar</li>
                  <li>✅ Ücretsiz tier mevcut (dakikada 30 istek)</li>
                  <li>✅ Model indirme gerektirmez - anında çalışır</li>
                  <li>✅ Supabase verilerinizi otomatik analiz eder</li>
                  <li>✅ Türkçe yanıtlar verir</li>
                </ul>
              </div>
              <div>
                <strong>Not:</strong> Groq API key gereklidir. .env dosyanızda VITE_GROQ_API_KEY ayarlayın.
                Ücretsiz Groq hesabı oluşturmak için: https://console.groq.com
              </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="proposals">Teklifler</TabsTrigger>
          <TabsTrigger value="orders">Siparişler</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <EmbeddedAIAnalysis
            tableName="customers"
            title="Müşteri Verileri Analizi"
            query={{
              select: "id, name, email, company, created_at, type",
              limit: 100
            }}
          />
        </TabsContent>

        <TabsContent value="products">
          <EmbeddedAIAnalysis
            tableName="products"
            title="Ürün Verileri Analizi"
            query={{
              select: "id, name, price, stock_quantity, tax_rate, unit, currency",
              limit: 100
            }}
          />
        </TabsContent>

        <TabsContent value="proposals">
          <EmbeddedAIAnalysis
            tableName="proposals"
            title="Teklif Verileri Analizi"
            query={{
              select: "id, customer_id, total_amount, status, created_at, currency",
              limit: 100
            }}
          />
        </TabsContent>

        <TabsContent value="orders">
          <EmbeddedAIAnalysis
            tableName="orders"
            title="Sipariş Verileri Analizi"
            query={{
              select: "id, customer_id, total_amount, status, created_at",
              limit: 100
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

