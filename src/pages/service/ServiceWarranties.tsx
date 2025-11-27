import React, { useState } from 'react';
import { Plus, Search, CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServiceWarranties() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Garanti Takibi</h1>
          <p className="text-muted-foreground">Cihaz garantilerini izleyin ve yönetin</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Garanti Kaydı
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Garanti</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Kayıtlı garanti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Garantiler</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Geçerli</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitecek Garantiler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">30 gün içinde</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Biten</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>
      </div>

      {/* Arama */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Garanti ara (müşteri, cihaz, seri no)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Garanti Listesi */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="expiring">Bitecek</TabsTrigger>
          <TabsTrigger value="expired">Süresi Biten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Garantiler</CardTitle>
              <CardDescription>Sistemde kayıtlı tüm garanti bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz garanti kaydı eklenmemiş</h3>
                <p className="text-muted-foreground mb-4">
                  Cihaz garantilerini takip etmek için yeni bir garanti kaydı ekleyin.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Garanti Kaydını Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Garantiler</CardTitle>
              <CardDescription>Geçerli garanti kapsamındaki cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Aktif garanti bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bitecek Garantiler</CardTitle>
              <CardDescription>30 gün içinde süresi bitecek garantiler</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Bitecek garanti bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Süresi Biten Garantiler</CardTitle>
              <CardDescription>Garanti süresi dolmuş cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Süresi biten garanti bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







