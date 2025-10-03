import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Users
} from "lucide-react";
import { usePurchaseRequests } from "@/hooks/usePurchasing";
import { useNavigate } from "react-router-dom";

const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { data: requests, isLoading } = usePurchaseRequests();

  // Calculate stats - memoized to prevent recalculation
  const stats = useMemo(() => ({
    draft: requests?.filter(r => r.status === 'draft').length || 0,
    pending: requests?.filter(r => r.status === 'submitted').length || 0,
    approved: requests?.filter(r => r.status === 'approved').length || 0,
    rejected: requests?.filter(r => r.status === 'rejected').length || 0,
  }), [requests]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma</h1>
          <p className="text-muted-foreground">Talep ve onay süreçlerini yönetin</p>
        </div>
        <Button onClick={() => navigate('/suppliers')} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Tedarikçiler
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Taslak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.draft}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Bekleyen Onaylar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Onaylanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reddedilen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Hızlı Başlangıç
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Satın alma modülüne hoş geldiniz! Buradan:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
              <span><strong>Talepler</strong> menüsünden yeni satın alma talebi oluşturabilirsiniz</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
              <span><strong>Bekleyen Onaylar</strong> sekmesinden size atanan onayları görebilirsiniz</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
              <span>Onaylanan talepler <strong>Sipariş</strong> olarak dönüştürülebilir</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PurchasingDashboard);
