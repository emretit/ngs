import React, { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, CheckCircle, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServiceAssets() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cihaz Yönetimi</h1>
          <p className="text-muted-foreground">Müşteri cihazlarını ve varlıklarını yönetin</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Cihaz Ekle
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Kayıtlı cihaz</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Cihazlar</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Çalışır durumda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bakımda</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Bakım gerekli</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garanti Bitecek</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">30 gün içinde</p>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cihaz ara (model, seri no, müşteri)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cihaz Listesi */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="active">Aktif</TabsTrigger>
          <TabsTrigger value="maintenance">Bakımda</TabsTrigger>
          <TabsTrigger value="warranty">Garantili</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Cihazlar</CardTitle>
              <CardDescription>Sistemde kayıtlı tüm cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz cihaz eklenmemiş</h3>
                <p className="text-muted-foreground mb-4">
                  Müşteri cihazlarını takip etmek için yeni bir cihaz ekleyin.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Cihazı Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Cihazlar</CardTitle>
              <CardDescription>Çalışır durumda olan cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Aktif cihaz bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bakımdaki Cihazlar</CardTitle>
              <CardDescription>Bakım veya onarım gerektiren cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Bakımda cihaz bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warranty" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Garantili Cihazlar</CardTitle>
              <CardDescription>Garanti kapsamındaki cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Garantili cihaz bulunamadı</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







