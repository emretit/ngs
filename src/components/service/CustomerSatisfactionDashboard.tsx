import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCustomerSatisfaction, useRecentRatings } from '@/hooks/service/useCustomerSatisfaction';
import { 
  Star, 
  TrendingUp, 
  MessageSquare,
  Award,
  Users,
  Calendar
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatDate } from '@/utils/dateUtils';

export const CustomerSatisfactionDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: satisfaction, isLoading } = useCustomerSatisfaction(startDate, endDate);
  const { data: recentRatings } = useRecentRatings(10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!satisfaction || satisfaction.totalRatings === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Henüz müşteri değerlendirmesi bulunmuyor</p>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rating >= 2.5) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setEndDate(new Date());
              }}
            >
              Bu Ay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Ortalama Puan
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {satisfaction.averageRating.toFixed(1)}/5
            </div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(satisfaction.averageRating)}
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {satisfaction.totalRatings} değerlendirme
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Toplam Değerlendirme
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {satisfaction.totalRatings}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Müşteri değerlendirmesi
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Geri Bildirim
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {satisfaction.totalFeedback}
            </div>
            <p className="text-xs text-green-700 mt-1">
              Yazılı geri bildirim
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              Pozitif Oran
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {satisfaction.ratingDistribution
                .filter((r) => r.rating >= 4)
                .reduce((sum, r) => sum + r.percentage, 0)
                .toFixed(1)}%
            </div>
            <p className="text-xs text-purple-700 mt-1">
              4+ yıldız değerlendirme
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <span>Puan Dağılımı</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {satisfaction.ratingDistribution
              .slice()
              .reverse()
              .map((dist) => (
                <div key={dist.rating}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dist.rating} Yıldız</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: dist.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{dist.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({dist.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={dist.percentage} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Technicians by Rating */}
      {satisfaction.averageRatingByTechnician.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>En Yüksek Puanlı Teknisyenler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfaction.averageRatingByTechnician.slice(0, 5).map((tech, index) => (
                <div
                  key={tech.technicianId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{tech.technicianName}</div>
                      <div className="text-xs text-muted-foreground">
                        {tech.count} değerlendirme
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(tech.averageRating)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getRatingColor(tech.averageRating)}`}
                    >
                      {tech.averageRating.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings */}
      {recentRatings && recentRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Son Değerlendirmeler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRatings.map((rating) => (
                <div
                  key={rating.serviceId}
                  className="p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{rating.serviceTitle}</div>
                      {rating.customerName && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Müşteri: {rating.customerName}
                        </div>
                      )}
                      {rating.technicianName && (
                        <div className="text-xs text-muted-foreground">
                          Teknisyen: {rating.technicianName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(rating.rating)}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getRatingColor(rating.rating)}`}
                      >
                        {rating.rating}
                      </Badge>
                    </div>
                  </div>
                  {rating.feedback && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {rating.feedback}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDate(rating.completedDate)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {satisfaction.trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>Aylık Memnuniyet Trendi</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfaction.trendData.map((trend) => (
                <div key={trend.month} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{trend.month}</span>
                    <Badge variant="outline">{trend.count} değerlendirme</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(trend.averageRating)}
                    </div>
                    <span className="text-sm font-bold">
                      {trend.averageRating.toFixed(1)}/5
                    </span>
                    <Progress
                      value={(trend.averageRating / 5) * 100}
                      className="flex-1 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};







