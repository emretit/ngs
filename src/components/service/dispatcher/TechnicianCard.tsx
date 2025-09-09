import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  MoreVertical
} from 'lucide-react';
import { ServiceRequest } from '@/hooks/useServiceRequests';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department: string;
  assignedTasks: ServiceRequest[];
  completedTasks: ServiceRequest[];
  pendingTasks: ServiceRequest[];
  urgentTasks: ServiceRequest[];
  utilizationRate: number;
  status: string;
}

interface TechnicianCardProps {
  technician: Technician;
  onAssignTask?: (technicianId: string) => void;
  onViewDetails?: (technicianId: string) => void;
}

export const TechnicianCard: React.FC<TechnicianCardProps> = ({
  technician,
  onAssignTask,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'busy': return 'bg-orange-500';
      case 'overloaded': return 'bg-red-500';
      case 'urgent': return 'bg-red-600 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Müsait';
      case 'moderate': return 'Orta Yük';
      case 'busy': return 'Meşgul';
      case 'overloaded': return 'Aşırı Yük';
      case 'urgent': return 'Acil Görev';
      default: return 'Bilinmiyor';
    }
  };

  const getPerformanceScore = () => {
    const completionRate = technician.assignedTasks.length > 0 
      ? (technician.completedTasks.length / technician.assignedTasks.length) * 100 
      : 0;
    return Math.round(completionRate);
  };

  const performanceScore = getPerformanceScore();

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-gray-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                  {technician.first_name[0]}{technician.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(technician.status)}`}
              />
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">
                {technician.first_name} {technician.last_name}
              </h4>
              <p className="text-sm text-gray-500">{technician.department}</p>
              
              {/* Performance Score */}
              <div className="flex items-center gap-1 mt-1">
                <Award className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600">
                  %{performanceScore} başarı
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={technician.status === 'available' ? 'default' : 'secondary'}
              className={`text-xs font-medium ${
                technician.status === 'available' ? 'bg-green-100 text-green-700' :
                technician.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}
            >
              {getStatusText(technician.status)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(technician.id)}>
                  <User className="h-4 w-4 mr-2" />
                  Detayları Gör
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programı Gör
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Phone className="h-4 w-4 mr-2" />
                  İletişim
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact Info */}
        {(technician.phone || technician.email) && (
          <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
            {technician.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {technician.phone}
              </div>
            )}
            {technician.email && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {technician.email.split('@')[0]}
              </div>
            )}
          </div>
        )}

        {/* Capacity Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Kapasite Kullanımı</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="font-semibold text-gray-900">{Math.round(technician.utilizationRate)}%</span>
            </div>
          </div>
          <Progress 
            value={technician.utilizationRate} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-700">
              {technician.assignedTasks.length}
            </div>
            <div className="text-xs text-blue-600 font-medium">Toplam</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-700">
              {technician.completedTasks.length}
            </div>
            <div className="text-xs text-green-600 font-medium">Tamamlanan</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-orange-700">
              {technician.pendingTasks.length}
            </div>
            <div className="text-xs text-orange-600 font-medium">Bekleyen</div>
          </div>
        </div>

        {/* Urgent Tasks Alert */}
        {technician.urgentTasks.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-700">
                {technician.urgentTasks.length} Acil Görev
              </span>
            </div>
            <div className="mt-1 text-xs text-red-600">
              {technician.urgentTasks.slice(0, 2).map(task => task.title).join(', ')}
              {technician.urgentTasks.length > 2 && '...'}
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        {technician.assignedTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Bugünkü Görevler
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {technician.assignedTasks.slice(0, 3).map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between text-xs p-2 bg-white border rounded-md shadow-sm"
                >
                  <span className="truncate flex-1 font-medium">{task.title}</span>
                  <Badge 
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs ml-2"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {technician.assignedTasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{technician.assignedTasks.length - 3} görev daha...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-xs h-8"
            onClick={() => onViewDetails?.(technician.id)}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Detaylar
          </Button>
          <Button 
            size="sm" 
            variant={technician.status === 'available' ? 'default' : 'outline'}
            className="flex-1 text-xs h-8"
            disabled={technician.status === 'overloaded'}
            onClick={() => onAssignTask?.(technician.id)}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Görev Ata
          </Button>
        </div>
      </div>
    </Card>
  );
};
